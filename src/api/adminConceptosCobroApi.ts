import { httpClient } from './httpClient'
import type { ConceptoCobro, ConceptoCobroListFilters } from '../types/admin'
import type { ConceptoCobroFormValues } from '../schemas/conceptoCobro'

const BASE_URL = '/admin/conceptos-cobro'

export async function fetchConceptosCobro(filters: ConceptoCobroListFilters = {}): Promise<ConceptoCobro[]> {
  const { data } = await httpClient.get<ConceptoCobro[]>(BASE_URL, { params: filters })
  return data
}

export async function fetchConceptoCobro(id: string): Promise<ConceptoCobro> {
  const { data } = await httpClient.get<ConceptoCobro>(`${BASE_URL}/${id}`)
  return data
}

export async function createConceptoCobro(values: ConceptoCobroFormValues): Promise<ConceptoCobro> {
  const { data } = await httpClient.post<ConceptoCobro>(BASE_URL, values)
  return data
}

export async function updateConceptoCobro(id: string, values: ConceptoCobroFormValues): Promise<ConceptoCobro> {
  const { data } = await httpClient.put<ConceptoCobro>(`${BASE_URL}/${id}`, values)
  return data
}

export async function archivarConceptoCobro(id: string): Promise<ConceptoCobro> {
  const { data } = await httpClient.patch<ConceptoCobro>(`${BASE_URL}/${id}/archivar`)
  return data
}

export async function restaurarConceptoCobro(id: string): Promise<ConceptoCobro> {
  const { data } = await httpClient.patch<ConceptoCobro>(`${BASE_URL}/${id}/restaurar`)
  return data
}
