import { httpClient } from './httpClient'
import type { AlumnoPerfil } from '../types/alumno'
import type { DatosContactoValues } from '../schemas/miCuenta'

interface AlumnoPerfilResponse {
  id: string
  dni: string
  nombres: string
  apellidos: string
  correo: string
  telefono?: string
}

function mapPerfil(data: AlumnoPerfilResponse): AlumnoPerfil {
  return {
    id: data.id,
    dni: data.dni,
    nombres: data.nombres,
    apellidos: data.apellidos,
    email: data.correo,
    telefono: data.telefono,
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