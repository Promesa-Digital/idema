import { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { tokenStorage } from '../api/tokenStorage'
import { AUTH_LOGOUT_EVENT } from '../api/authEvents'
import { decodeJwtPayload } from '../utils/jwt'
import { AuthContext } from './AuthContextType'
import type { AuthUser, UserRole } from '../types/auth'

interface AccessTokenPayload {
  sub: string
  rol: UserRole
  nombre?: string
}

/**
 * El backend siempre firma el claim de rol como `rol` (español) con el valor real
 * ('ventas', 'admin_sistema', etc.) — antes esto se colapsaba a un 'staff' genérico,
 * lo que hacía imposible construir un menú de administración específico por rol.
 */
function readUserFromToken(): AuthUser | null {
  const accessToken = tokenStorage.getAccessToken()
  if (!accessToken) return null

  const payload = decodeJwtPayload<AccessTokenPayload>(accessToken)
  if (!payload?.sub || !payload?.rol) return null

  return { id: payload.sub, role: payload.rol, nombre: payload.nombre }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readUserFromToken())

  const login = useCallback((accessToken: string, refreshToken: string) => {
    tokenStorage.setTokens(accessToken, refreshToken)
    const nextUser = readUserFromToken()
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    tokenStorage.clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    const handleAuthLogout = () => setUser(null)
    window.addEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout)
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleAuthLogout)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, logout }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
