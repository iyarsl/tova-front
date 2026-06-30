import { useQuery } from '@tanstack/react-query'
import { fetchAppSettings } from '@/api/settings'

/** Default applied once the fetch settles unsuccessfully — matches the
 *  previous VITE_USE_VORTEX default so a backend hiccup never bricks the UI. */
const USE_VORTEX_FALLBACK = false

type AppSettingsState = {
  /** undefined while the first fetch is in flight; a concrete boolean once settled. */
  useVortex: boolean | undefined
  /** True only during the initial load — gate "disabled" branches on this. */
  isPending: boolean
}

/**
 * App-level settings fetched from the backend (source of truth: config.yaml).
 * Replaces the build-time VITE_USE_VORTEX env flag.
 *
 * Gate "disabled" UI on `isPending` — do NOT treat `undefined` as `false`.
 */
export function useAppSettings(): AppSettingsState {
  const { data, isPending } = useQuery({
    queryKey: ['app-settings'],
    queryFn: fetchAppSettings,
    staleTime: Infinity,
    retry: 1,
  })

  return {
    useVortex: isPending ? undefined : (data?.use_vortex ?? USE_VORTEX_FALLBACK),
    isPending,
  }
}
