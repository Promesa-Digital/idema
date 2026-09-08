import { apiRequest } from '@/services/apiClient'
import type {
  ConciliacionBackend,
  ConciliacionCreate,
  ConciliacionDetalleBackend,
  ConciliacionUpdate,
} from '@/types/backend'

const CONCILIACIONES_PATH = '/api/v1/conciliaciones'

export function listarConciliaciones(): Promise<ConciliacionBackend[]> {
  return apiRequest<ConciliacionBackend[]>(`${CONCILIACIONES_PATH}/`)
}

export function obtenerConciliacion(id: string): Promise<ConciliacionDetalleBackend> {
  return apiRequest<ConciliacionDetalleBackend>(
    `${CONCILIACIONES_PATH}/${encodeURIComponent(id)}`,
  )
}

export function crearConciliacion(
  data: ConciliacionCreate,
): Promise<ConciliacionDetalleBackend> {
  return apiRequest<ConciliacionDetalleBackend>(`${CONCILIACIONES_PATH}/`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarConciliacion(
  id: string,
  data: ConciliacionUpdate,
): Promise<ConciliacionDetalleBackend> {
  return apiRequest<ConciliacionDetalleBackend>(
    `${CONCILIACIONES_PATH}/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: data },
  )
}

export function conciliarOrdenes(
  id: string,
  ordenIds: string[],
): Promise<ConciliacionDetalleBackend> {
  return apiRequest<ConciliacionDetalleBackend>(
    `${CONCILIACIONES_PATH}/${encodeURIComponent(id)}/conciliar`,
    { method: 'PATCH', body: { orden_ids: ordenIds } },
  )
}

export function cerrarConciliacion(id: string): Promise<ConciliacionBackend> {
  return apiRequest<ConciliacionBackend>(
    `${CONCILIACIONES_PATH}/${encodeURIComponent(id)}/cerrar`,
    { method: 'POST' },
  )
}
