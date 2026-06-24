import type { VortexConfig } from '@/types/vortex'

export const IFBW_320_OUTPUT_MHZ = 1250

export function isOutputLocked(ifbw_mhz: number): boolean {
  return ifbw_mhz === 320
}

function is320Hidden(version: string): boolean {
  return version === '1.0.1A'
}

export function isIfbwDisabled(version: string): boolean {
  return version === '1.0.1C'
}

export function availableBandwidths(version: string): number[] {
  if (isIfbwDisabled(version)) return []
  if (is320Hidden(version))    return [80, 160]
  return [80, 160, 320]
}

export function effectiveOutput(config: Pick<VortexConfig, 'output_mhz' | 'ifbw_mhz'>): number {
  return isOutputLocked(config.ifbw_mhz) ? IFBW_320_OUTPUT_MHZ : config.output_mhz
}
