import { apiRequest } from '@/services/apiClient'
import type { UsuarioCreate, UsuarioDirectorio, UsuarioUpdate } from '@/types/backend'

const USUARIOS_PATH = '/api/v1/usuarios'

export function listarUsuarios(): Promise<UsuarioDirectorio[]> {
  return apiRequest<UsuarioDirectorio[]>(`${USUARIOS_PATH}/`)
}

export function crearUsuario(data: UsuarioCreate): Promise<UsuarioDirectorio> {
  return apiRequest<UsuarioDirectorio>(`${USUARIOS_PATH}/`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarUsuario(
  id: string,
  data: UsuarioUpdate,
): Promise<UsuarioDirectorio> {
  return apiRequest<UsuarioDirectorio>(`${USUARIOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function eliminarUsuario(id: string): Promise<UsuarioDirectorio> {
  return apiRequest<UsuarioDirectorio>(`${USUARIOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
