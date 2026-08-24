import { httpClient } from './httpClient'
import type { Electivo, ElectivoCreate } from '../types'

const BASE_URL = '/electivos'

/** El backend filtra según quién pregunta: alumno ve los suyos, académico ve todos. */
export async function getElectivos(): Promise<Electivo[]> {
  const { data } = await httpClient.get<Electivo[]>(`${BASE_URL}/`)
  return data
}

export async function activarElectivo(values: ElectivoCreate): Promise<Electivo> {
  const { data } = await httpClient.post<Electivo>(`${BASE_URL}/activar`, values)
  return data
}

/** Baja lógica (pasa a "cancelado") y libera el cupo anual; solo si el curso no ha iniciado. */
export async function desactivarElectivo(id: string): Promise<Electivo> {
  const { data } = await httpClient.delete<Electivo>(`${BASE_URL}/${id}`)
  return data
}
