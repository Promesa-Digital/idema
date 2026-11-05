import { apiRequest } from '@/services/apiClient'
import type { MatriculaBackend } from '@/types/backend'

const MATRICULAS_PATH = '/api/v1/matriculas'

export function listarMatriculas(alumnoId?: string): Promise<MatriculaBackend[]> {
  const query = alumnoId ? `?alumno_id=${encodeURIComponent(alumnoId)}` : ''
  return apiRequest<MatriculaBackend[]>(`${MATRICULAS_PATH}/${query}`)
}

export function anularMatricula(id: string, motivo: string): Promise<MatriculaBackend> {
  return apiRequest<MatriculaBackend>(`${MATRICULAS_PATH}/${encodeURIComponent(id)}/anular`, {
    method: 'POST',
    body: { motivo },
  })
}
