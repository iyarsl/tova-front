/**
 * Pure DSP helpers for the RX signal pipeline.
 *
 * Kept free of any Worker/React dependency so they can be unit-tested directly.
 * The RX worker imports these; the bandpass filter (zero out-of-band FFT bins → IFFT)
 * powers the "zoom the FFT to filter the time domain" feature.
 */

/** dB floor — log of zero magnitude; matches the worker's display-FFT epsilon. */
export const EPS = 1e-12

/** Width (in bins, each side) of the raised-cosine transition at the band edges. */
const TAPER_BINS = 4

/** Smallest power of two ≥ n. */
export function nextPow2(n: number): number {
  let p = 1
  while (p < n) p <<= 1
  return p
}

/**
 * In-place Cooley-Tukey radix-2 complex FFT. `re`/`im` are modified in place;
 * length must be a power of two. Forward transform is unnormalized.
 */
export function fftInPlace(re: Float64Array, im: Float64Array): void {
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

/**
 * In-place inverse FFT. Uses the conjugation identity
 * `IFFT(X) = (1/N)·conj(FFT(conj(X)))`. The `/N` makes `ifftInPlace(fftInPlace(x)) === x`,
 * so filtered amplitudes match the unfiltered signal.
 */
export function ifftInPlace(re: Float64Array, im: Float64Array): void {
  const n = re.length
  for (let i = 0; i < n; i++) im[i] = -im[i]
  fftInPlace(re, im)
  for (let i = 0; i < n; i++) {
    re[i] = re[i] / n
    im[i] = -im[i] / n
  }
}

/**
 * Physical frequency offset (MHz from center) of a **raw-order** FFT bin `k`
 * (bins `0..n/2-1` are positive, `n/2..n-1` are negative). The bandpass operates on the
 * raw, un-shifted spectrum, so this must be used — never the DC-centered display index.
 */
export function freqMHzForBin(k: number, n: number, sampleRate: number): number {
  const binHz = sampleRate / n
  const signed = k < n / 2 ? k : k - n
  return (signed * binHz) / 1e6
}

/**
 * Gain (0..1) for a bin at frequency `fMHz` given a passband `[lo, hi]` (MHz) with a
 * raised-cosine transition of half-width `wMHz` straddling each edge. Full gain inside the
 * band, smooth ramp across the transition, zero outside — suppresses Gibbs ringing.
 */
function edgeGain(fMHz: number, lo: number, hi: number, wMHz: number): number {
  if (fMHz >= lo && fMHz <= hi) return 1
  if (wMHz > 0 && fMHz < lo && fMHz >= lo - wMHz) {
    const t = (fMHz - (lo - wMHz)) / wMHz
    return 0.5 * (1 - Math.cos(Math.PI * t))
  }
  if (wMHz > 0 && fMHz > hi && fMHz <= hi + wMHz) {
    const t = (hi + wMHz - fMHz) / wMHz
    return 0.5 * (1 - Math.cos(Math.PI * t))
  }
  return 0
}

/**
 * Band-limit a spectrum and return the resulting time-domain signal.
 *
 * @param re,im   The complex spectrum in **raw bin order** (output of `fftInPlace`).
 *                Not mutated — a copy is filtered.
 * @param band    `[lo, hi]` MHz offset from center (order-independent).
 * @param n       FFT size (power of two; = re.length).
 * @param fftLen  Number of valid time samples to return.
 * @param sampleRate Hz.
 * @returns The filtered `{ re, im }` time samples (length `fftLen`).
 */
export function bandLimitedTime(
  re: Float64Array,
  im: Float64Array,
  band: readonly [number, number],
  n: number,
  fftLen: number,
  sampleRate: number,
): { re: Float64Array; im: Float64Array } {
  const lo = Math.min(band[0], band[1])
  const hi = Math.max(band[0], band[1])
  const wMHz = (TAPER_BINS * (sampleRate / n)) / 1e6

  const fRe = re.slice(0, n)
  const fIm = im.slice(0, n)
  for (let k = 0; k < n; k++) {
    const gain = edgeGain(freqMHzForBin(k, n, sampleRate), lo, hi, wMHz)
    fRe[k] *= gain
    fIm[k] *= gain
  }

  ifftInPlace(fRe, fIm)
  return { re: fRe.subarray(0, fftLen), im: fIm.subarray(0, fftLen) }
}

/**
 * Power envelope in dB: `20·log10(sqrt(I²+Q²) + eps)` per sample.
 */
export function envelopeDb(
  re: Float64Array,
  im: Float64Array,
  fftLen: number,
  eps = EPS,
): number[] {
  const out = new Array<number>(fftLen)
  for (let i = 0; i < fftLen; i++) {
    const mag = Math.sqrt(re[i] * re[i] + im[i] * im[i])
    out[i] = 20 * Math.log10(mag + eps)
  }
  return out
}
