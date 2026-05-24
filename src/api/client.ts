import axios from 'axios'
import { logger } from '@/utils/logger'
import { config } from '@/config'

export type AppError = {
  status: number
  message: string
}

const client = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
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
