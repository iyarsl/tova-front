/**
 * Player worker — accepts raw Float32Array IQ chunks (no base64 decode needed).
 * Shares the same WorkerOutput shape as rxWorker.ts for compatibility with
 * the shared chart components.
 */
import type { WorkerOutput } from '@/types/rx'

/** Player worker has no raw IQ to transfer back — main thread already holds the full buffer */
export type PlayerWorkerOutput = Omit<WorkerOutput, 'rawSamples'>

export interface PlayerWorkerInput {
  /** Transferable: Float32Array(iqChunk) = interleaved I/Q samples */
  iqChunk: ArrayBuffer
  /** Number of complex samples in iqChunk */
  length: number
  sampleRate: number
}

// Max IQ samples fed into the FFT — matches rxWorker.ts constant
const MAX_FFT_SAMPLES = 4096

// ---------------------------------------------------------------------------
// Cooley-Tukey radix-2 in-place FFT — identical to rxWorker implementation
// ---------------------------------------------------------------------------
function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length

  let j = 0
  for (let i = 1; i < n; i++) {
    let bit = n >> 1
    for (; j & bit; bit >>= 1) j ^= bit
    j ^= bit
    if (i < j) {
      ;[re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]]
    }
  }

  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1
    const angleStep = (-2 * Math.PI) / len
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < half; k++) {
        const angle = angleStep * k
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        const tRe = cos * re[i + k + half] - sin * im[i + k + half]
        const tIm = sin * re[i + k + half] + cos * im[i + k + half]
        re[i + k + half] = re[i + k] - tRe
        im[i + k + half] = im[i + k] - tIm
        re[i + k] += tRe
        im[i + k] += tIm
      }
    }
  }
}

function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------
self.onmessage = (e: MessageEvent<PlayerWorkerInput>) => {
  const { iqChunk, length, sampleRate } = e.data
  const iq = new Float32Array(iqChunk)

  const fftLen = Math.min(length, MAX_FFT_SAMPLES)
  const n = nextPow2(fftLen)
  const re = new Float64Array(n)
  const im = new Float64Array(n)

  for (let i = 0; i < fftLen; i++) {
    re[i] = iq[i * 2]
    im[i] = iq[i * 2 + 1]
  }

  // Time domain (I-channel) — captured before FFT mutates re[]
  const timeY = Array.from(re.subarray(0, fftLen)) as number[]

  // In-place FFT
  fftInPlace(re, im)

  // Magnitude → dBm, DC-centered
  const half = n >> 1
  const fftY = new Array<number>(n)
  const fftX = new Array<number>(n)
  const EPS = 1e-12
  const binHz = sampleRate / n

  for (let k = 0; k < n; k++) {
    const dst = (k + half) % n
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / n
    fftY[dst] = 20 * Math.log10(mag + EPS)
    fftX[dst] = ((k < half ? k : k - n) * binHz) / 1e6
  }

  const output: PlayerWorkerOutput = { fftY, fftX, timeY, sampleRate }
  self.postMessage(output)
}
