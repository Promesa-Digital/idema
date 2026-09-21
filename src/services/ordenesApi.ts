import { apiRequest } from '@/services/apiClient'
import type {
  OrdenPagoBackend,
  OrdenPagoEstado,
  OrdenPagoMedioPago,
} from '@/types/backend'

const ORDENES_PATH = '/api/v1/ordenes'

export interface OrdenesFiltros {
  estado?: OrdenPagoEstado
  medio_pago?: OrdenPagoMedioPago
  fecha_desde?: string
  fecha_hasta?: string
  alumno_id?: string
}

export function listarOrdenes(filtros: OrdenesFiltros = {}): Promise<OrdenPagoBackend[]> {
  const params = new URLSearchParams()
  if (filtros.estado) params.set('estado', filtros.estado)
  if (filtros.medio_pago) params.set('medio_pago', filtros.medio_pago)
  if (filtros.fecha_desde) params.set('fecha_desde', filtros.fecha_desde)
  if (filtros.fecha_hasta) params.set('fecha_hasta', filtros.fecha_hasta)
  if (filtros.alumno_id) params.set('alumno_id', filtros.alumno_id)
  const query = params.toString()

  return apiRequest<OrdenPagoBackend[]>(`${ORDENES_PATH}/${query ? `?${query}` : ''}`)
}

export function obtenerOrden(id: string): Promise<OrdenPagoBackend> {
  return apiRequest<OrdenPagoBackend>(`${ORDENES_PATH}/${encodeURIComponent(id)}`)
}

export function anularOrden(id: string, motivo: string): Promise<OrdenPagoBackend> {
  return apiRequest<OrdenPagoBackend>(`${ORDENES_PATH}/${encodeURIComponent(id)}/anular`, {
    method: 'POST',
    body: { motivo },
  })
}

export function confirmarPago(id: string): Promise<OrdenPagoBackend> {
  return apiRequest<OrdenPagoBackend>(
    `${ORDENES_PATH}/${encodeURIComponent(id)}/confirmar-pago`,
    { method: 'POST' },
  )
}
