import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAlumnoAuth } from '@/context/AlumnoAuthContextType'

export default function AlumnoProtectedRoute({ children }: { children: ReactNode }) {
  const { alumno, token, isLoading } = useAlumnoAuth()
  const location = useLocation()

  if (isLoading) return <LoadingSpinner />
  if (!token || !alumno) {
    return <Navigate to="/alumno/login" replace state={{ from: location.pathname }} />
  }
  return children
}
