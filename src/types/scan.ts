/** UI/draft state — all numeric fields are nullable until the user fills them */
export type ScanRow = {
  id: string
  duration:          number | null
  entrance_freq_ghz: number | null
  out_freq_mhz:      number | null
  bandwidth:         80 | 160 | 320 | null
  gain_db:           number | null
  sample_rate:       number | null
}

/** Non-nullable form sent to the API — every field must be filled and valid */
export type ApiScanRow = {
  duration:          number
  entrance_freq_ghz: number
  out_freq_mhz:      number
  bandwidth:         80 | 160 | 320
  gain_db:           number
  sample_rate:       number
}

/** Per-row outcome returned by POST /scan/run (and carried in scan history) */
export type ScanRowResult = {
  row_index:   number
  status:      'success' | 'failed'
  output_file: string | null
  error:       string | null
  attempts:    number
}

export type ScanRowErrors = Partial<Record<keyof Omit<ScanRow, 'id'>, string>>

export type ScanDefaults = {
  gain_db:      number
  out_freq_mhz: number
  output_dir:   string
}
