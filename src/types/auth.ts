export type UserRole =
  | 'alumno'
  | 'academico'
  | 'administracion'
  | 'admin_sistema'
  | 'marketing'
  | 'director_marketing'
  | 'ventas'

export interface AuthUser {
  id: string
  role: UserRole
  nombre?: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  alumno: 'Alumno',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
  marketing: 'Marketing',
  director_marketing: 'Director de Marketing',
  ventas: 'Ventas',
}
