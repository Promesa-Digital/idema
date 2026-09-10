import { apiRequest } from '@/services/apiClient'
import type { AlumnoPerfilUpdate, CuentaAlumnoBackend, CuentaAlumnoEstado } from '@/types/backend'

const CUENTAS_ALUMNO_PATH = '/api/v1/cuentas-alumnos'

export function listarCuentasAlumno(): Promise<CuentaAlumnoBackend[]> {
  return apiRequest<CuentaAlumnoBackend[]>(`${CUENTAS_ALUMNO_PATH}/`)
}

export function obtenerCuentaAlumno(id: string): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>(`${CUENTAS_ALUMNO_PATH}/${encodeURIComponent(id)}`)
}

export function actualizarCuentaAlumno(
  id: string,
  data: AlumnoPerfilUpdate & { estado?: CuentaAlumnoEstado },
): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>(`${CUENTAS_ALUMNO_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function darDeBajaCuentaAlumno(id: string): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>(
    `${CUENTAS_ALUMNO_PATH}/${encodeURIComponent(id)}/dar-de-baja`,
    { method: 'POST' },
  )
}
