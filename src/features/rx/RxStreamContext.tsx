import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { config, MAX_CAPTURE_SEC } from '@/config'
import type { RxStatus, RxWsMessage, WorkerInput, WorkerOutput, SignalData, ZoomLayout, ChartTab, ChartKey, CapturePayload } from '@/types/rx'
import { connectRx, disconnectRx, startStream as apiStartStream, stopStream as apiStopStream, fetchStreamStatus } from '@/api/rx'
import type { RxConnectConfig } from '@/api/rx'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'

// ---- types ------------------------------------------------------------------

export type Tab = ChartTab
export type { ChartKey }

/** Persisted x/y axis range for a single Plotly chart — re-exported from @/types/rx */
export type TabZoom = ZoomLayout

type RxStreamContextType = {
  /** Latest live frame from the stream */
  data: SignalData | null
  status: RxStatus
  sampleRate: number
  /** Currently selected graph tab */
  tab: Tab
  setTab: (t: Tab) => void
  /** Whether the graph is frozen (showing a snapshot) */
  frozen: boolean
  /** The snapshot captured when Freeze was pressed */
  frozenData: SignalData | null
  /** Toggle freeze/resume */
  handleToggle: () => void
  /** The data the chart should actually render (respects freeze) */
  displayData: SignalData | null
  /** Persisted zoom/pan ranges per chart (independent of tab layout) */
  zoomLayouts: Record<ChartKey, TabZoom>
  /** Call from Plot onRelayout to capture zoom state */
  handleRelayout: (chart: ChartKey, event: Plotly.PlotRelayoutEvent) => void
  /** Slice the last durationSec of buffered raw IQ into a CapturePayload, or null if no data */
  buildCapture: (durationSec: number) => CapturePayload | null
  /** Whether a stream was started from this session */
  isStreamStarted: boolean
  /** Connect USRP, start stream; auto-stops+disconnects after durationSec if provided */
  startStream: (config: RxConnectConfig, durationSec?: number) => Promise<void>
  /** Stop stream and disconnect USRP */
  stopStream: () => Promise<void>
}

// ---- context ----------------------------------------------------------------

const RxStreamContext = createContext<RxStreamContextType | null>(null)

// ---- constants --------------------------------------------------------------

const SPEC_ROWS    = 80
const RECONNECT_MS = 3_000

// ---- helpers ----------------------------------------------------------------

function buildFileName(sampleRate: number): string {
  const now = new Date()
  const p = (n: number, d = 2) => String(n).padStart(d, '0')
  return `capture_${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}_${p(now.getHours())}-${p(now.getMinutes())}-${p(now.getSeconds())}_${sampleRate}sps.fc32`
}

// ---- provider ---------------------------------------------------------------

