import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createScheduledScan, fetchScheduledScans, cancelScheduledScan } from '@/api/schedule'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'
import type { CreateScheduledScanPayload } from '@/types/schedule'

const QK = ['scheduled-scans']

export function useScheduledScans() {
  return useQuery({
    queryKey: QK,
    queryFn: fetchScheduledScans,
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

export function useCreateSchedule() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (payload: CreateScheduledScanPayload) => createScheduledScan(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK })
      toast('Scan scheduled successfully', 'success')
    },
    onError: (err: AppError) =>
      toast(
        err.status === 404
          ? 'Schedule endpoint unavailable — backend not ready'
          : err.message,
        'error',
      ),
  })
}

export function useCancelSchedule() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => cancelScheduledScan(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK })
      toast('Schedule cancelled', 'info')
    },
    onError: (err: AppError) => toast(err.message, 'error'),
  })
}
