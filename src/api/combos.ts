import { httpClient } from './httpClient'
import type { Combo, ComboCreate, ComboUpdate } from '../types'

const BASE_URL = '/combos'

/** Público: el backend solo devuelve los combos vigentes (activos y dentro de su rango de fechas). */
export async function getCombos(): Promise<Combo[]> {
  const { data } = await httpClient.get<Combo[]>(`${BASE_URL}/`)
  return data
}

export async function getCombo(id: string): Promise<Combo> {
  const { data } = await httpClient.get<Combo>(`${BASE_URL}/${id}`)
  return data
}

export async function createCombo(values: ComboCreate): Promise<Combo> {
  const { data } = await httpClient.post<Combo>(`${BASE_URL}/`, values)
  return data
}

export async function updateCombo(id: string, values: ComboUpdate): Promise<Combo> {
  const { data } = await httpClient.patch<Combo>(`${BASE_URL}/${id}`, values)
  return data
}

/** Baja lógica: el backend nunca borra el registro, solo pasa `estado` a "inactivo". */
export async function deleteCombo(id: string): Promise<Combo> {
  const { data } = await httpClient.delete<Combo>(`${BASE_URL}/${id}`)
  return data
}
