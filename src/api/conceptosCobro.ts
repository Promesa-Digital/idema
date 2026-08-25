import { httpClient } from './httpClient'
import type { ConceptoCobro, ConceptoCobroTipo } from '../types'
const BASE_URL = '/conceptos-cobro'
export async function getConceptosCobro(): Promise<ConceptoCobro[]> { const { data } = await httpClient.get<ConceptoCobro[]>(`${BASE_URL}/`); return data }
export async function createConceptoCobro(values: { tipo: ConceptoCobroTipo; monto: number; descripcion?: string; programa_id: string }): Promise<ConceptoCobro> { const { data } = await httpClient.post<ConceptoCobro>(`${BASE_URL}/`, values); return data }
/** El backend no expone DELETE para este recurso, solo esta baja lógica dedicada. */
export async function desactivarConceptoCobro(id: string): Promise<ConceptoCobro> { const { data } = await httpClient.patch<ConceptoCobro>(`${BASE_URL}/${id}/desactivar`); return data }
export async function activarConceptoCobro(id: string): Promise<ConceptoCobro> { const { data } = await httpClient.patch<ConceptoCobro>(`${BASE_URL}/${id}/activar`); return data }
