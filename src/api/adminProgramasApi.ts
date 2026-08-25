import { httpClient } from './httpClient'
import type { Programa, ProgramaListFilters } from '../types/admin'
import type { CreateProgramaValues, UpdateProgramaValues } from '../schemas/programa'

// El backend monta el router en /programas (sin prefijo /admin) y el listado
// completo ya exige rol; el catálogo público vive aparte en /programas/publicos.
const BASE_URL = '/programas'

export async function fetchProgramas(filters: ProgramaListFilters = {}): Promise<Programa[]> {
  const { data } = await httpClient.get<Programa[]>(`${BASE_URL}/`, { params: filters })
  return data
}

export async function fetchPrograma(id: string): Promise<Programa> {
  const { data } = await httpClient.get<Programa>(`${BASE_URL}/${id}`)
  return data
}

export async function createPrograma(values: CreateProgramaValues): Promise<Programa> {
  const { data } = await httpClient.post<Programa>(`${BASE_URL}/`, values)
  return data
}

/**
 * PATCH, no PUT: el backend expone una actualización parcial (ProgramaUpdate
 * tiene todos los campos opcionales). `codigo` es inmutable — el schema está
 * declarado con extra='forbid', así que enviarlo hace fallar la petición
 * completa con 422.
 */
export async function updatePrograma(id: string, values: Partial<UpdateProgramaValues>): Promise<Programa> {
  const payload = { ...values } as Partial<UpdateProgramaValues> & { codigo?: string }
  delete payload.codigo
  const { data } = await httpClient.patch<Programa>(`${BASE_URL}/${id}`, payload)
  return data
}

export async function archivarPrograma(id: string): Promise<Programa> {
  const { data } = await httpClient.patch<Programa>(`${BASE_URL}/${id}/archivar`)
  return data
}

/**
 * El backend no expone un endpoint `/restaurar` dedicado: un programa archivado
 * se reactiva con el mismo PATCH de actualización, mandando `estado: 'no_publicado'`.
 */
export async function restaurarPrograma(id: string): Promise<Programa> {
  return updatePrograma(id, { estado: 'no_publicado' })
}
