export type UserRole = 'alumno' | 'staff' | 'academico'

export interface AuthUser {
  id: string
  role: UserRole
}
