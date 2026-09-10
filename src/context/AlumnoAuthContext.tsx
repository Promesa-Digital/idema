import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  ALUMNO_TOKEN_STORAGE_KEY,
  loginAlumno,
  obtenerAlumnoActual,
} from '@/services/alumnoApi'
import type { AlumnoPerfil } from '@/types/backend'
import { AlumnoAuthContext } from './AlumnoAuthContextType'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(ALUMNO_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistToken(token: string | null) {
  try {
    if (token) localStorage.setItem(ALUMNO_TOKEN_STORAGE_KEY, token)
    else localStorage.removeItem(ALUMNO_TOKEN_STORAGE_KEY)
  } catch {
    return
  }
}

export function AlumnoAuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [alumno, setAlumno] = useState<AlumnoPerfil | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    persistToken(null)
    setToken(null)
    setAlumno(null)
  }, [])

  const refreshAlumno = useCallback(async () => {
    if (!token) return
    const perfil = await obtenerAlumnoActual(token)
    setAlumno(perfil)
  }, [token])

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      if (!token) {
        setIsLoading(false)
        return
      }
      try {
        const perfil = await obtenerAlumnoActual(token)
        if (isActive) setAlumno(perfil)
      } catch {
        if (isActive) logout()
      } finally {
        if (isActive) setIsLoading(false)
      }
    }

    void restoreSession()
    return () => {
      isActive = false
    }
  }, [logout, token])

  const login = useCallback(async (correo: string, password: string) => {
    setIsLoading(true)
    try {
      const session = await loginAlumno(correo, password)
      const perfil = await obtenerAlumnoActual(session.access_token)
      persistToken(session.access_token)
      setToken(session.access_token)
      setAlumno(perfil)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({ alumno, token, isLoading, login, logout, refreshAlumno }),
    [alumno, isLoading, login, logout, refreshAlumno, token],
  )

  return <AlumnoAuthContext.Provider value={value}>{children}</AlumnoAuthContext.Provider>
}
