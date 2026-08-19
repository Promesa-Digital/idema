export type ProgramaCategoria = 'carrera' | 'auxiliar' | 'especializacion' | 'curso'
export type ProgramaEstado = 'activo' | 'archivado'

export interface Programa {
  id: string
  codigo: string
  nombre: string
  categoria: ProgramaCategoria
  modalidad: string
  duracion: string
  descripcion: string
  estado: ProgramaEstado
  createdAt: string
  updatedAt: string
}

export interface ProgramaListFilters {
  categoria?: ProgramaCategoria
  estado?: ProgramaEstado
  search?: string
}

export const PROGRAMA_CATEGORIA_LABELS: Record<ProgramaCategoria, string> = {
  carrera: 'Carrera técnica',
  auxiliar: 'Auxiliar',
  especializacion: 'Especialización',
  curso: 'Curso corto',
}

export const PROGRAMA_ESTADO_LABELS: Record<ProgramaEstado, string> = {
  activo: 'Activo',
  archivado: 'Archivado',
}

/** Refleja la forma de `Anuncio` (src/types/index.ts) consumida por AnnouncementModal, más el flujo de aprobación. */
export type PopupFrequency = 'session' | 'day' | 'always'
export type PopupEstado = 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado'

export interface PopupCta {
  label: string
  href: string
  external?: boolean
}

export interface Popup {
  id: string
  image: string
  alt: string
  startDate?: string
  endDate?: string
  frequency: PopupFrequency
  pages: string[]
  cta?: PopupCta
  estado: PopupEstado
  createdAt: string
  updatedAt: string
}

export interface PopupListFilters {
  estado?: PopupEstado
  search?: string
}

export const POPUP_FREQUENCY_LABELS: Record<PopupFrequency, string> = {
  session: 'Una vez por sesión',
  day: 'Una vez por día',
  always: 'Siempre',
}

export const POPUP_ESTADO_LABELS: Record<PopupEstado, string> = {
  borrador: 'Borrador',
  pendiente_aprobacion: 'Pendiente de aprobación',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
}
