import { apiRequest } from '@/services/apiClient'
import type {
  AlumnoPerfil,
  AlumnoPerfilUpdate,
  AlumnoRegistro,
  CuentaAlumnoBackend,
  PortalAlumnoHistorial,
} from '@/types/backend'

export const ALUMNO_TOKEN_STORAGE_KEY = 'idema_alumno_token'

interface AlumnoTokenResponse {
  access_token: string
  token_type: string
  rol: 'alumno'
}

interface RegistroResponse {
  id: string
  correo: string
  mensaje: string
}

export function loginAlumno(correo: string, password: string): Promise<AlumnoTokenResponse> {
  return apiRequest<AlumnoTokenResponse>('/api/v1/auth/login/alumno', {
    method: 'POST',
    body: { correo, password },
    token: null,
  })
}

export function registrarAlumno(data: AlumnoRegistro): Promise<RegistroResponse> {
  return apiRequest<RegistroResponse>('/api/v1/auth/registro/alumno', {
    method: 'POST',
    body: data,
    token: null,
  })
}

export function obtenerAlumnoActual(token: string): Promise<AlumnoPerfil> {
  return apiRequest<AlumnoPerfil>('/api/v1/auth/me', { token })
}

export function obtenerHistorialAlumno(token: string): Promise<PortalAlumnoHistorial> {
  return apiRequest<PortalAlumnoHistorial>('/api/v1/cuentas-alumnos/me/historial', { token })
}

export function actualizarPerfilAlumno(
  token: string,
  data: AlumnoPerfilUpdate,
): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>('/api/v1/cuentas-alumnos/me', {
    method: 'PATCH',
    body: data,
    token,
  })
}

export function actualizarConsentimientoAlumno(
  token: string,
  consentimiento: boolean,
): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>('/api/v1/cuentas-alumnos/me/consentimiento', {
    method: 'PATCH',
    body: { consentimiento },
    token,
  })
}

export function actualizarPasswordAlumno(
  token: string,
  passwordActual: string,
  passwordNueva: string,
): Promise<{ mensaje: string }> {
  return apiRequest<{ mensaje: string }>('/api/v1/auth/me/password', {
    method: 'PATCH',
    body: { password_actual: passwordActual, password_nueva: passwordNueva },
    token,
  })
}

export function darDeBajaMiCuenta(token: string): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>('/api/v1/cuentas-alumnos/me/dar-de-baja', {
    method: 'POST',
    token,
  })
}
