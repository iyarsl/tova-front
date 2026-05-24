import type { WorkerInput, WorkerOutput } from '@/types/rx'

// Max IQ samples fed into the FFT.  Limits chart output to ≤ this many bins.
// nextPow2(250 000) = 262 144 — that's 21 M heatmap cells/frame.  4096 gives
// 244 Hz/bin resolution across the full ±500 kHz BW: plenty for display.
const MAX_FFT_SAMPLES = 4096

// ---------------------------------------------------------------------------
// Cooley-Tukey radix-2 in-place FFT (complex input)
// re[] and im[] are modified in-place; length must be a power of 2.
// ---------------------------------------------------------------------------
function fftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length

  // Bit-reversal permutation
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

  // Butterfly passes
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

// Next power of 2 >= n
function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

// ---------------------------------------------------------------------------
// Worker entry point
// ---------------------------------------------------------------------------
self.onmessage = (e: MessageEvent<WorkerInput>) => {
  const { samples, length, sampleRate } = e.data

  // 1. Decode base64 → Float32Array (interleaved I, Q, I, Q, ...)
  const binary = atob(samples)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  const iq = new Float32Array(bytes.buffer)

  // 2. Separate I and Q into padded Float64 arrays for FFT
  //    Cap at MAX_FFT_SAMPLES so Plotly never receives millions of points.
  const fftLen = Math.min(length, MAX_FFT_SAMPLES)
  const n = nextPow2(fftLen)
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  for (let i = 0; i < fftLen; i++) {
    re[i] = iq[i * 2]       // I sample
    im[i] = iq[i * 2 + 1]   // Q sample
  }

  // 3. Time domain — I channel only (before FFT modifies re[])
  const timeY = Array.from(re.subarray(0, fftLen)) as number[]

  // 4. Complex FFT in-place
  fftInPlace(re, im)

  // 5. Magnitude → dBm, DC-centered
  //    Raw bins: [0, 1, ..., N/2-1, -N/2, ..., -1]
  //    DC-centered: swap upper and lower halves
  const half = n >> 1
  const fftY = new Array<number>(n)
  const fftX = new Array<number>(n)
  const EPS = 1e-12
  const binHz = sampleRate / n

  for (let k = 0; k < n; k++) {
    // DC-center: bin k maps to display index (k + half) % n
    const src = k
    const dst = (k + half) % n
    const mag = Math.sqrt(re[src] * re[src] + im[src] * im[src]) / n
    fftY[dst] = 20 * Math.log10(mag + EPS)
    // Frequency offset in MHz: centered around 0
    fftX[dst] = ((k < half ? k : k - n) * binHz) / 1e6
  }

  const output: WorkerOutput = { fftY, fftX, timeY, sampleRate }
  self.postMessage(output)
}
