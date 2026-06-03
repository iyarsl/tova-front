import { describe, it, expect } from 'vitest'
import {
  nextPow2,
  fftInPlace,
  ifftInPlace,
  freqMHzForBin,
  bandLimitedTime,
  envelopeDb,
} from './dsp'

/** Build a complex tone at `freqHz` over `n` samples at `sampleRate`. */
function tone(n: number, freqHz: number, sampleRate: number): { re: Float64Array; im: Float64Array } {
  const re = new Float64Array(n)
  const im = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const phase = (2 * Math.PI * freqHz * i) / sampleRate
    re[i] = Math.cos(phase)
    im[i] = Math.sin(phase)
  }
  return { re, im }
}

function maxAbsDiff(a: Float64Array, b: Float64Array): number {
  let m = 0
  for (let i = 0; i < a.length; i++) m = Math.max(m, Math.abs(a[i] - b[i]))
  return m
}

describe('nextPow2', () => {
  it('returns the smallest power of two ≥ n', () => {
    expect(nextPow2(1)).toBe(1)
    expect(nextPow2(3)).toBe(4)
    expect(nextPow2(4096)).toBe(4096)
    expect(nextPow2(4097)).toBe(8192)
  })
})

describe('ifftInPlace', () => {
  it('round-trips FFT→IFFT to the original signal including amplitude (/N scaling)', () => {
    const n = 64
    const sr = 64_000
    const { re, im } = tone(n, 5_000, sr)
    const re0 = re.slice()
    const im0 = im.slice()

    fftInPlace(re, im)
    ifftInPlace(re, im)

    expect(maxAbsDiff(re, re0)).toBeLessThan(1e-9)
    expect(maxAbsDiff(im, im0)).toBeLessThan(1e-9)
  })
})

describe('freqMHzForBin', () => {
  it('maps raw-order bins to signed MHz offsets', () => {
    const n = 8
    const sr = 8e6 // bin = 1 MHz
    expect(freqMHzForBin(0, n, sr)).toBeCloseTo(0)       // DC
    expect(freqMHzForBin(1, n, sr)).toBeCloseTo(1)       // +1 MHz
    expect(freqMHzForBin(n / 2 - 1, n, sr)).toBeCloseTo(3)  // +3 MHz (near top of positive half)
    expect(freqMHzForBin(n / 2, n, sr)).toBeCloseTo(-4)  // −Nyquist (raw order, not display order)
    expect(freqMHzForBin(n - 1, n, sr)).toBeCloseTo(-1)  // −1 MHz
  })
})

describe('bandLimitedTime', () => {
  const n = 256
  const sr = 256_000 // bin = 1 kHz → 0.001 MHz

  it('a full-spectrum band reproduces the original IQ (catches missing /N and shift errors)', () => {
    const { re, im } = tone(n, 10_000, sr)
    const re0 = re.slice()
    const im0 = im.slice()

    fftInPlace(re, im)
    // Band covering everything (±Nyquist in MHz).
    const out = bandLimitedTime(re, im, [-1, 1], n, n, sr)

    expect(maxAbsDiff(out.re, re0)).toBeLessThan(1e-6)
    expect(maxAbsDiff(out.im, im0)).toBeLessThan(1e-6)
  })

  it('passes a tone inside the band and rejects one outside', () => {
    const inHz = 10_000   // 0.010 MHz
    const outHz = 80_000  // 0.080 MHz
    const band: [number, number] = [0.005, 0.015] // MHz — contains inHz, excludes outHz

    // Tone inside the band survives (large envelope).
    const a = tone(n, inHz, sr)
    fftInPlace(a.re, a.im)
    const passed = bandLimitedTime(a.re, a.im, band, n, n, sr)
    const passedEnv = envelopeDb(passed.re, passed.im, n)
    const passedPeak = Math.max(...passedEnv)

    // Tone outside the band is suppressed (tiny envelope, near floor).
    const b = tone(n, outHz, sr)
    fftInPlace(b.re, b.im)
    const rejected = bandLimitedTime(b.re, b.im, band, n, n, sr)
    const rejectedEnv = envelopeDb(rejected.re, rejected.im, n)
    const rejectedPeak = Math.max(...rejectedEnv)

    expect(passedPeak).toBeGreaterThan(rejectedPeak + 40) // ≥40 dB separation
  })

  it('does not alias a negative-frequency tone into a positive band (shift discipline)', () => {
    const negHz = -50_000
    const posBand: [number, number] = [0.045, 0.055] // +45..55 kHz, mirror of negHz

    const t = tone(n, negHz, sr)
    fftInPlace(t.re, t.im)
    const out = bandLimitedTime(t.re, t.im, posBand, n, n, sr)
    const peak = Math.max(...envelopeDb(out.re, out.im, n))

    // If bins were indexed by DC-centered display order, the −50 kHz tone would leak into
    // the mirror +50 kHz band. Correct raw-order mapping suppresses it.
    expect(peak).toBeLessThan(-40)
  })
})

describe('envelopeDb', () => {
  it('computes 20·log10(sqrt(I²+Q²)) per sample', () => {
    const re = Float64Array.from([1, 0, 3])
    const im = Float64Array.from([0, 1, 4]) // magnitudes: 1, 1, 5
    const out = envelopeDb(re, im, 3)
    expect(out[0]).toBeCloseTo(0, 5)
    expect(out[1]).toBeCloseTo(0, 5)
    expect(out[2]).toBeCloseTo(20 * Math.log10(5), 5)
  })
})
