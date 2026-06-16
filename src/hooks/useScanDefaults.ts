import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchScanDefaults, updateScanDefaults } from '@/api/scan'
import type { ScanDefaults } from '@/types/scan'

const QUERY_KEY = ['scan-defaults'] as const

export function useScanDefaults() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchScanDefaults,
    staleTime: Infinity,
  })

  const mutation = useMutation({
    mutationFn: updateScanDefaults,
    onSuccess: (updated: ScanDefaults) => {
      qc.setQueryData(QUERY_KEY, updated)
    },
  })

  return { defaults: data, isLoading, mutation }
}
