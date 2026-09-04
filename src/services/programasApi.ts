import { apiRequest } from '@/services/apiClient'
import type { ProgramaBackend, ProgramaCreate, ProgramaUpdate } from '@/types/backend'

export function listarProgramas(): Promise<ProgramaBackend[]> {
  return apiRequest<ProgramaBackend[]>('/api/v1/programas/')
}

export function obtenerPrograma(id: string): Promise<ProgramaBackend> {
  return apiRequest<ProgramaBackend>(`/api/v1/programas/${encodeURIComponent(id)}`)
}

export function crearPrograma(data: ProgramaCreate): Promise<ProgramaBackend> {
  return apiRequest<ProgramaBackend>('/api/v1/programas/', {
    method: 'POST',
    body: data,
  })
}

export function actualizarPrograma(id: string, data: ProgramaUpdate): Promise<ProgramaBackend> {
  return apiRequest<ProgramaBackend>(`/api/v1/programas/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function archivarPrograma(id: string): Promise<ProgramaBackend> {
  return apiRequest<ProgramaBackend>(`/api/v1/programas/${encodeURIComponent(id)}/archivar`, {
    method: 'PATCH',
  })
}
