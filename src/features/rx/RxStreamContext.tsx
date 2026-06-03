import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { config } from '@/config'
import type {
  RxStatus,
  RxWsMessage,
  WorkerInput,
  WorkerOutput,
  SignalData,
  ZoomLayout,
  RxTab,
  ChartId,
  BottomMode,
} from '@/types/rx'

// ---- types ------------------------------------------------------------------

export type Tab = RxTab

/** Persisted x/y axis range for a single Plotly chart — re-exported from @/types/rx */
export type TabZoom = ZoomLayout

type RxStreamContextType = {
  data: SignalData | null
  status: RxStatus
  sampleRate: number
  tab: RxTab
  setTab: (t: RxTab) => void
  frozen: boolean
  frozenData: SignalData | null
  handleToggle: () => void
  /** The data the chart should actually render (respects freeze) */
  displayData: SignalData | null
  /** Persisted zoom/pan ranges per chart */
  zoomLayouts: Record<ChartId, TabZoom>
  /** Call from Plot onRelayout to capture zoom state (and drive the band filter) */
  handleRelayout: (chart: ChartId, event: Plotly.PlotRelayoutEvent) => void
  /** Whether the FFT zoom drives the time-domain bandpass filter */
  linked: boolean
  setLinked: (v: boolean) => void
  /** How the bottom (time-domain) chart draws the band */
  bottomMode: BottomMode
  setBottomMode: (m: BottomMode) => void
}

// ---- context ----------------------------------------------------------------

const RxStreamContext = createContext<RxStreamContextType | null>(null)

// ---- constants --------------------------------------------------------------

const SPEC_ROWS     = 80
const RECONNECT_MS  = 3_000
const REFILTER_MS   = 80   // debounce window for on-demand re-filter on zoom

// ---- helpers ----------------------------------------------------------------

type RawFrame = { samples: string; length: number; sampleRate: number }

/** Normalise a Plotly x-range into an ascending [lo, hi] band. */
function normalizeBand(r: readonly [number, number]): [number, number] {
  return r[0] <= r[1] ? [r[0], r[1]] : [r[1], r[0]]
}

// ---- provider ---------------------------------------------------------------

