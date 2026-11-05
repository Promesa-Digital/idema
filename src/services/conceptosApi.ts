import { apiRequest } from '@/services/apiClient'
import type {
  ConceptoCobroBackend,
  ConceptoCobroCreate,
  ConceptoCobroEstado,
  ConceptoCobroTipo,
  ConceptoCobroUpdate,
} from '@/types/backend'

const CONCEPTOS_COBRO_PATH = '/api/v1/conceptos-cobro'

export interface ListarConceptosFiltros {
  programa_id?: string
  combo_id?: string
  tipo?: ConceptoCobroTipo
  estado?: ConceptoCobroEstado
}

export function listarConceptos(filtros: ListarConceptosFiltros = {}): Promise<ConceptoCobroBackend[]> {
  const params = new URLSearchParams()
  if (filtros.programa_id) params.set('programa_id', filtros.programa_id)
  if (filtros.combo_id) params.set('combo_id', filtros.combo_id)
  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.estado) params.set('estado', filtros.estado)
  const query = params.toString()
  return apiRequest<ConceptoCobroBackend[]>(`${CONCEPTOS_COBRO_PATH}/${query ? `?${query}` : ''}`)
}

export function listarConceptosPublicos(): Promise<ConceptoCobroBackend[]> {
  return apiRequest<ConceptoCobroBackend[]>(`${CONCEPTOS_COBRO_PATH}/publicos`, { token: null })
}

export function obtenerConcepto(id: string): Promise<ConceptoCobroBackend> {
  return apiRequest<ConceptoCobroBackend>(`${CONCEPTOS_COBRO_PATH}/${encodeURIComponent(id)}`)
}

export function crearConcepto(data: ConceptoCobroCreate): Promise<ConceptoCobroBackend> {
  return apiRequest<ConceptoCobroBackend>(`${CONCEPTOS_COBRO_PATH}/`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarConcepto(id: string, data: ConceptoCobroUpdate): Promise<ConceptoCobroBackend> {
  return apiRequest<ConceptoCobroBackend>(`${CONCEPTOS_COBRO_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function desactivarConcepto(id: string): Promise<ConceptoCobroBackend> {
  return apiRequest<ConceptoCobroBackend>(`${CONCEPTOS_COBRO_PATH}/${encodeURIComponent(id)}/desactivar`, {
    method: 'PATCH',
  })
}

export function activarConcepto(id: string): Promise<ConceptoCobroBackend> {
  return apiRequest<ConceptoCobroBackend>(`${CONCEPTOS_COBRO_PATH}/${encodeURIComponent(id)}/activar`, {
    method: 'PATCH',
  })
}
