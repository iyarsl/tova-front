import { z } from 'zod'
import client from './client'
import type { VortexConfig } from '@/types/vortex'

const VortexConfigSchema = z.object({
  rfin_hz:    z.number(),
  rfin_ghz:   z.number(),
  gain_db:    z.number(),
  output_hz:  z.number(),
  output_mhz: z.number(),
  ifbw_mhz:   z.number(),
  gain_mode:  z.number(),
  version:    z.string(),
})

export async function fetchConfig(): Promise<VortexConfig> {
  const res = await client.get('/vortex/config')
  return VortexConfigSchema.parse(res.data)
}

export async function setRfin(freq_ghz: number): Promise<void> {
  await client.post('/vortex/rfin', { freq_ghz })
}

export async function setOutput(freq_mhz: number): Promise<void> {
  await client.post('/vortex/output', { freq_mhz })
}

export async function setGain(gain_db: number): Promise<void> {
  await client.post('/vortex/gain', { gain_db })
}

export async function setIfbw(bw: number): Promise<void> {
  await client.post('/vortex/ifbw', { bw })
}

export async function invertSpectrum(on: boolean): Promise<void> {
  await client.post('/vortex/invert-spectrum', { on })
}

export async function saveConfig(): Promise<void> {
  await client.post('/vortex/save')
}

export async function resumeControl(): Promise<void> {
  await client.post('/vortex/resume')
}
