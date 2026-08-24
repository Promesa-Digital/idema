import { httpClient } from './httpClient'
import type { OrdenPago, OrdenPagoCreate, OrdenesFiltros } from '../types'

const BASE_URL = '/ordenes'

/** Filtros solo aplican para staff (admin ve todas); el backend ignora `params` para un alumno,
 * que siempre recibe únicamente las suyas. */
export async function getOrdenes(params: OrdenesFiltros = {}): Promise<OrdenPago[]> {
  const { data } = await httpClient.get<OrdenPago[]>(`${BASE_URL}/`, { params })
  return data
}

export async function getOrden(id: string): Promise<OrdenPago> {
  const { data } = await httpClient.get<OrdenPago>(`${BASE_URL}/${id}`)
  return data
}

/** El monto nunca se envía: el backend lo calcula siempre desde el ConceptoCobro
 * (aplicando el descuento vigente, si hay uno) y lo ignoraría si viniera en el body. */
export async function createOrden(values: OrdenPagoCreate): Promise<OrdenPago> {
  const { data } = await httpClient.post<OrdenPago>(`${BASE_URL}/`, values)
  return data
}

export async function anularOrden(id: string, motivo: string): Promise<OrdenPago> {
  const { data } = await httpClient.post<OrdenPago>(`${BASE_URL}/${id}/anular`, { motivo })
  return data
}

/** Solo válido si la orden está en pendiente_confirmacion; pasa a pagada y activa la matrícula asociada. */
export async function confirmarTransferencia(id: string): Promise<OrdenPago> {
  const { data } = await httpClient.post<OrdenPago>(`${BASE_URL}/${id}/confirmar-transferencia`)
  return data
}
