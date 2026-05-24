import client from './client'
import type { CreateScheduledScanPayload, ScheduledScan, ScanHistoryEntry } from '@/types/schedule'

export async function createScheduledScan(payload: CreateScheduledScanPayload): Promise<ScheduledScan> {
  const res = await client.post<ScheduledScan>('/scan/schedule', payload)
  return res.data
}

export async function fetchScheduledScans(): Promise<ScheduledScan[]> {
  const res = await client.get<ScheduledScan[]>('/scan/schedule')
  return res.data
}

export async function cancelScheduledScan(id: string): Promise<void> {
  await client.delete(`/scan/schedule/${id}`)
}

export async function fetchScanHistory(limit = 20): Promise<ScanHistoryEntry[]> {
  const res = await client.get<ScanHistoryEntry[]>('/scan/history', { params: { limit } })
  return res.data
}
