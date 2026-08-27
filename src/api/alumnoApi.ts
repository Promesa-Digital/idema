import { httpClient } from './httpClient'
import type { AlumnoPerfil } from '../types/alumno'
import type { CuentaAlumnoEstado } from '../types'
import type { DatosContactoValues } from '../schemas/miCuenta'

export const PERFIL_QUERY_KEY = ['alumno', 'perfil'] as const

interface AlumnoPerfilResponse {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo: string
  telefono?: string
  estado: CuentaAlumnoEstado
}

function mapPerfil(data: AlumnoPerfilResponse): AlumnoPerfil {
  return {
    id: data.id,
    dni: data.dni,
    nombres: data.nombres,
    apellidos: data.apellidos,
    email: data.correo,
    telefono: data.telefono,
    estado: data.estado,
  }
}

export async function fetchMiPerfil(): Promise<AlumnoPerfil> {
  const { data } = await httpClient.get<AlumnoPerfilResponse>('/auth/me')
  return mapPerfil(data)
}

export async function actualizarDatosContacto(values: DatosContactoValues): Promise<AlumnoPerfil> {
  const { data } = await httpClient.patch<AlumnoPerfilResponse>('/auth/me/contacto', {
    correo: values.email,
    telefono: values.telefono,
  })
  return mapPerfil(data)
}

export async function actualizarPassword(values: { passwordActual: string; passwordNueva: string }): Promise<void> {
  await httpClient.patch('/auth/me/password', {
    password_actual: values.passwordActual,
    password_nueva: values.passwordNueva,
  })
}