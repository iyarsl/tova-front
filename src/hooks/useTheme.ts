import { use } from 'react'
import { ThemeContext } from '@/context/ThemeContext'

export function useTheme() {
  return use(ThemeContext)
}
