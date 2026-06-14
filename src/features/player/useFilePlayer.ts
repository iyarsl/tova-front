import { useCallback, useEffect, useRef, useState } from 'react'
import { parseFC32 } from '@/utils/parseFC32'
import type { WorkerOutput, SignalData, ZoomLayout, ChartTab } from '@/types/rx'
import type { PlayerWorkerInput } from './playerWorker'

/** Alias of the shared ChartTab — exported so PlayerPage can import it */
export type PlayerTab = ChartTab

/** Serialisable zoom state, one entry per tab */
export type PlayerZoomLayouts = Record<PlayerTab, ZoomLayout>

const CHUNK_SIZE  = 4096  // complex samples per frame
const SPEC_ROWS   = 80    // max spectrogram history rows
const STEP_CHUNKS = 10    // chunks to skip on ◀◀ / ▶▶
const TICK_MS     = 100   // display interval in ms (~10 fps)

// ---- types ------------------------------------------------------------------

export type FilePlayerState = {
  isLoaded:    boolean
  isPlaying:   boolean
  totalChunks: number
  currentChunk: number
  sampleRate:  number
  fileName:    string
  fileSizeBytes: number
  signalData:  SignalData | null
  error:       string | null
}

export type FilePlayerActions = {
  loadFile:       (file: File, sampleRate: number) => Promise<void>
  loadFromBuffer: (samples: Float32Array, sampleRate: number, fileName: string) => void
  clearFile:      () => void
  play:           () => void
  pause:          () => void
  seek:           (chunk: number) => void
  stepBack:       () => void
  stepForward:    () => void
  /** Call from Plotly onRelayout to persist zoom ranges */
  handleRelayout: (tab: PlayerTab, event: Plotly.PlotRelayoutEvent) => void
}

// ---- hook -------------------------------------------------------------------

