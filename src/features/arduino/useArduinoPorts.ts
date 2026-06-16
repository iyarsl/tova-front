import { useEffect, useRef, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchPorts, restartArduino, setPort } from '@/api/arduino'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'
import type { PortState } from '@/types/arduino'

const QK = ['arduino-ports']
const REBOOT_SAFETY_MS = 4000

export function useArduinoPorts() {
  const qc = useQueryClient()
  const { toast } = useToast()

  const [isRestarting, setIsRestarting] = useState(false)
  const restartedAtRef = useRef(0)
  const restartSafetyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const query = useQuery({
    queryKey: QK,
    queryFn: fetchPorts,
    refetchInterval: 20000,
    refetchIntervalInBackground: false,
    placeholderData: keepPreviousData,
  })

  // Clear the "rebooting" state as soon as a poll lands that's newer than
  // the restart call — the safety timeout below is just a fallback.
  useEffect(() => {
    if (isRestarting && query.dataUpdatedAt > restartedAtRef.current) {
      setIsRestarting(false)
    }
  }, [isRestarting, query.dataUpdatedAt])

  const toggleMut = useMutation({
    mutationFn: ({ name, on }: { name: string; on: boolean }) => setPort(name, on),
    onMutate: async ({ name, on }) => {
      await qc.cancelQueries({ queryKey: QK })
      const prev = qc.getQueryData<PortState[]>(QK)
      if (prev) {
        qc.setQueryData<PortState[]>(QK, prev.map(p => (p.name === name ? { ...p, on } : p)))
      }
      return { prev }
    },
    onError: (err: AppError, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(QK, ctx.prev)
      void qc.invalidateQueries({ queryKey: QK })
      toast(err.message, 'error')
    },
    onSuccess: (_d, { name, on }) => {
      toast(`${name} turned ${on ? 'ON' : 'OFF'}`, 'success')
      setTimeout(() => void qc.invalidateQueries({ queryKey: QK }), 800)
    },
  })

  const restartMut = useMutation({
    mutationFn: restartArduino,
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: QK })
      if (restartSafetyTimerRef.current) clearTimeout(restartSafetyTimerRef.current)
      restartedAtRef.current = Date.now()
      setIsRestarting(true)
      restartSafetyTimerRef.current = setTimeout(() => setIsRestarting(false), REBOOT_SAFETY_MS)
    },
    onError: (err: AppError) => {
      setIsRestarting(false)
      toast(err.message, 'error')
    },
    onSuccess: () => {
      toast('Device restarting…', 'info')
    },
  })

  return {
    ports: query.data ?? [],
    isLoading: query.isLoading,
    isRestarting,
    pendingPortName: toggleMut.isPending ? toggleMut.variables?.name : undefined,
    toggleMut,
    restartMut,
  }
}
