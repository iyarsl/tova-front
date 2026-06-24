import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRabbitStatus, toggleRabbit } from '@/api/scan'

const QUERY_KEY = ['rabbitmq-status'] as const

export function useRabbitMq() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchRabbitStatus,
    staleTime: Infinity,
  })

  const mutation = useMutation({
    mutationFn: toggleRabbit,
    onSuccess: (enabled: boolean) => {
      qc.setQueryData(QUERY_KEY, enabled)
    },
  })

  return { enabled: data, isLoading, mutation }
}
