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

export function solicitarRecuperacionPassword(correo: string): Promise<{ mensaje: string }> {
  return apiRequest<{ mensaje: string }>('/api/v1/auth/password/solicitar', {
    method: 'POST',
    body: { correo },
    token: null,
  })
}

export function restablecerPassword(token: string, passwordNueva: string): Promise<{ mensaje: string }> {
  return apiRequest<{ mensaje: string }>('/api/v1/auth/password/restablecer', {
    method: 'POST',
    body: { token, password_nueva: passwordNueva },
    token: null,
  })
}

export function verificarCorreo(token: string): Promise<{ mensaje: string }> {
  return apiRequest<{ mensaje: string }>('/api/v1/auth/correo/verificar', {
    method: 'POST',
    body: { token },
    token: null,
  })
}

export function reenviarVerificacionCorreo(accessToken: string): Promise<{ mensaje: string }> {
  return apiRequest<{ mensaje: string }>('/api/v1/auth/correo/enviar-verificacion', {
    method: 'POST',
    token: accessToken,
  })
}
