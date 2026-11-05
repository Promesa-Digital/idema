import { apiRequest } from '@/services/apiClient'
import type { ElectivoBackend } from '@/types/backend'

const ELECTIVOS_PATH = '/api/v1/electivos'

export function listarElectivos(): Promise<ElectivoBackend[]> {
  return apiRequest<ElectivoBackend[]>(`${ELECTIVOS_PATH}/`)
}
