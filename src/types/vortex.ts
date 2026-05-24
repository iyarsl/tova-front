export type VortexConfig = {
  rfin_hz: number
  rfin_ghz: number
  gain_db: number
  output_hz: number
  output_mhz: number
  ifbw_mhz: number
  gain_mode: number
  version: string
}

export type VortexMutation =
  | { type: 'rfin';   freq_ghz: number }
  | { type: 'output'; freq_mhz: number }
  | { type: 'gain';   gain_db: number }
  | { type: 'ifbw';   bw: number }
  | { type: 'invert'; on: boolean }
  | { type: 'save' }
  | { type: 'resume' }
