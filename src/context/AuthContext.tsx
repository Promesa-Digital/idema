import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getMe, loginStaff } from '@/services/authApi'
import { API_TOKEN_STORAGE_KEY } from '@/services/apiClient'
import type { UsuarioBackend } from '@/types/backend'
import { AuthContext } from './AuthContextType'

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(API_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

function persistToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(API_TOKEN_STORAGE_KEY, token)
    } else {
      localStorage.removeItem(API_TOKEN_STORAGE_KEY)
    }
  } catch {
    return
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => readStoredToken())
  const [user, setUser] = useState<UsuarioBackend | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    persistToken(null)
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    let isActive = true

    async function restoreSession() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getMe(token)
        if (isActive) setUser(currentUser)
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
      const session = await loginStaff(correo, password)
      const currentUser = await getMe(session.access_token)
      persistToken(session.access_token)
      setToken(session.access_token)
      setUser(currentUser)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [isLoading, login, logout, token, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
