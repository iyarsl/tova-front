/**
 * Central application config — all env vars are read here.
 * Import from this module instead of using import.meta.env directly.
 */

/** Same-origin `/api/rx/ws`, derived at runtime so it works in dev (via the Vite proxy) and in the installed bundle alike. */
function sameOriginRxWsUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}/api/rx/ws`
}

export const config = {
  apiBaseUrl:      import.meta.env.VITE_API_BASE_URL      ?? 'http://localhost:8000',
  // `||`, not `??`: an explicitly empty VITE_RX_WS_URL (set by build/assemble_bundle.ps1) must also fall through.
  rxWsUrl:           import.meta.env.VITE_RX_WS_URL             || sameOriginRxWsUrl(),
  rxSilenceDuration: Number(import.meta.env.VITE_RX_SILENCE_DURATION ?? 0.25),
} as const

/** Maximum seconds of raw IQ kept in the rolling capture buffer */
export const MAX_CAPTURE_SEC = 3
