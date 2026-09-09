import { httpClient } from './httpClient'

export interface RegistroAlumnoValues {
  nombres: string
  apellidos: string
  dni: string
  correo: string
  telefono: string
  password: string
  consentimiento: boolean
}

export async function registrarAlumno(values: RegistroAlumnoValues): Promise<{ id: string; correo: string; mensaje: string }> {
  const { data } = await httpClient.post('/auth/registro/alumno', values)
  return data
}