/**
 * Central application config — all env vars are read here.
 * Import from this module instead of using import.meta.env directly.
 */
export const config = {
  apiBaseUrl:      import.meta.env.VITE_API_BASE_URL      ?? 'http://localhost:8000',
  rxWsUrl:         import.meta.env.VITE_RX_WS_URL         ?? 'ws://localhost:5000/rx/ws',
  rxChunkDuration: Number(import.meta.env.VITE_RX_CHUNK_DURATION ?? 0.25),
} as const
