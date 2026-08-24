export type ProgramaCategoria = 'carrera' | 'auxiliar' | 'especializacion' | 'curso'
export type ProgramaEstado = 'no_publicado' | 'publicado' | 'archivado'

export interface Programa {
  id: string
  codigo: string
  abreviatura: string
  nombre: string
  tipo: ProgramaCategoria
  categoria: ProgramaCategoria
  malla: string
  descripcion: string
  anio: number
  num_lecciones: number | null
  certificado: boolean
  tutor: string | null
  estado: ProgramaEstado
  publicacion_programada: string | null
  created_at: string
  updated_at: string
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
  no_publicado: 'No publicado',
  publicado: 'Publicado',
  archivado: 'Archivado',
}

/** Refleja la forma de `Anuncio` (src/types/index.ts) consumida por AnnouncementModal, más el flujo de aprobación. */
export type PopupFrequency = 'session' | 'day' | 'always'
export type PopupEstado = 'borrador' | 'pendiente_aprobacion' | 'aprobado' | 'rechazado' | 'publicado' | 'finalizado'

export interface PopupCta {
  label: string
  href: string
  external?: boolean
}

export interface Popup {
  id: string
  tipo: 'imagen' | 'video' | 'texto'
  texto: string
  imagen_url: string
  video_url?: string
  enlace?: string
  paginas: string
  monto_descuento?: number
  duracion_temporizador?: number
  texto_superior?: string
  fecha_inicio: string
  fecha_fin: string
  estado: PopupEstado
  creado_por: string
  aprobado_por?: string
  created_at: string
  updated_at: string
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
  publicado: 'Publicado',
  finalizado: 'Finalizado',
}
