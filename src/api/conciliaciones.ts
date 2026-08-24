import { httpClient } from './httpClient'
import type { Conciliacion, ConciliacionCreate, ConciliacionDetalle } from '../types'

const BASE_URL = '/conciliaciones'

export async function getConciliaciones(): Promise<Conciliacion[]> {
  const { data } = await httpClient.get<Conciliacion[]>(`${BASE_URL}/`)
  return data
}

/** Incluye el detalle de órdenes vinculadas (`ordenes: ConciliacionOrden[]`). */
export async function getConciliacion(id: string): Promise<ConciliacionDetalle> {
  const { data } = await httpClient.get<ConciliacionDetalle>(`${BASE_URL}/${id}`)
  return data
}

/** Toma automáticamente las órdenes Pagadas del periodo indicado. */
export async function createConciliacion(values: ConciliacionCreate): Promise<Conciliacion> {
  const { data } = await httpClient.post<Conciliacion>(`${BASE_URL}/`, values)
  return data
}

/**
 * El backend exige `orden_ids` en el body (qué órdenes de la conciliación se marcan como
 * conciliadas), así que este cliente lo pide como parámetro aunque no estaba en la lista original.
 */
export async function conciliarOrdenes(id: string, ordenIds: string[]): Promise<ConciliacionDetalle> {
  const { data } = await httpClient.patch<ConciliacionDetalle>(`${BASE_URL}/${id}/conciliar`, {
    orden_ids: ordenIds,
  })
  return data
}

/** No editable después de cerrada. */
export async function cerrarConciliacion(id: string): Promise<Conciliacion> {
  const { data } = await httpClient.post<Conciliacion>(`${BASE_URL}/${id}/cerrar`)
  return data
}
