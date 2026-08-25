import { httpClient } from './httpClient'
import type { CuentaAlumno, CuentaAlumnoUpdate } from '../types'

const BASE_URL = '/cuentas-alumnos'

export async function getCuentasAlumno(): Promise<CuentaAlumno[]> {
  const { data } = await httpClient.get<CuentaAlumno[]>(`${BASE_URL}/`)
  return data
}

export async function getCuentaAlumno(id: string): Promise<CuentaAlumno> {
  const { data } = await httpClient.get<CuentaAlumno>(`${BASE_URL}/${id}`)
  return data
}

/** Acá sí se puede editar el DNI (a diferencia del resto de entidades, que suelen bloquear
 * el campo identificador). */
export async function updateCuentaAlumno(id: string, values: CuentaAlumnoUpdate): Promise<CuentaAlumno> {
  const { data } = await httpClient.patch<CuentaAlumno>(`${BASE_URL}/${id}`, values)
  return data
}

/** Baja lógica si el alumno tiene historial (matrículas u órdenes); si no tiene, el backend
 * además anonimiza sus datos personales. */
export async function darDeBajaCuenta(id: string): Promise<CuentaAlumno> {
  const { data } = await httpClient.post<CuentaAlumno>(`${BASE_URL}/${id}/dar-de-baja`)
  return data
}

/**
 * No hay endpoint dedicado de reactivación: se usa el PATCH genérico con `estado`.
 * Si la baja anonimizó los datos (cuenta sin historial), reactivar no los recupera
 * — esa pérdida es intencional y ocurrió en el momento de la baja, no aquí.
 */
export async function reactivarCuenta(id: string): Promise<CuentaAlumno> {
  return updateCuentaAlumno(id, { estado: 'activa' })
}
