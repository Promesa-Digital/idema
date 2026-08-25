import { httpClient } from './httpClient'
import type { Matricula, MatriculaCreate } from '../types'

const BASE_URL = '/matriculas'

/** El backend filtra según quién pregunta: alumno ve las suyas, staff ve todas. */
export async function getMatriculas(): Promise<Matricula[]> {
  const { data } = await httpClient.get<Matricula[]>(`${BASE_URL}/`)
  return data
}

/** Igual que `getMatriculas`, pero acotado a un alumno (usado en el detalle de cuentas-alumnos).
 * Deliberadamente una función separada, sin params por defecto: `getMatriculas` se pasa como
 * `queryFn` directo en varias pantallas, y react-query invoca esa función con su propio objeto
 * de contexto — agregarle un parámetro opcional ahí rompería esas llamadas silenciosamente. */
export async function getMatriculasDeAlumno(alumnoId: string): Promise<Matricula[]> {
  const { data } = await httpClient.get<Matricula[]>(`${BASE_URL}/`, { params: { alumno_id: alumnoId } })
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
