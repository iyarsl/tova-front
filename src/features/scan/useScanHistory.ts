import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteHistoryEntry, fetchScanHistory } from '@/api/schedule'
import { useToast } from '@/components/Toast'
import type { AppError } from '@/api/client'

const QK = ['scan-history']
const HISTORY_WINDOW_MS = 48 * 60 * 60 * 1000

export function useScanHistory() {
  const query = useQuery({
    queryKey: QK,
    queryFn: () => fetchScanHistory(200),
    refetchInterval: 10_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const cutoff = Date.now() - HISTORY_WINDOW_MS
  const filtered = query.data?.filter(e => new Date(e.ran_at).getTime() >= cutoff)

  return { ...query, data: filtered }
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
