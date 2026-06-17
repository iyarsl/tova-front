import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchConfig, setRfin, setOutput, setGain,
  setIfbw, invertSpectrum, saveConfig, resumeControl,
} from '@/api/vortex'
import { useToast } from '@/components/Toast'
import { config as appConfig } from '@/config'
import type { AppError } from '@/api/client'
import type { VortexConfig } from '@/types/vortex'

const QK = ['vortex-config']

export function useVortexConfig() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data, isLoading, isError } = useQuery({
    queryKey: QK,
    queryFn: fetchConfig,
    enabled: appConfig.useVortex,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })

  function mutOpts<TVar>(
    fn: (v: TVar) => Promise<void>,
    successMsg: string,
    optimistic?: (v: TVar, old: VortexConfig) => VortexConfig,
  ) {
    return {
      mutationFn: fn,
      onMutate: async (v: TVar): Promise<{ prev?: VortexConfig }> => {
        if (!optimistic) return {}
        await qc.cancelQueries({ queryKey: QK })
        const prev = qc.getQueryData<VortexConfig>(QK)
        if (prev) qc.setQueryData(QK, optimistic(v, prev))
        return { prev }
      },
      onError: (err: AppError, _v: TVar, ctx: { prev?: VortexConfig } | undefined) => {
        if (ctx?.prev) qc.setQueryData(QK, ctx.prev)
        void qc.invalidateQueries({ queryKey: QK })
        toast(err.message, 'error')
      },
      onSuccess: () => {
        toast(successMsg, 'success')
        if (optimistic) {
          // Delay refetch so the backend has time to commit before we
          // overwrite the optimistic state with a stale server response.
          setTimeout(() => void qc.invalidateQueries({ queryKey: QK }), 800)
        } else {
          void qc.invalidateQueries({ queryKey: QK })
        }
      },
    }
  }

  const rfinMut   = useMutation(mutOpts((ghz: number) => setRfin(ghz),   'RF In updated',
                      (ghz, old) => ({ ...old, rfin_ghz: ghz, rfin_hz: Math.round(ghz * 1e9) })))
  const outputMut = useMutation(mutOpts((mhz: number) => setOutput(mhz), 'Output updated',
                      (mhz, old) => ({ ...old, output_mhz: mhz, output_hz: Math.round(mhz * 1e6) })))
  const gainMut   = useMutation(mutOpts((db: number)  => setGain(db),    'Gain updated',
                      (db,  old) => ({ ...old, gain_db: db })))
  const ifbwMut   = useMutation(mutOpts(
    (bw: number) => setIfbw(bw),
    'IF BW updated',
    (bw, old) => ({ ...old, ifbw_mhz: bw }),
  ))
  const invertMut = useMutation(mutOpts(
    (on: boolean) => invertSpectrum(on),
    'Inversion updated',
    (on, old) => ({ ...old, gain_mode: on ? 1 : 0 }),
  ))
  const saveMut   = useMutation(mutOpts((_: void) => saveConfig(),    'Config saved to flash'))
  const resumeMut = useMutation(mutOpts((_: void) => resumeControl(), 'Control released'))

  return {
    config:    data,
    isLoading,
    isError,
    rfinMut,
    outputMut,
    gainMut,
    ifbwMut,
    invertMut,
    saveMut,
    resumeMut,
  }
}
