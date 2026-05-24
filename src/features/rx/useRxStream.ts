import { useEffect, useRef, useState, useCallback } from 'react'
import { config } from '@/config'
import type { RxStatus, RxWsMessage, WorkerInput, WorkerOutput, SignalData } from '@/types/rx'

const SPEC_ROWS       = 80
const RECONNECT_MS    = 3_000

export function useRxStream(): {
  data: SignalData | null
  status: RxStatus
  sampleRate: number
} {
  const [data, setData]             = useState<SignalData | null>(null)
  const [status, setStatus]         = useState<RxStatus>('connecting')
  const [sampleRate, setSampleRate] = useState(0)

  const wsRef        = useRef<WebSocket | null>(null)
  const workerRef    = useRef<Worker | null>(null)
  const spectroRef   = useRef<number[][]>([])
  const reconnTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted    = useRef(false)

  // Replace-only dispatch state:
  // workerBusy  — true while the worker is processing a message
  // pendingInput — latest frame that arrived while worker was busy; replaces
  //               any previously pending one so we always show the freshest data
  // isStreaming — false once stream stops; onWorkerMessage becomes a no-op so
  //               the one in-flight frame (if any) is silently discarded
  const workerBusy   = useRef(false)
  const pendingInput = useRef<WorkerInput | null>(null)
  const isStreaming  = useRef(false)

  // Build the WebSocket URL from config
  const wsUrl = `${config.rxWsUrl}?chunk_duration=${config.rxChunkDuration}`

  // Worker message handler — runs on main thread when worker posts back
  const onWorkerMessage = useCallback((e: MessageEvent<WorkerOutput>) => {
    // Kick off the next pending frame immediately (before any setState) so the
    // worker never sits idle while we have fresh data waiting.
    const next = pendingInput.current
    pendingInput.current = null
    if (next !== null) {
      workerRef.current?.postMessage(next)
      // workerBusy stays true — we just dispatched another frame
    } else {
      workerBusy.current = false
    }

    // If the stream already stopped, discard this result rather than updating
    // the chart with stale data.
    if (!isStreaming.current) return

    const { fftY, fftX, timeY, sampleRate: sr } = e.data

    // Build time domain data: x axis in ms
    const timeX = timeY.map((_, i) => (i / sr) * 1000)

    // Rolling spectrogram buffer
    spectroRef.current = [
      ...spectroRef.current.slice(-(SPEC_ROWS - 1)),
      fftY,
    ]

    setSampleRate(sr)
    setData({
      time:        { x: timeX, y: timeY },
      fft:         { x: fftX,  y: fftY  },
      spectrogram: spectroRef.current,
    })
  }, [])

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
            if (workerBusy.current) {
              // Worker is busy — replace pending frame with the freshest one
              pendingInput.current = input
            } else {
              workerBusy.current = true
              workerRef.current?.postMessage(input)
            }
          }
          break
        case 'silence':
          isStreaming.current  = false
          pendingInput.current = null
          setStatus('silence')
          break
        case 'no_device':
          isStreaming.current  = false
          pendingInput.current = null
          setStatus('no_device')
          break
        case 'done':
          isStreaming.current  = false
          pendingInput.current = null
          setStatus('done')
          break
      }
    }

    ws.onerror = () => {
      if (unmounted.current) return
      isStreaming.current  = false
      pendingInput.current = null
      setStatus('error')
    }

    ws.onclose = () => {
      if (unmounted.current) return
      isStreaming.current  = false
      pendingInput.current = null
      setStatus('error')
      reconnTimer.current = setTimeout(connect, RECONNECT_MS)
    }
  }, [wsUrl])

  useEffect(() => {
    unmounted.current = false

    // Create worker once
    workerRef.current = new Worker(
      new URL('./rxWorker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current.onmessage = onWorkerMessage

    // Connect WebSocket
    connect()

    return () => {
      unmounted.current    = true
      isStreaming.current  = false
      pendingInput.current = null
      if (reconnTimer.current) clearTimeout(reconnTimer.current)
      wsRef.current?.close()
      workerRef.current?.terminate()
    }
  }, [connect, onWorkerMessage])

  return { data, status, sampleRate }
}
