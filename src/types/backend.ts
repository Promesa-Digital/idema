export type UsuarioRol =
  | 'marketing'
  | 'director_marketing'
  | 'ventas'
  | 'academico'
  | 'administracion'
  | 'admin_sistema'

export interface UsuarioBackend {
  id: string
  nombre: string
  correo: string
  rol: UsuarioRol
  estado: 'activo' | 'inactivo'
}

export interface UsuarioDirectorio extends UsuarioBackend {
  created_at: string
  updated_at: string
}

export interface UsuarioCreate {
  nombre: string
  correo: string
  password: string
  rol: UsuarioRol
}

export interface UsuarioUpdate {
  nombre?: string
  rol?: UsuarioRol
  estado?: UsuarioBackend['estado']
  password?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  rol: UsuarioRol
}

export type ProgramaTipo = 'carrera' | 'auxiliar' | 'especializacion' | 'curso'

export type ProgramaEstado = 'no_publicado' | 'publicado' | 'archivado'

export interface ProgramaBackend {
  id: string
  codigo: string
  abreviatura: string
  nombre: string
  tipo: ProgramaTipo
  categoria: string
  malla: string
  descripcion: string | null
  anio: number
  num_lecciones: number
  certificado: boolean
  tutor: string | null
  estado: ProgramaEstado
  publicacion_programada: string | null
  created_at: string
  updated_at: string
}

export type ProgramaCreate = Omit<ProgramaBackend, 'id' | 'created_at' | 'updated_at'>

export type ProgramaUpdate = Partial<Omit<ProgramaCreate, 'codigo'>>

export type PopupTipo = 'anuncio' | 'descuento'

export type PopupEstado =
  | 'borrador'
  | 'pendiente'
  | 'aprobado'
  | 'rechazado'
  | 'publicado'
  | 'finalizado'

export interface PopupBackend {
  id: string
  tipo: PopupTipo
  texto: string
  imagen_url: string
  video_url: string | null
  enlace: string | null
  paginas: string
  monto_descuento: number | null
  duracion_temporizador: number | null
  texto_superior: string | null
  fecha_inicio: string
  fecha_fin: string
  estado: PopupEstado
  creado_por: string
  aprobado_por: string | null
  created_at: string
  updated_at: string
}

export interface PopupCreate {
  tipo: PopupTipo
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
}

export type PopupUpdate = Partial<PopupCreate>

export interface PopupPublicoBackend {
  id: string
  tipo: PopupTipo
  texto: string
  imagen_url: string
  enlace: string | null
  paginas: string
  fecha_inicio: string
  fecha_fin: string
}

export type ComboEstado = 'activo' | 'inactivo'

export interface ComboBackend {
  id: string
  nombre: string
  descripcion: string | null
  vigencia_inicio: string
  vigencia_fin: string
  estado: ComboEstado
  programa_ids: string[]
  created_at: string
  updated_at: string
}

export interface ComboCreate {
  nombre: string
  descripcion?: string | null
  vigencia_inicio: string
  vigencia_fin: string
  programa_ids: string[]
}

export type ComboUpdate = Partial<ComboCreate>

export type ConceptoCobroTipo = 'matricula' | 'inscripcion' | 'curso' | 'pension' | 'gratuito'

export type ConceptoCobroEstado = 'activo' | 'inactivo'

export interface ConceptoCobroBackend {
  id: string
  tipo: ConceptoCobroTipo
  monto: string
  descripcion: string | null
  estado: ConceptoCobroEstado
  programa_id: string | null
  combo_id: string | null
  created_at: string
  updated_at: string
}

export interface ConceptoCobroCreate {
  tipo: ConceptoCobroTipo
  monto: number
  descripcion?: string | null
  programa_id?: string | null
  combo_id?: string | null
}

export interface ConceptoCobroUpdate {
  tipo?: ConceptoCobroTipo
  monto?: number
  descripcion?: string | null
  programa_id?: string | null
  combo_id?: string | null
}

export type DescuentoTipo = 'manual' | 'pronto_pago'

export type DescuentoEstado = 'activo' | 'inactivo'

