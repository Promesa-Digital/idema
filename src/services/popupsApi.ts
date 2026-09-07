import { apiRequest } from '@/services/apiClient'
import type {
  PopupBackend,
  PopupCreate,
  PopupEstado,
  PopupPublicoBackend,
  PopupTipo,
  PopupUpdate,
} from '@/types/backend'

export interface PopupFiltros {
  tipo?: PopupTipo
  estado?: PopupEstado
}

export function listarPopups(filtros: PopupFiltros = {}): Promise<PopupBackend[]> {
  const params = new URLSearchParams()

  if (filtros.tipo) params.set('tipo', filtros.tipo)
  if (filtros.estado) params.set('estado', filtros.estado)

  const query = params.toString()
  return apiRequest<PopupBackend[]>(`/api/v1/popups/${query ? `?${query}` : ''}`)
}

export function obtenerPopup(id: string): Promise<PopupBackend> {
  return apiRequest<PopupBackend>(`/api/v1/popups/${encodeURIComponent(id)}`)
}

export function listarPopupsPublicos(): Promise<PopupPublicoBackend[]> {
  return apiRequest<PopupPublicoBackend[]>('/api/v1/popups/publicos', { token: null })
}

export function registrarInteraccionPopup(
  id: string,
  tipo: 'vista' | 'clic',
  pagina: string,
): Promise<void> {
  return apiRequest<void>(`/api/v1/popups/${encodeURIComponent(id)}/interacciones`, {
    method: 'POST',
    token: null,
    keepalive: true,
    body: { tipo, pagina },
  })
}

export function crearPopup(data: PopupCreate): Promise<PopupBackend> {
  return apiRequest<PopupBackend>('/api/v1/popups/', {
    method: 'POST',
    body: data,
  })
}

export function actualizarPopup(id: string, data: PopupUpdate): Promise<PopupBackend> {
  return apiRequest<PopupBackend>(`/api/v1/popups/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: data,
  })
}

function ejecutarTransicion(id: string, accion: string): Promise<PopupBackend> {
  return apiRequest<PopupBackend>(
    `/api/v1/popups/${encodeURIComponent(id)}/${accion}`,
    { method: 'POST' },
  )
}

export function enviarAprobacion(id: string): Promise<PopupBackend> {
  return ejecutarTransicion(id, 'enviar-aprobacion')
}

export function aprobar(id: string): Promise<PopupBackend> {
  return ejecutarTransicion(id, 'aprobar')
}

export function rechazar(id: string): Promise<PopupBackend> {
  return ejecutarTransicion(id, 'rechazar')
}

export function publicar(id: string): Promise<PopupBackend> {
  return ejecutarTransicion(id, 'publicar')
}

export function finalizar(id: string): Promise<PopupBackend> {
  return ejecutarTransicion(id, 'finalizar')
}
