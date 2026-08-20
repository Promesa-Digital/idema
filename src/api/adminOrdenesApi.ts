import { httpClient } from './httpClient'
import type { Orden, OrdenListFilters } from '../types/admin'

const BASE_URL = '/admin/ordenes'

export async function fetchOrdenes(filters: OrdenListFilters = {}): Promise<Orden[]> {
  const { data } = await httpClient.get<Orden[]>(BASE_URL, { params: filters })
  return data
}

/** El backend también debe validar que la orden no esté ya anulada y que el motivo no venga vacío. */
export async function anularOrden(id: string, motivo: string): Promise<Orden> {
  const { data } = await httpClient.patch<Orden>(`${BASE_URL}/${id}/anular`, { motivo })
  return data
}
