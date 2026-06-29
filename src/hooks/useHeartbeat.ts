import { useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHeartbeat } from '@/api/heartbeat'
import type { HeartbeatDevice, HeartbeatStatus } from '@/types/heartbeat'

export function useHeartbeat(): {
  status: HeartbeatStatus
  device: HeartbeatDevice | null
  isLoading: boolean
} {
  const prevPollCountRef = useRef<number | null>(null)
  const stalledCountRef  = useRef(0)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['heartbeat'],
    queryFn: fetchHeartbeat,
    refetchInterval: 8_000,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 0,
  })

  if (!isLoading && !isError && data !== undefined) {
    const currentCount = data?.poll_count ?? null
    if (currentCount !== null) {
      if (prevPollCountRef.current === currentCount) {
        stalledCountRef.current += 1
      } else {
        stalledCountRef.current = 0
        prevPollCountRef.current = currentCount
      }
    }
  }

  let status: HeartbeatStatus

  if (isError) {
    status = 'unreachable'
  } else if (isLoading) {
    status = 'initializing'
  } else if (data === null || data === undefined) {
    status = 'initializing'
  } else if (stalledCountRef.current >= 2) {
    status = 'stalled'
  } else if (!data.connected) {
    status = 'no_device'
  } else if (data.devices.some(d => d.in_use)) {
    status = 'active'
  } else {
    status = 'ready'
  }

  const device = data?.devices?.[0] ?? null

  return { status, device, isLoading }
}
