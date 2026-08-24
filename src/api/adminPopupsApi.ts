import { httpClient } from './httpClient'
import type { Popup, PopupListFilters } from '../types/admin'
import type { PopupFormValues } from '../schemas/popup'

const BASE_URL = '/popups'

interface PopupPayload {
  tipo: PopupFormValues['tipo']
  texto: string
  imagen_url: string
  video_url?: string
  enlace?: string
  paginas: string
  fecha_inicio: string
  fecha_fin: string
}

function toPayload(values: PopupFormValues): PopupPayload {
  return {
    tipo: values.tipo,
    texto: values.texto,
    imagen_url: values.imagen_url,
    video_url: values.video_url || undefined,
    enlace: values.enlace || undefined,
    paginas: values.paginas,
    fecha_inicio: values.fecha_inicio,
    fecha_fin: values.fecha_fin,
  }
}

export async function fetchPopups(filters: PopupListFilters = {}): Promise<Popup[]> {
  const { data } = await httpClient.get<Popup[]>(BASE_URL, { params: filters })
  return data
}

export async function fetchPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.get<Popup>(`${BASE_URL}/${id}`)
  return data
}

export async function createPopup(values: PopupFormValues): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(BASE_URL, toPayload(values))
  return data
}

export async function updatePopup(id: string, values: PopupFormValues): Promise<Popup> {
  const { data } = await httpClient.patch<Popup>(`${BASE_URL}/${id}`, toPayload(values))
  return data
}

/** Envía un popup en borrador (o rechazado) a revisión; lo puede iniciar cualquier rol con acceso al módulo. */
export async function enviarAprobacionPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(`${BASE_URL}/${id}/enviar-aprobacion`)
  return data
}

/** Solo debe invocarse desde la UI cuando el usuario tiene rol director_marketing (el backend también debe validarlo). */
export async function aprobarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(`${BASE_URL}/${id}/aprobar`)
  return data
}

export async function rechazarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(`${BASE_URL}/${id}/rechazar`)
  return data
}

export async function publicarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(`${BASE_URL}/${id}/publicar`)
  return data
}

export async function finalizarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.post<Popup>(`${BASE_URL}/${id}/finalizar`)
  return data
}