export function RxStreamProvider({ children }: { children: React.ReactNode }) {
  // stream state
  const [data, setData]             = useState<SignalData | null>(null)
  const [status, setStatus]         = useState<RxStatus>('connecting')
  const [sampleRate, setSampleRate] = useState(0)
  const [isStreamStarted, setIsStreamStarted] = useState(false)

  const { toast } = useToast()
  const durationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mirror data in a ref so handleToggle always captures the latest frame,
  // even when called from inside setFrozen's functional updater.
  const dataRef = useRef<SignalData | null>(null)
  useEffect(() => { dataRef.current = data }, [data])

  // UI state — persists across page navigation because provider never unmounts
  const [tab, setTab]               = useState<Tab>('combined')
  const [frozen, setFrozen]         = useState(false)
  const [frozenData, setFrozenData] = useState<SignalData | null>(null)

  // WebSocket / Worker refs
  const wsRef       = useRef<WebSocket | null>(null)
  const workerRef   = useRef<Worker | null>(null)
  const spectroRef  = useRef<number[][]>([])
  const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted   = useRef(false)

  // Rolling raw IQ buffer for capture feature
  const rawIqChunksRef      = useRef<{ samples: Float32Array; sampleRate: number }[]>([])
  const rawIqTotalFloatsRef = useRef(0)
  const latestSrRef         = useRef(0)

  // render-rate control refs (see useRxStream.ts for rationale)
  const isStreaming  = useRef(false)
  const latestOutput = useRef<WorkerOutput | null>(null)
  const rafPending   = useRef<number | null>(null)

  const wsUrl = `${config.rxWsUrl}?silence_duration=${config.rxSilenceDuration}`

  // -- rendering pipeline -----------------------------------------------------

  const stopRendering = useCallback(() => {
    isStreaming.current  = false
    latestOutput.current = null
    if (rafPending.current !== null) {
      cancelAnimationFrame(rafPending.current)
      rafPending.current = null
    }
  }, [])

  const flushOutput = useCallback(() => {
    rafPending.current = null
    if (!isStreaming.current || !latestOutput.current) return

    const { fftY, fftX, timeY, sampleRate: sr } = latestOutput.current
    latestOutput.current = null

    const timeX = timeY.map((_, i) => (i / sr) * 1000)
    spectroRef.current = [...spectroRef.current.slice(-(SPEC_ROWS - 1)), fftY]
    setSampleRate(sr)
    setData({
      time:        { x: timeX, y: timeY },
      fft:         { x: fftX,  y: fftY  },
      spectrogram: spectroRef.current,
    })
  }, [])

  const onWorkerMessage = useCallback((e: MessageEvent<WorkerOutput>) => {
    if (!isStreaming.current) return

    // Accumulate raw IQ for the capture buffer on every frame (not RAF-throttled)
    const { rawSamples, sampleRate: sr } = e.data
    latestSrRef.current = sr
    rawIqChunksRef.current.push({ samples: rawSamples, sampleRate: sr })
    rawIqTotalFloatsRef.current += rawSamples.length
    const maxFloats = MAX_CAPTURE_SEC * sr * 2
    while (rawIqTotalFloatsRef.current > maxFloats && rawIqChunksRef.current.length > 0) {
      const dropped = rawIqChunksRef.current.shift()!
      rawIqTotalFloatsRef.current -= dropped.samples.length
    }

    latestOutput.current = e.data
    if (rafPending.current !== null) return
    rafPending.current = requestAnimationFrame(flushOutput)
  }, [flushOutput])

  // -- WebSocket --------------------------------------------------------------

  const connect = useCallback(() => {
    if (unmounted.current) return

    setStatus('connecting')
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event: MessageEvent<string>) => {
      if (unmounted.current) return
      let msg: RxWsMessage
      try {
        msg = JSON.parse(event.data) as RxWsMessage
      } catch {
        return
      }

      switch (msg.type) {
        case 'data':
          if (msg.samples && msg.length && msg.sample_rate) {
            isStreaming.current = true
            setStatus('streaming')
            const input: WorkerInput = {
              samples:    msg.samples,
              length:     msg.length,
              sampleRate: msg.sample_rate,
            }
            workerRef.current?.postMessage(input)
          }
          break
        case 'silence':
          stopRendering()
          setStatus('silence')
          break
        case 'no_device':
          stopRendering()
          setStatus('no_device')
          break
        case 'done':
          stopRendering()
          setStatus('done')
          break
      }
    }

    ws.onerror = () => {
      if (unmounted.current) return
      stopRendering()
      setStatus('error')
    }

    ws.onclose = () => {
      if (unmounted.current) return
      stopRendering()
      setStatus('error')
      reconnTimer.current = setTimeout(connect, RECONNECT_MS)
    }
  }, [wsUrl, stopRendering])

  // -- lifecycle — runs once, lives for the app session ----------------------

  useEffect(() => {
    unmounted.current = false

    workerRef.current = new Worker(
      new URL('./rxWorker.ts', import.meta.url),
      { type: 'module' },
    )
    workerRef.current.onmessage = onWorkerMessage

    connect()

    return () => {
      unmounted.current = true
      stopRendering()
      if (reconnTimer.current) clearTimeout(reconnTimer.current)
      wsRef.current?.close()
      workerRef.current?.terminate()
    }
  }, [connect, onWorkerMessage, stopRendering])

  // -- stream control ---------------------------------------------------------

  const stopStreamFn = useCallback(async () => {
    if (durationTimerRef.current) {
      clearTimeout(durationTimerRef.current)
      durationTimerRef.current = null
    }
    try { await apiStopStream() } catch { /* already stopped */ }
    try { await disconnectRx() } catch (err) {
      toast((err as AppError).message ?? 'Failed to disconnect RX', 'error')
    }
    setIsStreamStarted(false)
  }, [toast])

  const startStreamFn = useCallback(async (config: RxConnectConfig, durationSec?: number) => {
    try {
      await connectRx(config)
      await apiStartStream()
      setIsStreamStarted(true)
      if (durationSec && durationSec > 0) {
        durationTimerRef.current = setTimeout(() => void stopStreamFn(), durationSec * 1000)
      }
    } catch (err) {
      toast((err as AppError).message ?? 'Failed to start stream', 'error')
      try { await disconnectRx() } catch { /* ignore */ }
      setIsStreamStarted(false)
    }
  }, [toast, stopStreamFn])

  // Initialize isStreamStarted from backend on mount
  useEffect(() => {
    fetchStreamStatus().then(setIsStreamStarted).catch(() => {})
  }, [])

  // Stop stream on unmount if we started it
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) clearTimeout(durationTimerRef.current)
    }
  }, [])

  // -- capture ----------------------------------------------------------------

  const buildCapture = useCallback((durationSec: number): CapturePayload | null => {
    const chunks = rawIqChunksRef.current
    if (chunks.length === 0) return null
    const sr = latestSrRef.current
    if (sr <= 0) return null

    const totalLen = rawIqTotalFloatsRef.current
    const combined = new Float32Array(totalLen)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk.samples, offset)
      offset += chunk.samples.length
    }

    const cappedSec = Math.min(durationSec, MAX_CAPTURE_SEC)
    // Floor to whole complex samples (each = 2 floats) so slice is always a multiple of 8 bytes
    const maxFloats = Math.floor(cappedSec * sr) * 2
    const sliceStart = Math.max(0, combined.length - maxFloats)
    const samples = combined.slice(sliceStart)

    return { samples, sampleRate: sr, fileName: buildFileName(sr) }
  }, [])

  // -- freeze toggle ----------------------------------------------------------

  const handleToggle = useCallback(() => {
    setFrozen(f => {
      if (!f) {
        // capture snapshot on freeze — use ref so we always get the latest frame
        setFrozenData(dataRef.current)
      }
      return !f
    })
  }, [])

  // -- zoom persistence -------------------------------------------------------

  const [zoomLayouts, setZoomLayouts] = useState<Record<ChartKey, TabZoom>>({
    time: {},
    fft: {},
    spectrogram: {},
  })

  const handleRelayout = useCallback((t: ChartKey, event: Plotly.PlotRelayoutEvent) => {
    // Plotly fires events with dotted-key notation at runtime, despite the type saying Partial<Layout>
    const raw = event as unknown as Record<string, unknown>

    // Double-click reset → clear stored zoom
    if (raw['xaxis.autorange'] === true || raw['yaxis.autorange'] === true) {
      setZoomLayouts(prev => ({ ...prev, [t]: {} }))
      return
    }

    const x0 = raw['xaxis.range[0]']
    const x1 = raw['xaxis.range[1]']
    const y0 = raw['yaxis.range[0]']
    const y1 = raw['yaxis.range[1]']

    if (x0 === undefined && x1 === undefined && y0 === undefined && y1 === undefined) return

    setZoomLayouts(prev => {
      const cur = prev[t]
      const update: TabZoom = { ...cur }
      if (typeof x0 === 'number' && typeof x1 === 'number') update.xRange = [x0, x1]
      if (typeof y0 === 'number' && typeof y1 === 'number') update.yRange = [y0, y1]
      return { ...prev, [t]: update }
    })
  }, [])

  // -- derived ----------------------------------------------------------------

  const displayData: SignalData | null = frozen ? frozenData : data

  // -- context value ----------------------------------------------------------

  const ctxValue = useMemo(() => ({
    data,
    status,
    sampleRate,
    tab,
    setTab,
    frozen,
    frozenData,
    handleToggle,
    displayData,
    zoomLayouts,
    handleRelayout,
    buildCapture,
    isStreamStarted,
    startStream: startStreamFn,
    stopStream: stopStreamFn,
  }), [data, status, sampleRate, tab, frozen, frozenData, handleToggle, displayData, zoomLayouts, handleRelayout, buildCapture, isStreamStarted, startStreamFn, stopStreamFn])

  return (
    <RxStreamContext.Provider
      value={ctxValue}
    >
      {children}
    </RxStreamContext.Provider>
  )
}

// ---- consumer hook ----------------------------------------------------------

export function useRxStreamContext(): RxStreamContextType {
  const ctx = useContext(RxStreamContext)
  if (!ctx) throw new Error('useRxStreamContext must be used inside RxStreamProvider')
  return ctx
}
