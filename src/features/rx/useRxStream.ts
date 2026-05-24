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
  const [data, setData]         = useState<SignalData | null>(null)
  const [status, setStatus]     = useState<RxStatus>('connecting')
  const [sampleRate, setSampleRate] = useState(0)

  const wsRef       = useRef<WebSocket | null>(null)
  const workerRef   = useRef<Worker | null>(null)
  const spectroRef  = useRef<number[][]>([])
  const reconnTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const unmounted   = useRef(false)

  // Build the WebSocket URL from config
  const wsUrl = `${config.rxWsUrl}?chunk_duration=${config.rxChunkDuration}`

  // Worker message handler — runs on main thread when worker posts back
  const onWorkerMessage = useCallback((e: MessageEvent<WorkerOutput>) => {
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
          setStatus('silence')
          break
        case 'no_device':
          setStatus('no_device')
          break
        case 'done':
          setStatus('done')
          break
      }
    }

    ws.onerror = () => {
      if (unmounted.current) return
      setStatus('error')
    }

    ws.onclose = () => {
      if (unmounted.current) return
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
      unmounted.current = true
      if (reconnTimer.current) clearTimeout(reconnTimer.current)
      wsRef.current?.close()
      workerRef.current?.terminate()
    }
  }, [connect, onWorkerMessage])

  return { data, status, sampleRate }
}
