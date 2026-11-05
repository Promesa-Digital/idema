import { apiRequest } from '@/services/apiClient'
import type {
  ComprobanteBackend,
  ComprobanteCreate,
  ComprobanteEstado,
} from '@/types/backend'

const COMPROBANTES_PATH = '/api/v1/comprobantes'

export interface ComprobanteUpdateData {
  numero?: string
  estado?: ComprobanteEstado
  motivo?: string
}

export function listarComprobantes(): Promise<ComprobanteBackend[]> {
  return apiRequest<ComprobanteBackend[]>(`${COMPROBANTES_PATH}/`)
}

export function obtenerComprobante(id: string): Promise<ComprobanteBackend> {
  return apiRequest<ComprobanteBackend>(`${COMPROBANTES_PATH}/${encodeURIComponent(id)}`)
}

export function emitirComprobante(data: ComprobanteCreate): Promise<ComprobanteBackend> {
  return apiRequest<ComprobanteBackend>(`${COMPROBANTES_PATH}/emitir`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarComprobante(
  id: string,
  data: ComprobanteUpdateData,
): Promise<ComprobanteBackend> {
  return apiRequest<ComprobanteBackend>(`${COMPROBANTES_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function anularComprobante(
  id: string,
  motivo: string,
): Promise<ComprobanteBackend> {
  return apiRequest<ComprobanteBackend>(
    `${COMPROBANTES_PATH}/${encodeURIComponent(id)}/anular`,
    {
      method: 'POST',
      body: { motivo },
    },
  )
}
