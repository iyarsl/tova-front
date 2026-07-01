import { useState } from 'react'

const KEY = 'sidebar_collapsed'

export function useSidebarCollapsed(): [boolean, (updater: boolean | ((c: boolean) => boolean)) => void] {
  const [collapsed, setCollapsedState] = useState(() => localStorage.getItem(KEY) === 'true')

  function setCollapsed(updater: boolean | ((c: boolean) => boolean)) {
    setCollapsedState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(KEY, String(next))
      return next
    })
  }

  return [collapsed, setCollapsed]
}
