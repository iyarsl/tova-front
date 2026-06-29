export type HeartbeatDevice = {
  serial: string
  type: string
  name: string
  args: string
  in_use: boolean
}

export type HeartbeatResponse = {
  connected: boolean
  devices: HeartbeatDevice[]
  polled_at: string
  poll_count: number
}

export type HeartbeatStatus =
  | 'initializing'
  | 'ready'
  | 'active'
  | 'no_device'
  | 'stalled'
  | 'unreachable'
