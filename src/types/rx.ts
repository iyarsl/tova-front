/** Shape of signal data consumed by RxPage charts */
export type SignalData = {
  time:        { x: number[]; y: number[] }
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
}

/** Sent from worker → main thread */
export interface WorkerOutput {
  fftY: number[]      // power in dBm, DC-centered (length = next power-of-2 ≥ input length)
  fftX: number[]      // frequency offset in MHz from center (same length as fftY)
  timeY: number[]     // I-channel amplitude values (length = input length)
  sampleRate: number
}
