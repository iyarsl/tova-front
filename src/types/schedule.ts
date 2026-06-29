import type { ApiScanRow, ScanRowResult } from './scan'

export type Recurrence = 'none' | 'hourly' | 'daily' | 'weekly' | 'custom'

export interface CreateScheduledScanPayload {
  rows: ApiScanRow[]
  output_dir: string
  mock: boolean
  use_vortex: boolean
  scheduled_at: string
  recurrence: Recurrence
  custom_interval_minutes?: number
}

export interface ScheduledScan {
  id: string
  rows: ApiScanRow[]
  output_dir: string
  mock: boolean
  use_vortex: boolean
  scheduled_at: string
  recurrence: Recurrence
  custom_interval_minutes?: number
  next_run_at: string
  status: 'pending' | 'running' | 'cancelled'
  created_at: string
}

export interface ScanHistoryEntry {
  id: string
  scheduled_scan_id: string
  ran_at: string
  status: 'success' | 'failed' | 'partial'
  output_files: string[]
  error_message?: string
  rows: ApiScanRow[]
  row_results?: ScanRowResult[]
}
