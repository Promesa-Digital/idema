export type UserRole = 'alumno' | 'staff'

export interface AuthUser {
  id: string
  role: UserRole
}
