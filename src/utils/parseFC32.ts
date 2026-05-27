/**
 * .fc32 — raw complex float32 IQ samples
 * Format: [I₀, Q₀, I₁, Q₁, …] — each complex sample is 2 × f32 (8 bytes total)
 */

export type ParseFC32Result = {
  /** Interleaved I/Q float32 array (length = totalSamples × 2) */
  samples: Float32Array
  /** Number of complex IQ samples */
  totalSamples: number
  /** Duration in seconds given a sample rate */
  durationSeconds: (sampleRate: number) => number
}

export type FC32ValidationResult = { valid: true } | { valid: false; error: string }

/** Validate raw ArrayBuffer from a .fc32 file without parsing it */
export function validateFC32(buffer: ArrayBuffer): FC32ValidationResult {
  if (buffer.byteLength === 0) {
    return { valid: false, error: 'File is empty' }
  }
  if (buffer.byteLength % 8 !== 0) {
    return {
      valid: false,
      error: `Invalid .fc32 — file size (${buffer.byteLength.toLocaleString()} bytes) is not a multiple of 8`,
    }
  }
  return { valid: true }
}

/**
 * Parse a .fc32 ArrayBuffer into a typed result.
 * Throws if the buffer is invalid.
 */
export function parseFC32(buffer: ArrayBuffer): ParseFC32Result {
  const validation = validateFC32(buffer)
  if (!validation.valid) throw new Error(validation.error)

  const samples = new Float32Array(buffer)
  const totalSamples = samples.length / 2

  return {
    samples,
    totalSamples,
    durationSeconds: (sampleRate: number) => totalSamples / sampleRate,
  }
}
