import { httpClient } from './httpClient'
import type { Matricula } from '../types/matricula'

interface MatriculaResponse {
  id: string
  programa: string
  periodo: string
  modalidad: string
  estado: Matricula['estado']
  fecha_inicio: string
}

function mapMatricula(data: MatriculaResponse): Matricula {
  return {
    id: data.id,
    programa: data.programa,
    periodo: data.periodo,
    modalidad: data.modalidad,
    estado: data.estado,
    fechaInicio: data.fecha_inicio,
  }
}

export async function fetchMisMatriculas(): Promise<Matricula[]> {
  const { data } = await httpClient.get<MatriculaResponse[]>('/portal/matriculas')
  return data.map(mapMatricula)
}
