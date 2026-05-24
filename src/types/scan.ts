export type ScanRow = {
  id: string
  duration: number
  entrance_freq_ghz: number
  out_freq_mhz: number
  bandwidth: 80 | 160 | 320
  gain_db: number
  sample_rate: number
}

export type ScanRowErrors = Partial<Record<keyof Omit<ScanRow, 'id'>, string>>
