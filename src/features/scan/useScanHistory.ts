import { useQuery } from '@tanstack/react-query'
import { fetchScanHistory } from '@/api/schedule'

export function useScanHistory() {
  return useQuery({
    queryKey: ['scan-history'],
    queryFn: () => fetchScanHistory(20),
    refetchInterval: 10000,
  })
}
