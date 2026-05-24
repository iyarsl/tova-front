import { useEffect, useRef, useState, useCallback } from 'react'
import { config } from '@/config'
import type { RxStatus, RxWsMessage, WorkerInput, WorkerOutput, SignalData } from '@/types/rx'

const SPEC_ROWS    = 80
const RECONNECT_MS = 3_000

export function useRxStream(): {
  data: SignalData | null
  status: RxStatus
  sampleRate: number
} {
  const [data, setData]             = useState<SignalData | null>(null)
  const [status, setStatus]         = useState<RxStatus>('connecting')
  const [sampleRate, setSampleRate] = useState(0)

  const wsRef       = useRef<WebSocket | null>(null)
  const workerRef   = useRef<Worker | null>(null)
  const spectroRef  = useRef<number[][]>([])
  const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted   = useRef(false)

  // ----- render-rate control ------------------------------------------------
  // The 4096-pt FFT completes in microseconds, so worker results arrive faster
  // than the event loop can drain WebSocket messages.  Without throttling,
  // every buffered frame causes a Plotly re-render — the chart keeps updating
  // for seconds after the stream stops.
  //
  // Solution: funnel ALL chart updates through requestAnimationFrame.
  //   • latestOutput — overwritten by every incoming worker result; only the
  //     most recent one is ever rendered (one render per ~16 ms visual frame)
  //   • rafPending   — non-null while an rAF is already scheduled
  //   • isStreaming  — set false on any stop event; the rAF callback bails out,
  //     so the chart freezes within one visual frame of the stop signal
  // --------------------------------------------------------------------------
  const isStreaming  = useRef(false)
  const latestOutput = useRef<WorkerOutput | null>(null)
  const rafPending   = useRef<number | null>(null)

  const wsUrl = `${config.rxWsUrl}?chunk_duration=${config.rxChunkDuration}`

  // Cancel any queued render and clear buffered data.
  // Called the moment any stop/error event arrives — chart freezes immediately.
  const stopRendering = useCallback(() => {
    isStreaming.current  = false
    latestOutput.current = null
    if (rafPending.current !== null) {
      cancelAnimationFrame(rafPending.current)
      rafPending.current = null
    }
  }, [])

  // rAF callback — runs at most once per visual frame.
  // Bails immediately if streaming stopped between schedule time and fire time.
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

  // Worker message handler — store the result and schedule one rAF render.
  // Multiple worker completions between two rAF ticks collapse to one render
  // (the freshest data wins).
  const onWorkerMessage = useCallback((e: MessageEvent<WorkerOutput>) => {
    if (!isStreaming.current) return       // stream stopped — discard

    latestOutput.current = e.data          // always keep freshest result

    if (rafPending.current !== null) return // render already scheduled
    rafPending.current = requestAnimationFrame(flushOutput)
  }, [flushOutput])

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
            isStreaming.current = true   // re-enable on reconnect
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

  useEffect(() => {
    unmounted.current = false

    workerRef.current = new Worker(
      new URL('./rxWorker.ts', import.meta.url),
      { type: 'module' }
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

  return { data, status, sampleRate }
}
