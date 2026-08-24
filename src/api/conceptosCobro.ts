import { httpClient } from './httpClient'
import type { ConceptoCobro, ConceptoCobroTipo } from '../types'
const BASE_URL = '/conceptos-cobro'
export async function getConceptosCobro(): Promise<ConceptoCobro[]> { const { data } = await httpClient.get<ConceptoCobro[]>(`${BASE_URL}/`); return data }
export async function createConceptoCobro(values: { tipo: ConceptoCobroTipo; monto: number; descripcion?: string; programa_id: string }): Promise<ConceptoCobro> { const { data } = await httpClient.post<ConceptoCobro>(`${BASE_URL}/`, values); return data }
export async function deleteConceptoCobro(id: string): Promise<ConceptoCobro> { const { data } = await httpClient.delete<ConceptoCobro>(`${BASE_URL}/${id}`); return data }