export function RxStreamProvider({ children }: { children: React.ReactNode }) {
  // stream state
  const [data, setData]             = useState<SignalData | null>(null)
  const [status, setStatus]         = useState<RxStatus>('connecting')
  const [sampleRate, setSampleRate] = useState(0)

  // Mirror data in a ref so handleToggle always captures the latest frame.
  const dataRef = useRef<SignalData | null>(null)
  useEffect(() => { dataRef.current = data }, [data])

  // UI state — persists across navigation because the provider never unmounts
  const [tab, setTab]               = useState<RxTab>('analyze')
  const [frozen, setFrozen]         = useState(false)
  const [frozenData, setFrozenData] = useState<SignalData | null>(null)
  const [linked, setLinkedState]    = useState(true)
  const [bottomMode, setBottomMode] = useState<BottomMode>('envelope')

  // WebSocket / Worker refs
  const wsRef       = useRef<WebSocket | null>(null)
  const workerRef   = useRef<Worker | null>(null)
  const spectroRef  = useRef<number[][]>([])
  const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted   = useRef(false)

  // render-rate control refs (see useRxStream.ts for rationale)
  const isStreaming  = useRef(false)
  const latestOutput = useRef<WorkerOutput | null>(null)
  const rafPending   = useRef<number | null>(null)

  // filter / re-filter refs
  const bandRef        = useRef<readonly [number, number] | undefined>(undefined)
  const lastFrameRef   = useRef<RawFrame | null>(null)
  const frozenFrameRef = useRef<RawFrame | null>(null)
  const frozenRef      = useRef(false)
  const refilterTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reqCounter     = useRef(0)
  // The single in-flight on-demand re-filter; results not matching are dropped.
  const refilterRef    = useRef<{ id: number; target: 'frozen' | 'live' } | null>(null)

  const wsUrl = `${config.rxWsUrl}?chunk_duration=${config.rxChunkDuration}`

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

    const { fftY, fftX, timeY, envDb, sampleRate: sr } = latestOutput.current
    latestOutput.current = null

    const timeX = timeY.map((_, i) => (i / sr) * 1000)
    spectroRef.current = [...spectroRef.current.slice(-(SPEC_ROWS - 1)), fftY]
    setSampleRate(sr)
    setData({
      time:        { x: timeX, y: timeY, envDb },
      fft:         { x: fftX,  y: fftY  },
      spectrogram: spectroRef.current,
    })
  }, [])

  const onWorkerMessage = useCallback((e: MessageEvent<WorkerOutput>) => {
    const msg = e.data

    // On-demand re-filter results carry a requestId; live frames do not.
    if (msg.requestId !== undefined) {
      const pending = refilterRef.current
      if (!pending || msg.requestId !== pending.id) return  // superseded or rejected (e.g. resumed)
      refilterRef.current = null

      const { timeY, envDb, sampleRate: sr } = msg
      const timeX = timeY.map((_, i) => (i / sr) * 1000)
      const time = { x: timeX, y: timeY, envDb }
      if (pending.target === 'frozen') {
        setFrozenData(prev => (prev ? { ...prev, time } : prev))
      } else {
        setData(prev => (prev ? { ...prev, time } : prev))
      }
      return
    }

    // Live stream frame.
    if (!isStreaming.current) return
    latestOutput.current = msg
    if (rafPending.current !== null) return
    rafPending.current = requestAnimationFrame(flushOutput)
  }, [flushOutput])

  // -- on-demand re-filter ----------------------------------------------------

  /** Re-run the bandpass on the currently held frame and route the result. */
  const postRefilter = useCallback(() => {
    const worker = workerRef.current
    if (!worker) return
    const frame = frozenRef.current ? frozenFrameRef.current : lastFrameRef.current
    if (!frame) return

    const id = ++reqCounter.current
    refilterRef.current = { id, target: frozenRef.current ? 'frozen' : 'live' }
    const input: WorkerInput = {
      samples:    frame.samples,
      length:     frame.length,
      sampleRate: frame.sampleRate,
      filterBand: bandRef.current,
      requestId:  id,
    }
    worker.postMessage(input)
  }, [])

  const scheduleRefilter = useCallback(() => {
    if (refilterTimer.current) clearTimeout(refilterTimer.current)
    refilterTimer.current = setTimeout(postRefilter, REFILTER_MS)
  }, [postRefilter])

  /** Recompute the active band from linked + the FFT x-zoom. */
  const recomputeBand = useCallback((isLinked: boolean, fftZoom: ZoomLayout) => {
    bandRef.current = isLinked && fftZoom.xRange ? normalizeBand(fftZoom.xRange) : undefined
  }, [])

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
            lastFrameRef.current = {
              samples:    msg.samples,
              length:     msg.length,
              sampleRate: msg.sample_rate,
            }
            const input: WorkerInput = {
              samples:    msg.samples,
              length:     msg.length,
              sampleRate: msg.sample_rate,
              filterBand: bandRef.current,
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
      if (refilterTimer.current) clearTimeout(refilterTimer.current)
      wsRef.current?.close()
      workerRef.current?.terminate()
    }
  }, [connect, onWorkerMessage, stopRendering])

  // -- zoom persistence -------------------------------------------------------

  const [zoomLayouts, setZoomLayouts] = useState<Record<ChartId, TabZoom>>({
    time: {},
    fft: {},
    spectrogram: {},
  })

  const handleRelayout = useCallback((chart: ChartId, event: Plotly.PlotRelayoutEvent) => {
    // Plotly fires events with dotted-key notation at runtime, despite the type saying Partial<Layout>
    const raw = event as unknown as Record<string, unknown>

    const isReset = raw['xaxis.autorange'] === true || raw['yaxis.autorange'] === true

    const x0 = raw['xaxis.range[0]']
    const x1 = raw['xaxis.range[1]']
    const y0 = raw['yaxis.range[0]']
    const y1 = raw['yaxis.range[1]']

    if (!isReset && x0 === undefined && x1 === undefined && y0 === undefined && y1 === undefined) return

    setZoomLayouts(prev => {
      const next = { ...prev }
      if (isReset) {
        next[chart] = {}
      } else {
        const update: TabZoom = { ...prev[chart] }
        if (typeof x0 === 'number' && typeof x1 === 'number') update.xRange = [x0, x1]
        if (typeof y0 === 'number' && typeof y1 === 'number') update.yRange = [y0, y1]
        next[chart] = update
      }

      // FFT zoom change drives the band filter; clear the time chart's y-zoom so a
      // narrow band (small amplitude / very negative dB) always auto-ranges into view.
      if (chart === 'fft') {
        recomputeBand(linked, next.fft)
        next.time = { ...next.time, yRange: undefined }
        scheduleRefilter()
      }

      return next
    })
  }, [linked, recomputeBand, scheduleRefilter])

  // -- linked toggle ----------------------------------------------------------

  const setLinked = useCallback((v: boolean) => {
    setLinkedState(v)
    recomputeBand(v, zoomLayouts.fft)
    scheduleRefilter()
  }, [recomputeBand, scheduleRefilter, zoomLayouts.fft])

  // -- freeze toggle ----------------------------------------------------------

  const handleToggle = useCallback(() => {
    setFrozen(f => {
      const next = !f
      frozenRef.current = next
      if (next) {
        // Freeze: snapshot the displayed frame and the raw samples behind it.
        setFrozenData(dataRef.current)
        frozenFrameRef.current = lastFrameRef.current
      } else {
        // Resume: reject any in-flight frozen re-filter so it can't clobber live data.
        refilterRef.current = null
        if (refilterTimer.current) clearTimeout(refilterTimer.current)
      }
      return next
    })
  }, [])

  // -- derived ----------------------------------------------------------------

  const displayData: SignalData | null = frozen ? frozenData : data

  // -- context value ----------------------------------------------------------

  return (
    <RxStreamContext.Provider
      value={{
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
        linked,
        setLinked,
        bottomMode,
        setBottomMode,
      }}
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
