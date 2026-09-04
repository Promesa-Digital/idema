import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/context/AuthContextType'
import type { UsuarioRol } from '@/types/backend'

const DEFAULT_ALLOWED_ROLES: UsuarioRol[] = ['academico', 'administracion', 'admin_sistema']

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UsuarioRol[]
}

export default function ProtectedRoute({
  children,
  allowedRoles = DEFAULT_ALLOWED_ROLES,
}: ProtectedRouteProps) {
  const { user, token, isLoading, logout } = useAuth()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner />

  if (!token || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (!allowedRoles.includes(user.rol)) {
    return (
      <main className="grid min-h-screen place-items-center bg-surface px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-xl">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-primary">
            Acceso restringido
          </p>
          <h1 className="mb-3 text-3xl font-bold text-dark">No tienes permiso</h1>
          <p className="mb-6 text-slate-600">
            Tu cuenta no tiene uno de los roles habilitados para gestionar programas.
          </p>
          <Button variant="secondary" onClick={logout}>
            Cerrar sesión
          </Button>
        </section>
      </main>
    )
  }

  return children
}
