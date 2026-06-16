import axios from 'axios'
import { logger } from '@/utils/logger'
import { config } from '@/config'

export type AppError = {
  status: number
  message: string
}

// crypto.randomUUID requires a secure context (HTTPS or localhost) and is
// undefined when this app is served plain-HTTP over a LAN — exactly the
// multi-user deployment this lock exists for. Fall back to a manual random id.
function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `sess-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

// One id per browser tab — identifies this tab to the backend's device
// control lock (see src/features/vortex/useControlLock.ts). Not persisted to
// localStorage on purpose: each tab is its own session.
export const SESSION_ID = generateSessionId()

const client = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use(req => {
  req.headers['X-Session-Id'] = SESSION_ID
  return req
})

client.interceptors.response.use(
  res => res,
  err => {
    const status: number = err.response?.status ?? 0
    const raw = err.response?.data?.detail
    const message: string = Array.isArray(raw)
      ? raw.map((e: { loc?: string[]; msg: string }) =>
          `${e.loc?.slice(1).join('.') ?? 'field'}: ${e.msg}`
        ).join(' | ')
      : (raw ?? err.message ?? 'Unknown error')
    logger.error(`[API] ${status} ${message}`)
    const appError: AppError = { status, message }
    return Promise.reject(appError)
  },
)

export default client
