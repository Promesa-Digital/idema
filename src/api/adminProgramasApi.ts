import { httpClient } from './httpClient'
import type { Programa, ProgramaListFilters } from '../types/admin'
import type { CreateProgramaValues, UpdateProgramaValues } from '../schemas/programa'

const BASE_URL = '/admin/programas'

export async function fetchProgramas(filters: ProgramaListFilters = {}): Promise<Programa[]> {
  const { data } = await httpClient.get<Programa[]>(BASE_URL, { params: filters })
  return data
}

export async function fetchPrograma(id: string): Promise<Programa> {
  const { data } = await httpClient.get<Programa>(`${BASE_URL}/${id}`)
  return data
}

export async function createPrograma(values: CreateProgramaValues): Promise<Programa> {
  const { data } = await httpClient.post<Programa>(BASE_URL, values)
  return data
}

export async function updatePrograma(id: string, values: UpdateProgramaValues): Promise<Programa> {
  const { data } = await httpClient.put<Programa>(`${BASE_URL}/${id}`, values)
  return data
}

export async function archivarPrograma(id: string): Promise<Programa> {
  const { data } = await httpClient.patch<Programa>(`${BASE_URL}/${id}/archivar`)
  return data
}

export async function restaurarPrograma(id: string): Promise<Programa> {
  const { data } = await httpClient.patch<Programa>(`${BASE_URL}/${id}/restaurar`)
  return data
}
