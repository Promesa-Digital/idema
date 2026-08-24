import { httpClient } from './httpClient'
import type { Usuario, UsuarioCreate, UsuarioUpdate } from '../types'

const BASE_URL = '/usuarios'

export async function getUsuarios(): Promise<Usuario[]> {
  const { data } = await httpClient.get<Usuario[]>(`${BASE_URL}/`)
  return data
}

export async function getUsuario(id: string): Promise<Usuario> {
  const { data } = await httpClient.get<Usuario>(`${BASE_URL}/${id}`)
  return data
}

/** El rol "alumno" no existe en UsuarioRol: el tipo ya lo hace irrepresentable desde acá. */
export async function createUsuario(values: UsuarioCreate): Promise<Usuario> {
  const { data } = await httpClient.post<Usuario>(`${BASE_URL}/`, values)
  return data
}

/** El correo es inmutable: no forma parte de UsuarioUpdate, así que no se puede enviar. */
export async function updateUsuario(id: string, values: UsuarioUpdate): Promise<Usuario> {
  const { data } = await httpClient.patch<Usuario>(`${BASE_URL}/${id}`, values)
  return data
}

/** Baja lógica: el backend nunca borra el registro, solo pasa `estado` a "inactivo"
 * (y rechaza la operación si dejaría el sistema sin ningún admin_sistema activo). */
export async function deleteUsuario(id: string): Promise<Usuario> {
  const { data } = await httpClient.delete<Usuario>(`${BASE_URL}/${id}`)
  return data
}
