import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchRabbitStatus, toggleRabbit } from '@/api/scan'
import type { AppError } from '@/api/client'

const QUERY_KEY = ['rabbitmq-status'] as const

export function useRabbitMq() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchRabbitStatus,
    staleTime: Infinity,
  })

  const mutation = useMutation<boolean, AppError, boolean>({
    mutationFn: toggleRabbit,
    onSuccess: (enabled: boolean) => {
      qc.setQueryData(QUERY_KEY, enabled)
    },
  })

  return { enabled: data, isLoading, mutation }
}
