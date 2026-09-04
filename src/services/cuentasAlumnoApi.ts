import { apiRequest } from '@/services/apiClient'
import type { CuentaAlumnoBackend } from '@/types/backend'

const CUENTAS_ALUMNO_PATH = '/api/v1/cuentas-alumnos'

export function listarCuentasAlumno(): Promise<CuentaAlumnoBackend[]> {
  return apiRequest<CuentaAlumnoBackend[]>(`${CUENTAS_ALUMNO_PATH}/`)
}

export function obtenerCuentaAlumno(id: string): Promise<CuentaAlumnoBackend> {
  return apiRequest<CuentaAlumnoBackend>(`${CUENTAS_ALUMNO_PATH}/${encodeURIComponent(id)}`)
}
