import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchConfig, setRfin, setOutput, setGain,
  setIfbw, invertSpectrum, saveConfig, resumeControl,
} from '@/api/vortex'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'
import type { VortexConfig } from '@/types/vortex'

const QK = ['vortex-config']

export function useVortexConfig() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const query = useQuery({
    queryKey: QK,
    queryFn: fetchConfig,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  })

  function mutation<TVar>(
    fn: (v: TVar) => Promise<void>,
    successMsg: string,
    optimistic?: (v: TVar, old: VortexConfig) => VortexConfig,
  ) {
    return useMutation({
      mutationFn: fn,
      onMutate: async (v: TVar) => {
        if (!optimistic) return
        await qc.cancelQueries({ queryKey: QK })
        const prev = qc.getQueryData<VortexConfig>(QK)
        if (prev) qc.setQueryData(QK, optimistic(v, prev))
        return { prev }
      },
      onError: (err: AppError, _v, ctx) => {
        if (ctx?.prev) qc.setQueryData(QK, ctx.prev)
        void qc.invalidateQueries({ queryKey: QK })
        const message = err.status === 423 ? "You don't have control of the device" : err.message
        toast(message, 'error')
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
    })
  }

  return {
    config:   query.data,
    isLoading: query.isLoading,
    isError:  query.isError,

    rfinMut:   mutation((ghz: number) => setRfin(ghz),   'RF In updated',
                 (ghz, old) => ({ ...old, rfin_ghz: ghz, rfin_hz: Math.round(ghz * 1e9) })),
    outputMut: mutation((mhz: number) => setOutput(mhz), 'Output updated',
                 (mhz, old) => ({ ...old, output_mhz: mhz, output_hz: Math.round(mhz * 1e6) })),
    gainMut:   mutation((db: number)  => setGain(db),    'Gain updated',
                 (db,  old) => ({ ...old, gain_db: db })),
    ifbwMut:   mutation(
      (bw: number) => setIfbw(bw),
      'IF BW updated',
      (bw, old) => ({ ...old, ifbw_mhz: bw }),
    ),
    invertMut: mutation(
      (on: boolean) => invertSpectrum(on),
      'Inversion updated',
      (on, old) => ({ ...old, gain_mode: on ? 1 : 0 }),
    ),
    saveMut:   mutation((_: void) => saveConfig(),   'Config saved to flash'),
    resumeMut: mutation((_: void) => resumeControl(), 'Control released'),
  }
}
