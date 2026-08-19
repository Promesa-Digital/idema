export type UserRole = 'alumno' | 'staff' | 'academico' | 'director_marketing'

export interface AuthUser {
  id: string
  role: UserRole
}
