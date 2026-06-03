import type { WorkerInput, WorkerOutput } from '@/types/rx'
import { EPS, nextPow2, fftInPlace, bandLimitedTime, envelopeDb } from '@/utils/dsp'

// Max IQ samples fed into the FFT.  Limits chart output to ≤ this many bins.
// nextPow2(250 000) = 262 144 — that's 21 M heatmap cells/frame.  4096 gives
// 244 Hz/bin resolution across the full ±500 kHz BW: plenty for display.
const MAX_FFT_SAMPLES = 4096

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------
self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { samples, length, sampleRate, filterBand, requestId } = e.data

  // 1. Decode base64 → Float32Array (interleaved I, Q, I, Q, ...)
  const binary = atob(samples)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const iq = new Float32Array(bytes.buffer)

  // 2. Separate I and Q into padded Float64 arrays for FFT.
  //    Cap at MAX_FFT_SAMPLES so Plotly never receives millions of points.
  //    No pre-FFT time window: a window would impose an artificial taper on the
  //    reconstructed (IFFT) envelope at frame edges.
  const fftLen = Math.min(length, MAX_FFT_SAMPLES)
  const n = nextPow2(fftLen)
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  for (let i = 0; i < fftLen; i++) {
    re[i] = iq[i * 2]       // I sample
    im[i] = iq[i * 2 + 1]   // Q sample
  }

  // 3. Capture the full-signal time samples before the in-place FFT overwrites re/im.
  const re0 = re.slice(0, fftLen)
  const im0 = im.slice(0, fftLen)

  // 4. Complex FFT in-place → re/im now hold the raw-order spectrum.
  fftInPlace(re, im)

  // 5. Magnitude → dBm, DC-centered (display FFT — unchanged behaviour).
  const half = n >> 1
  const fftY = new Array<number>(n)
  const fftX = new Array<number>(n)
  const binHz = sampleRate / n

  for (let k = 0; k < n; k++) {
    const dst = (k + half) % n
    const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]) / n
    fftY[dst] = 20 * Math.log10(mag + EPS)
    fftX[dst] = ((k < half ? k : k - n) * binHz) / 1e6
  }

  // 6. Time-domain trace: band-limited (IFFT) when a filter band is set, else full signal.
  const time = filterBand
    ? bandLimitedTime(re, im, filterBand, n, fftLen, sampleRate)
    : { re: re0, im: im0 }

  const waveform = Array.from(time.re) as number[]
  const envDb = envelopeDb(time.re, time.im, fftLen)

  const output: WorkerOutput = {
    fftY,
    fftX,
    timeY: waveform,
    envDb,
    sampleRate,
    requestId,
  }
  self.postMessage(output)
}
