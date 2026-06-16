import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { SESSION_ID } from '@/api/client'
import { fetchControlStatus, acquireControl, heartbeatControl } from '@/api/control'
import { config } from '@/config'

const QK = ['control-status']
const POLL_MS      = 5_000
const HEARTBEAT_MS = 5_000

// Best-effort release on tab close — fetch keepalive survives page unload
// (unlike a plain axios call) and, unlike navigator.sendBeacon, supports the
// X-Session-Id header the backend lock keys off of.
function releaseOnUnload(): void {
  void fetch(`${config.apiBaseUrl}/control/release`, {
    method:    'POST',
    keepalive: true,
    headers:   { 'X-Session-Id': SESSION_ID },
  }).catch(() => {})
}

export function useControlLock(): { hasControl: boolean; owner: string | null; locked: boolean } {
  const qc = useQueryClient()
  const heartbeatTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const query = useQuery({
    queryKey: QK,
    queryFn: fetchControlStatus,
    refetchInterval: POLL_MS,
    refetchIntervalInBackground: false,
  })

  const hasControl = query.data?.held_by_me ?? false

  // Claim the lock once on mount. A 409 just means another tab already
  // owns it — that's expected, not an error worth surfacing.
  useEffect(() => {
    void acquireControl()
      .then(status => qc.setQueryData(QK, status))
      .catch(() => void qc.invalidateQueries({ queryKey: QK }))

    window.addEventListener('beforeunload', releaseOnUnload)
    return () => {
      window.removeEventListener('beforeunload', releaseOnUnload)
      releaseOnUnload()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-claim the moment the lock is free (owner closed/timed out, or our
  // own heartbeat lapsed). Without this a freed lock leaves every tab stuck
  // view-only forever — including the previous owner after a network blip.
  // Backend arbitrates atomically, so if several tabs race here only one wins.
  useEffect(() => {
    if (!query.data || query.data.locked) return
    void acquireControl()
      .then(status => qc.setQueryData(QK, status))
      .catch(() => {})
  }, [query.data, qc])

  // Keep the lock alive with a heartbeat only while we actually hold it.
  useEffect(() => {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current)
      heartbeatTimer.current = null
    }
    if (!hasControl) return

    heartbeatTimer.current = setInterval(() => {
      void heartbeatControl().catch(() => void qc.invalidateQueries({ queryKey: QK }))
    }, HEARTBEAT_MS)

    return () => {
      if (heartbeatTimer.current) clearInterval(heartbeatTimer.current)
    }
  }, [hasControl, qc])

  return { hasControl, owner: query.data?.owner ?? null, locked: query.data?.locked ?? false }
}
