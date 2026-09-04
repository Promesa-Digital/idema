import { createContext, useContext } from 'react'
import type { UsuarioBackend } from '@/types/backend'

export interface AuthContextType {
  user: UsuarioBackend | null
  token: string | null
  isLoading: boolean
  login: (correo: string, password: string) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
