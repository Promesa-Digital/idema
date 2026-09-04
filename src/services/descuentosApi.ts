import { ApiError, apiRequest } from '@/services/apiClient'
import type {
  DescuentoBackend,
  DescuentoCreate,
  DescuentoEstado,
  DescuentoUpdate,
} from '@/types/backend'

const DESCUENTOS_PATH = '/api/v1/descuentos'

interface DescuentoFiltros {
  estado?: DescuentoEstado
}

export function listarDescuentos(
  filtros: DescuentoFiltros = {},
): Promise<DescuentoBackend[]> {
  const params = new URLSearchParams()
  if (filtros.estado) params.set('estado', filtros.estado)
  const query = params.toString()

  return apiRequest<DescuentoBackend[]>(`${DESCUENTOS_PATH}/${query ? `?${query}` : ''}`)
}

export function obtenerDescuento(id: string): Promise<DescuentoBackend> {
  return apiRequest<DescuentoBackend>(`${DESCUENTOS_PATH}/${encodeURIComponent(id)}`)
}

export function crearDescuento(data: DescuentoCreate): Promise<DescuentoBackend> {
  return apiRequest<DescuentoBackend>(`${DESCUENTOS_PATH}/`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarDescuento(
  id: string,
  data: DescuentoUpdate,
): Promise<DescuentoBackend> {
  return apiRequest<DescuentoBackend>(`${DESCUENTOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function eliminarDescuento(id: string): Promise<DescuentoBackend> {
  return apiRequest<DescuentoBackend>(`${DESCUENTOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function activarDescuento(id: string): Promise<DescuentoBackend> {
  return apiRequest<DescuentoBackend>(`${DESCUENTOS_PATH}/${encodeURIComponent(id)}/activar`, {
    method: 'PATCH',
  })
}

export async function consultarDescuentoVigente(
  conceptoId: string,
): Promise<DescuentoBackend | null> {
  try {
    return await apiRequest<DescuentoBackend>(
      `${DESCUENTOS_PATH}/vigente?concepto_id=${encodeURIComponent(conceptoId)}`,
    )
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}
