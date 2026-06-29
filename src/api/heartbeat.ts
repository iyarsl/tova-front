import client from './client'
import type { HeartbeatResponse } from '@/types/heartbeat'

export async function fetchHeartbeat(): Promise<HeartbeatResponse | null> {
  const res = await client.get<HeartbeatResponse | null>('/heartbeat')
  return res.data ?? null
}
