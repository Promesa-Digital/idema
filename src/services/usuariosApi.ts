import { apiRequest } from '@/services/apiClient'
import type { UsuarioDirectorio } from '@/types/backend'

const USUARIOS_PATH = '/api/v1/usuarios'

export function listarUsuarios(): Promise<UsuarioDirectorio[]> {
  return apiRequest<UsuarioDirectorio[]>(`${USUARIOS_PATH}/`)
}
