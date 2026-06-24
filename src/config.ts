/**
 * Central application config — all env vars are read here.
 * Import from this module instead of using import.meta.env directly.
 */

export const config = {
  apiBaseUrl:      import.meta.env.VITE_API_BASE_URL      ?? 'http://localhost:8000',
  rxWsUrl:           import.meta.env.VITE_RX_WS_URL             ?? 'ws://localhost:8000/rx/ws',
  rxSilenceDuration: Number(import.meta.env.VITE_RX_SILENCE_DURATION ?? 0.25),
} as const

/** Maximum seconds of raw IQ kept in the rolling capture buffer */
export const MAX_CAPTURE_SEC = 3
