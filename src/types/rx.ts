/** Shared tab type for the file-player chart views (time | fft | spectrogram) */
export type ChartTab = 'time' | 'fft' | 'spectrogram'

/** Selected view tab on the RX page */
export type RxTab = 'analyze' | 'spectrogram'

/** Identifies a single RX chart for persisted zoom state */
export type ChartId = 'fft' | 'time' | 'spectrogram'

/** How the RX bottom (time-domain) chart draws the band */
export type BottomMode = 'envelope' | 'waveform'

/** Persisted x/y axis range for a single Plotly chart */
export type ZoomLayout = {
  xRange?: readonly [number, number]
  yRange?: readonly [number, number]
}

/**
 * Shape of signal data consumed by the chart views.
 * `time.y` is the time-domain waveform (I-channel amplitude). `time.envDb` is an optional
 * band power envelope in dB (RX filter feature only) — undefined for the file player.
 */
export type SignalData = {
  time:        { x: number[]; y: number[]; envDb?: number[] }
  fft:         { x: number[]; y: number[] }
  spectrogram: number[][]
}

export type RxMessageType = 'data' | 'silence' | 'no_device' | 'done'

export interface RxWsMessage {
  type: RxMessageType
  samples?: string      // base64-encoded complex64 (interleaved float32 I/Q)
  length?: number       // number of complex samples
  sample_rate?: number  // Hz
}

export type RxStatus =
  | 'connecting'
  | 'streaming'
  | 'silence'
  | 'no_device'
  | 'done'
  | 'error'

/** Sent from main thread → worker */
export interface WorkerInput {
  samples: string   // base64 string
  length: number    // number of complex samples
  sampleRate: number
  /** Bandpass window in MHz offset from center (lo < hi). Omit for no filter. */
  filterBand?: readonly [number, number]
  /** Echoed back so the main thread can route on-demand re-filter results. */
  requestId?: number
}

/** Sent from worker → main thread */
export interface WorkerOutput {
  fftY: number[]      // power in dBm, DC-centered (length = next power-of-2 ≥ input length)
  fftX: number[]      // frequency offset in MHz from center (same length as fftY)
  timeY: number[]     // time-domain amplitude (filtered I-channel for RX; raw I for player)
  sampleRate: number
  /** dB power envelope of the (band-limited) signal — RX filter feature only. */
  envDb?: number[]
  /** Echoed from the matching WorkerInput, for routing on-demand re-filters. */
  requestId?: number
}
