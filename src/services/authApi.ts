import { apiRequest } from '@/services/apiClient'
import type { TokenResponse, UsuarioBackend } from '@/types/backend'

export function loginStaff(correo: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>('/api/v1/auth/login/staff', {
    method: 'POST',
    body: { correo, password },
    token: null,
  })
}

export function getMe(token: string): Promise<UsuarioBackend> {
  return apiRequest<UsuarioBackend>('/api/v1/auth/me', { token })
}
