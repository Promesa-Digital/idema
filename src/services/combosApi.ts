import { apiRequest } from '@/services/apiClient'
import type { ComboBackend, ComboCreate, ComboUpdate } from '@/types/backend'

const COMBOS_PATH = '/api/v1/combos'

export function listarCombosPublicos(): Promise<ComboBackend[]> {
  return apiRequest<ComboBackend[]>(`${COMBOS_PATH}/`, { token: null })
}

export function listarCombosAdmin(): Promise<ComboBackend[]> {
  return apiRequest<ComboBackend[]>(`${COMBOS_PATH}/admin`)
}

export function obtenerCombo(id: string): Promise<ComboBackend> {
  return apiRequest<ComboBackend>(`${COMBOS_PATH}/${encodeURIComponent(id)}`, { token: null })
}

export function crearCombo(data: ComboCreate): Promise<ComboBackend> {
  return apiRequest<ComboBackend>(`${COMBOS_PATH}/`, {
    method: 'POST',
    body: data,
  })
}

export function actualizarCombo(id: string, data: ComboUpdate): Promise<ComboBackend> {
  return apiRequest<ComboBackend>(`${COMBOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

export function eliminarCombo(id: string): Promise<ComboBackend> {
  return apiRequest<ComboBackend>(`${COMBOS_PATH}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}

export function activarCombo(id: string): Promise<ComboBackend> {
  return apiRequest<ComboBackend>(`${COMBOS_PATH}/${encodeURIComponent(id)}/activar`, {
    method: 'PATCH',
  })
}
