import { httpClient } from './httpClient'
import type { Descuento, DescuentoCreate, DescuentoUpdate, DescuentoEstado } from '../types'

const BASE_URL = '/descuentos'

export interface DescuentoListFilters {
  estado?: DescuentoEstado
}

export async function getDescuentos(params: DescuentoListFilters = {}): Promise<Descuento[]> {
  const { data } = await httpClient.get<Descuento[]>(`${BASE_URL}/`, { params })
  return data
}

export async function getDescuento(id: string): Promise<Descuento> {
  const { data } = await httpClient.get<Descuento>(`${BASE_URL}/${id}`)
  return data
}

export async function createDescuento(values: DescuentoCreate): Promise<Descuento> {
  const { data } = await httpClient.post<Descuento>(`${BASE_URL}/`, values)
  return data
}

export async function updateDescuento(id: string, values: DescuentoUpdate): Promise<Descuento> {
  const { data } = await httpClient.patch<Descuento>(`${BASE_URL}/${id}`, values)
  return data
}

/** Baja lógica: el backend nunca borra el registro, solo pasa `estado` a "inactivo". */
export async function deleteDescuento(id: string): Promise<Descuento> {
  const { data } = await httpClient.delete<Descuento>(`${BASE_URL}/${id}`)
  return data
}

export async function activarDescuento(id: string): Promise<Descuento> {
  const { data } = await httpClient.patch<Descuento>(`${BASE_URL}/${id}/activar`)
  return data
}

/** Descuento activo vigente para un concepto de cobro (usa el mismo cálculo que POST /ordenes). */
export async function getDescuentoVigente(conceptoId: string): Promise<Descuento> {
  const { data } = await httpClient.get<Descuento>(`${BASE_URL}/vigente`, {
    params: { concepto_id: conceptoId },
  })
  return data
}
