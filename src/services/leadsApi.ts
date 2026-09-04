import { apiRequest } from '@/services/apiClient'
import type { LeadBackend, LeadEstado } from '@/types/backend'

const LEADS_PATH = '/api/v1/leads'

export interface LeadsFiltros {
  estado?: LeadEstado
}

export function listarLeads(filtros: LeadsFiltros = {}): Promise<LeadBackend[]> {
  const params = new URLSearchParams()
  if (filtros.estado) params.set('estado', filtros.estado)
  const query = params.toString()

  return apiRequest<LeadBackend[]>(`${LEADS_PATH}/${query ? `?${query}` : ''}`)
}

export function obtenerLead(id: string): Promise<LeadBackend> {
  return apiRequest<LeadBackend>(`${LEADS_PATH}/${encodeURIComponent(id)}`)
}

export function cambiarEstadoLead(id: string, estado: LeadEstado): Promise<LeadBackend> {
  return apiRequest<LeadBackend>(`${LEADS_PATH}/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH',
    body: { estado },
  })
}

export function asignarAsesor(id: string, asesorId: string): Promise<LeadBackend> {
  return apiRequest<LeadBackend>(`${LEADS_PATH}/${encodeURIComponent(id)}/asignar`, {
    method: 'PATCH',
    body: { asesor_asignado_id: asesorId },
  })
}
