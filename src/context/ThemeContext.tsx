import { createContext, useCallback, useEffect, useMemo, useState } from 'react'

type Theme = 'dark' | 'light'

export type ThemeContextValue = {
  theme: Theme
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggle: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Key bumped to 'dora-theme' so the Dora light theme becomes the canonical
    // default — older saved 'theme' values no longer force dark on first load.
    const stored = localStorage.getItem('dora-theme')
    return stored === 'dark' ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('dora-theme', theme)
  }, [theme])

  const toggle = useCallback(() => setTheme(t => t === 'dark' ? 'light' : 'dark'), [])
  const ctxValue = useMemo(() => ({ theme, toggle }), [theme, toggle])

  return (
    <ThemeContext value={ctxValue}>
      {children}
    </ThemeContext>
  )
}
