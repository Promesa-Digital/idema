import { httpClient } from './httpClient'
import type { Matricula, MatriculaCreate } from '../types'

const BASE_URL = '/matriculas'

/** El backend filtra según quién pregunta: alumno ve las suyas, staff ve todas. */
export async function getMatriculas(): Promise<Matricula[]> {
  const { data } = await httpClient.get<Matricula[]>(`${BASE_URL}/`)
  return data
}

/** El tipo (nueva/retorno) no se envía: lo decide el backend según el historial del alumno. */
export async function createMatricula(values: MatriculaCreate): Promise<Matricula> {
  const { data } = await httpClient.post<Matricula>(`${BASE_URL}/`, values)
  return data
}

export async function anularMatricula(id: string, motivo: string): Promise<Matricula> {
  const { data } = await httpClient.post<Matricula>(`${BASE_URL}/${id}/anular`, { motivo })
  return data
}
