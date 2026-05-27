import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteHistoryEntry, fetchScanHistory } from '@/api/schedule'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'

const QK = ['scan-history']

export function useScanHistory() {
  return useQuery({
    queryKey: QK,
    queryFn: () => fetchScanHistory(20),
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })
}

export function useDeleteHistory() {
  const qc = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (id: string) => deleteHistoryEntry(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: QK })
      toast('History entry removed', 'info')
    },
    onError: (err: AppError) => toast(err.message, 'error'),
  })
}
