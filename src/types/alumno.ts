import type { CuentaAlumnoEstado } from './index'

export interface AlumnoPerfil {
  id: string
  dni: string
  nombres: string
  apellidos: string
  email: string
  telefono?: string
  estado: CuentaAlumnoEstado
}