export function useFilePlayer(): FilePlayerState & FilePlayerActions & { zoomLayouts: PlayerZoomLayouts; tab: PlayerTab; setTab: (t: PlayerTab) => void } {
  // --- reactive state --------------------------------------------------------
  const [isLoaded,    setIsLoaded]    = useState(false)
  const [isPlaying,   setIsPlaying]   = useState(false)
  const [totalChunks, setTotalChunks] = useState(0)
  const [currentChunk, setCurrentChunk] = useState(0)
  const [sampleRate,  setSampleRate]  = useState(0)
  const [fileName,    setFileName]    = useState('')
  const [fileSizeBytes, setFileSizeBytes] = useState(0)
  const [signalData,  setSignalData]  = useState<SignalData | null>(null)
  const [error,       setError]       = useState<string | null>(null)
  const [tab,         setTab]         = useState<PlayerTab>('time')
  const [zoomLayouts, setZoomLayouts] = useState<PlayerZoomLayouts>({
    time: {}, fft: {}, spectrogram: {},
  })

  // --- stable refs (not re-rendered on change) --------------------------------
  const bufferRef       = useRef<Float32Array | null>(null)
  const sampleRateRef   = useRef(0)
  const currentChunkRef = useRef(0)
  const totalChunksRef  = useRef(0)
  const isPlayingRef    = useRef(false)
  const processingRef   = useRef(false)
  const spectroRef      = useRef<number[][]>([])
  const workerRef       = useRef<Worker | null>(null)
  const tickRef         = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- worker lifecycle -------------------------------------------------------
  useEffect(() => {
    const worker = new Worker(
      new URL('./playerWorker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
      processingRef.current = false
      const { fftY, fftX, timeY, sampleRate: sr } = e.data

      const chunkOffset = currentChunkRef.current
      const timeX = timeY.map((_, i) =>
        ((chunkOffset * CHUNK_SIZE + i) / sr) * 1000,  // ms from file start
      )

      spectroRef.current = [...spectroRef.current.slice(-(SPEC_ROWS - 1)), fftY]

      setSignalData({
        time:        { x: timeX, y: timeY },
        fft:         { x: fftX,  y: fftY  },
        spectrogram: spectroRef.current,
      })

      // Advance position
      const nextChunk = currentChunkRef.current + 1
      if (nextChunk >= totalChunksRef.current) {
        // End of file
        isPlayingRef.current = false
        setIsPlaying(false)
        setCurrentChunk(totalChunksRef.current - 1)
        return
      }

      currentChunkRef.current = nextChunk
      setCurrentChunk(nextChunk)

      // Schedule next tick if still playing
      if (isPlayingRef.current) {
        tickRef.current = setTimeout(processCurrentChunk, TICK_MS)
      }
    }

    worker.onerror = () => {
      processingRef.current = false
      setError('Worker FFT error — frame skipped')
      if (isPlayingRef.current) {
        currentChunkRef.current = Math.min(
          currentChunkRef.current + 1,
          totalChunksRef.current - 1,
        )
        tickRef.current = setTimeout(processCurrentChunk, TICK_MS)
      }
    }

    workerRef.current = worker

    return () => {
      if (tickRef.current) clearTimeout(tickRef.current)
      worker.terminate()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- chunk processing -------------------------------------------------------
  const processCurrentChunk = useCallback(() => {
    const buf = bufferRef.current
    const worker = workerRef.current
    if (!buf || !worker || processingRef.current) return

    const chunkIdx  = currentChunkRef.current
    const start     = chunkIdx * CHUNK_SIZE * 2
    if (start >= buf.length) return

    const end         = Math.min(start + CHUNK_SIZE * 2, buf.length)
    const slice       = buf.slice(start, end)          // copy — safe to transfer
    const complexLen  = (end - start) / 2

    processingRef.current = true

    const msg: PlayerWorkerInput = {
      iqChunk:    slice.buffer,
      length:     complexLen,
      sampleRate: sampleRateRef.current,
    }
    worker.postMessage(msg, [slice.buffer])
  }, [])

  // --- public actions ---------------------------------------------------------
  const loadFile = useCallback(async (file: File, sr: number): Promise<void> => {
    // Cancel any ongoing playback and in-flight worker message
    if (tickRef.current) clearTimeout(tickRef.current)
    isPlayingRef.current  = false
    processingRef.current = false  // prevent stale worker response from landing
    setIsPlaying(false)
    setError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()

      // parseFC32 validates internally and throws with a descriptive message if invalid
      const { samples, totalSamples } = parseFC32(arrayBuffer)
      const chunks = Math.ceil(totalSamples / CHUNK_SIZE)

      bufferRef.current       = samples
      sampleRateRef.current   = sr
      currentChunkRef.current = 0
      totalChunksRef.current  = chunks
      spectroRef.current      = []

      setSampleRate(sr)
      setTotalChunks(chunks)
      setCurrentChunk(0)
      setFileName(file.name)
      setFileSizeBytes(file.size)
      setSignalData(null)
      setIsLoaded(true)

      // Render first frame immediately
      processCurrentChunk()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load file'
      setError(msg)
    }
  }, [processCurrentChunk])

  const loadFromBuffer = useCallback((samples: Float32Array, sr: number, fileName: string): void => {
    if (tickRef.current) clearTimeout(tickRef.current)
    isPlayingRef.current  = false
    processingRef.current = false
    setIsPlaying(false)
    setError(null)

    const chunks = Math.ceil(samples.length / 2 / CHUNK_SIZE)

    bufferRef.current       = samples
    sampleRateRef.current   = sr
    currentChunkRef.current = 0
    totalChunksRef.current  = chunks
    spectroRef.current      = []

    setSampleRate(sr)
    setTotalChunks(chunks)
    setCurrentChunk(0)
    setFileName(fileName)
    setFileSizeBytes(samples.byteLength)
    setSignalData(null)
    setIsLoaded(true)

    processCurrentChunk()
  }, [processCurrentChunk])

  const play = useCallback(() => {
    if (!bufferRef.current || isPlayingRef.current) return
    if (currentChunkRef.current >= totalChunksRef.current - 1) {
      // At end — restart from beginning
      currentChunkRef.current = 0
      spectroRef.current = []
      setCurrentChunk(0)
    }
    isPlayingRef.current = true
    setIsPlaying(true)
    tickRef.current = setTimeout(processCurrentChunk, 0)
  }, [processCurrentChunk])

  const pause = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
    if (tickRef.current) clearTimeout(tickRef.current)
  }, [])

  const seek = useCallback((targetChunk: number) => {
    const clamped = Math.max(0, Math.min(targetChunk, totalChunksRef.current - 1))
    if (tickRef.current) clearTimeout(tickRef.current)
    isPlayingRef.current = false
    setIsPlaying(false)
    spectroRef.current    = []
    currentChunkRef.current = clamped
    setCurrentChunk(clamped)
    processCurrentChunk()
  }, [processCurrentChunk])

  const stepBack = useCallback(() => {
    seek(Math.max(0, currentChunkRef.current - STEP_CHUNKS))
  }, [seek])

  const stepForward = useCallback(() => {
    seek(Math.min(totalChunksRef.current - 1, currentChunkRef.current + STEP_CHUNKS))
  }, [seek])

  const clearFile = useCallback(() => {
    if (tickRef.current) clearTimeout(tickRef.current)
    isPlayingRef.current    = false
    bufferRef.current       = null
    sampleRateRef.current   = 0
    currentChunkRef.current = 0
    totalChunksRef.current  = 0
    spectroRef.current      = []
    processingRef.current   = false

    setIsLoaded(false)
    setIsPlaying(false)
    setTotalChunks(0)
    setCurrentChunk(0)
    setSampleRate(0)
    setFileName('')
    setFileSizeBytes(0)
    setSignalData(null)
    setError(null)
  }, [])

  const handleRelayout = useCallback((t: PlayerTab, event: Plotly.PlotRelayoutEvent) => {
    const raw = event as unknown as Record<string, unknown>

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
      const cur: ZoomLayout = prev[t]
      const update: ZoomLayout = { ...cur }
      if (typeof x0 === 'number' && typeof x1 === 'number') update.xRange = [x0, x1]
      if (typeof y0 === 'number' && typeof y1 === 'number') update.yRange = [y0, y1]
      return { ...prev, [t]: update }
    })
  }, [])

  return {
    // state
    isLoaded,
    isPlaying,
    totalChunks,
    currentChunk,
    sampleRate,
    fileName,
    fileSizeBytes,
    signalData,
    error,
    tab,
    zoomLayouts,
    // actions
    loadFile,
    loadFromBuffer,
    clearFile,
    play,
    pause,
    seek,
    stepBack,
    stepForward,
    setTab,
    handleRelayout,
  }
}
