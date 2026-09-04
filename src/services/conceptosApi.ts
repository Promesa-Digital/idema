import { apiRequest } from '@/services/apiClient'
import type { ConceptoCobroBackend } from '@/types/backend'

const CONCEPTOS_COBRO_PATH = '/api/v1/conceptos-cobro'

export function listarConceptos(): Promise<ConceptoCobroBackend[]> {
  return apiRequest<ConceptoCobroBackend[]>(`${CONCEPTOS_COBRO_PATH}/`)
}