export interface DescuentoBackend {
  id: string
  tipo: DescuentoTipo
  porcentaje: string
  descripcion: string | null
  estado: DescuentoEstado
  concepto_id: string
  created_at: string
  updated_at: string
}

export interface DescuentoCreate {
  tipo: DescuentoTipo
  porcentaje: number
  descripcion?: string | null
  concepto_id: string
}

export type DescuentoUpdate = Partial<DescuentoCreate>

export type OrdenPagoEstado =
  | 'pendiente'
  | 'pagada'
  | 'fallida'
  | 'anulada'
  | 'conciliada'
  | 'pendiente_confirmacion'

export type OrdenPagoMedioPago = 'tarjeta' | 'yape' | 'transferencia'

export interface OrdenPagoBackend {
  id: string
  monto: string
  medio_pago: OrdenPagoMedioPago
  estado: OrdenPagoEstado
  ref_culqi: string | null
  voucher_url: string | null
  motivo_anulacion: string | null
  fecha_pago: string | null
  alumno_id: string
  concepto_id: string
  descuento_id: string | null
  created_at: string
  updated_at: string
}

export type ComprobanteTipo = 'boleta' | 'factura'

export type ComprobanteEstado = 'emitido' | 'observado' | 'anulado'

export interface ComprobanteBackend {
  id: string
  tipo: ComprobanteTipo
  numero: string | null
  nombre_pagador: string
  ruc: string | null
  razon_social: string | null
  estado: ComprobanteEstado
  motivo: string | null
  nota_credito: string | null
  fecha_emision: string
  orden_id: string
  created_at: string
  updated_at: string
}

export interface ComprobanteCreate {
  orden_id: string
  tipo: ComprobanteTipo
  nombre_pagador: string
  ruc?: string
  razon_social?: string
}

export type LeadOrigen = 'popup' | 'formulario'

export type LeadEstado = 'nuevo' | 'contactado' | 'pago' | 'descartado'

export interface LeadBackend {
  id: string
  nombre: string | null
  correo: string | null
  telefono: string | null
  origen: LeadOrigen
  estado: LeadEstado
  cuenta_alumno_id: string | null
  asesor_asignado_id: string | null
  created_at: string
  updated_at: string
}

export type CuentaAlumnoEstado = 'activa' | 'inactiva'

export interface CuentaAlumnoBackend {
  id: string
  nombres: string
  apellido_paterno: string
  apellido_materno: string | null
  dni: string
  correo: string
  telefono: string
  estado: CuentaAlumnoEstado
  created_at: string
  updated_at: string
}

export type MatriculaTipo = 'nueva' | 'retorno'

export type MatriculaEstado = 'pendiente' | 'activa' | 'anulada'

export interface MatriculaBackend {
  id: string
  tipo: MatriculaTipo
  estado: MatriculaEstado
  motivo_anulacion: string | null
  fecha_activacion: string | null
  alumno_id: string
  programa_id: string
  orden_id: string
  created_at: string
  updated_at: string
}

export type ElectivoEstado = 'activado' | 'en_curso' | 'completado' | 'cancelado'

export interface ElectivoBackend {
  id: string
  estado: ElectivoEstado
  gratuito: boolean
  fecha_activacion: string
  matricula_id: string
  programa_id: string
  created_at: string
  updated_at: string
}

export interface ReportePopupItem {
  popup_id: string
  tipo: PopupTipo
  texto: string
  vistas: number
  clics: number
  tasa_clics: string
}

export interface ReportePopupsBackend {
  resumen: {
    total_popups: number
    vistas: number
    clics: number
    tasa_clics: string
  }
  items: ReportePopupItem[]
}

export interface ReporteOrdenItem {
  orden_id: string
  fecha: string
  fecha_pago: string | null
  estado: OrdenPagoEstado
  medio_pago: OrdenPagoMedioPago
  monto: string
  referencia_culqi: string | null
  alumno: string
  dni: string
  correo: string
  concepto: string
}

export interface ReporteOrdenesBackend {
  resumen: {
    total_ordenes: number
    monto_total: string
    monto_confirmado: string
  }
  items: ReporteOrdenItem[]
}
