import { use } from 'react'
import { AuthContext } from '@/context/AuthContext'

export function useAuth() {
  return use(AuthContext)
}
