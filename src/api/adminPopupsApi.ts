import { httpClient } from './httpClient'
import type { Popup, PopupListFilters } from '../types/admin'
import type { PopupFormValues } from '../schemas/popup'

const BASE_URL = '/admin/popups'

interface PopupPayload {
  image: string
  alt: string
  startDate?: string
  endDate?: string
  frequency: PopupFormValues['frequency']
  pages: string[]
  cta?: { label: string; href: string; external: boolean }
}

function toPayload(values: PopupFormValues): PopupPayload {
  return {
    image: values.image,
    alt: values.alt,
    startDate: values.startDate,
    endDate: values.endDate,
    frequency: values.frequency,
    pages: values.pages,
    cta: values.ctaLabel && values.ctaHref
      ? { label: values.ctaLabel, href: values.ctaHref, external: values.ctaExternal }
      : undefined,
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
  const { data } = await httpClient.put<Popup>(`${BASE_URL}/${id}`, toPayload(values))
  return data
}

/** Envía un popup en borrador (o rechazado) a revisión; lo puede iniciar cualquier rol con acceso al módulo. */
export async function enviarAprobacionPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.patch<Popup>(`${BASE_URL}/${id}/enviar-aprobacion`)
  return data
}

/** Solo debe invocarse desde la UI cuando el usuario tiene rol director_marketing (el backend también debe validarlo). */
export async function aprobarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.patch<Popup>(`${BASE_URL}/${id}/aprobar`)
  return data
}

export async function rechazarPopup(id: string): Promise<Popup> {
  const { data } = await httpClient.patch<Popup>(`${BASE_URL}/${id}/rechazar`)
  return data
}
