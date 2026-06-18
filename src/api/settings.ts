import { z } from 'zod'
import client from './client'

const AppSettingsSchema = z.object({
  use_vortex: z.boolean(),
})

export type AppSettings = z.infer<typeof AppSettingsSchema>

export async function fetchAppSettings(): Promise<AppSettings> {
  const res = await client.get('/vortex/use-vortex')
  return AppSettingsSchema.parse(res.data)
}
