import { createContext, useContext } from 'react'
import type { AlumnoPerfil } from '@/types/backend'

export interface AlumnoAuthContextType {
  alumno: AlumnoPerfil | null
  token: string | null
  isLoading: boolean
  login: (correo: string, password: string) => Promise<void>
  logout: () => void
  refreshAlumno: () => Promise<void>
}

export const AlumnoAuthContext = createContext<AlumnoAuthContextType | undefined>(undefined)

export function useAlumnoAuth() {
  const context = useContext(AlumnoAuthContext)
  if (!context) throw new Error('useAlumnoAuth debe usarse dentro de AlumnoAuthProvider')
  return context
}
