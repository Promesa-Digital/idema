import type { UserRole } from './auth'

/**
 * Catálogo público de programas (GET /programas/publicos, accesible para un alumno).
 * Ojo: NO es el mismo shape que `Programa` de `types/admin.ts` — ese tipo quedó
 * desalineado del backend real (le faltan tipo/malla/anio/num_lecciones/certificado/tutor
 * y tiene campos que el backend no devuelve como modalidad/duracion). Este sí refleja
 * el ProgramaResponse real de app/schemas/programa.py.
 */
export type ProgramaTipo = 'carrera' | 'auxiliar' | 'especializacion' | 'curso'
export type ProgramaEstadoPublico = 'no_publicado' | 'publicado' | 'archivado'

export interface ProgramaPublico {
  id: string
  codigo: string
  abreviatura: string
  nombre: string
  tipo: ProgramaTipo
  categoria: string
  malla: string
  descripcion?: string
  anio: number
  num_lecciones: number
  certificado: boolean
  tutor?: string
  estado: ProgramaEstadoPublico
  publicacion_programada?: string
  created_at: string
  updated_at: string
}

export interface CampoLaboral {
  title: string
  description: string
}

export interface MallaCurricular {
  year: string
  courses: string[]
}

export interface Carrera {
  slug: string
  title: string
  shortTitle: string
  duration: string
  modality: string
  description: string
  dirigidoA?: string
  image: string
  category: 'carrera' | 'auxiliar' | 'especializacion' | 'curso'
  features?: string[]
  campoLaboral?: CampoLaboral[]
  mallaCurricular?: MallaCurricular[]
  whatsappMessage?: string
  price?: string
  priceVirtual?: string
  priceSemipresencial?: string
  pricePresencial?: string
  matricula?: string
  requirements?: string[]
  certification?: string[]
  titulacion?: string
  mallaCurricularImage?: string
  subtitle?: string
  convenio?: { name: string; logo: string }
  culqiLink?: string
}

export interface ContactFormData {
  firstName: string
  lastName: string
  countryCode: string
  phone: string
  email: string
  comment: string
  acceptPolicies: boolean
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

export interface WhatsAppRep {
  name: string
  phone: string
  probability: number
}

export interface Testimonial {
  name: string
  role: string
  text: string
  image?: string
}

export interface CompanyLogo {
  name: string
  image: string
}

export interface FAQItem {
  question: string
  answer: string
  category?: string
}

export interface Noticia {
  slug: string
  title: string
  date: string
  summary: string
  image: string
  externalUrl?: string
}

export interface Anuncio {
  id: string
  image: string
  alt: string
  startDate?: string
  endDate?: string
  cta?: { label: string; href: string; external?: boolean }
  frequency?: 'session' | 'day' | 'always'
  pages?: string[]
}

/* ────────────────────────────────────────────────────────────────────────
 * Entidades del panel admin / portal del alumno.
 * Reflejan 1:1 los schemas Pydantic del backend (app/schemas/*.py) — mismos
 * nombres de campo (snake_case, tal cual los devuelve la API) y mismos
 * valores de enum, para no tener que traducir nada en el cliente HTTP.
 * ──────────────────────────────────────────────────────────────────────── */

// ---- Combo ----
export type ComboEstado = 'activo' | 'inactivo'

export interface Combo {
  id: string
  nombre: string
  descripcion?: string
  vigencia_inicio: string
  vigencia_fin: string
  estado: ComboEstado
  concepto_precio_id?: string
  programa_ids: string[]
  created_at: string
  updated_at: string
}

export interface ComboCreate {
  nombre: string
  descripcion?: string
  vigencia_inicio: string
  vigencia_fin: string
  concepto_precio_id?: string
  programa_ids: string[]
}

export type ComboUpdate = Partial<ComboCreate>

// ---- Descuento ----
export type DescuentoTipo = 'manual' | 'pronto_pago'
export type DescuentoEstado = 'activo' | 'inactivo'

export interface Descuento {
  id: string
  tipo: DescuentoTipo
  porcentaje: number
  descripcion?: string
  estado: DescuentoEstado
  concepto_id: string
  created_at: string
  updated_at: string
}

export interface DescuentoCreate {
  tipo: DescuentoTipo
  porcentaje: number
  descripcion?: string
  concepto_id: string
}

export type DescuentoUpdate = Partial<DescuentoCreate>

// ---- Matricula ----
export type MatriculaTipo = 'nueva' | 'retorno'
export type MatriculaEstado = 'pendiente' | 'activa' | 'anulada'

export interface Matricula {
  id: string
  tipo: MatriculaTipo
  estado: MatriculaEstado
  motivo_anulacion?: string
  fecha_activacion?: string
  alumno_id: string
  programa_id: string
  orden_id?: string
  created_at: string
  updated_at: string
}

export interface MatriculaCreate {
  programa_id: string
  medio_pago: OrdenPagoMedioPago
  token_culqi?: string
  voucher_url?: string
}

// ---- Electivo ----
export type ElectivoEstado = 'activado' | 'en_curso' | 'completado' | 'cancelado'

export interface Electivo {
  id: string
  estado: ElectivoEstado
  gratuito: boolean
  fecha_activacion: string
  matricula_id: string
  programa_id: string
  created_at: string
  updated_at: string
}

export interface ElectivoCreate {
  matricula_id: string
  programa_id: string
  gratuito?: boolean
}

// ---- OrdenPago ----
export type OrdenPagoMedioPago = 'tarjeta' | 'yape' | 'transferencia'
export type OrdenPagoEstado =
  | 'pendiente'
  | 'pagada'
  | 'fallida'
  | 'anulada'
  | 'conciliada'
  | 'pendiente_confirmacion'

export interface OrdenPago {
  id: string
  monto: number
  medio_pago: OrdenPagoMedioPago
  estado: OrdenPagoEstado
  ref_culqi?: string
  voucher_url?: string
  motivo_anulacion?: string
  fecha_pago?: string
  alumno_id: string
  concepto_id: string
  descuento_id?: string
  created_at: string
  updated_at: string
}

export interface OrdenPagoCreate {
  concepto_id: string
  medio_pago: OrdenPagoMedioPago
  token_culqi?: string
  voucher_url?: string
}

export interface OrdenesFiltros {
  estado?: OrdenPagoEstado
  medio_pago?: OrdenPagoMedioPago
  fecha_desde?: string
  fecha_hasta?: string
}

// ---- Comprobante ----
export type ComprobanteTipo = 'boleta' | 'factura'
export type ComprobanteEstado = 'emitido' | 'observado' | 'anulado'

export interface Comprobante {
  id: string
  tipo: ComprobanteTipo
  numero?: string
  nombre_pagador: string
  ruc?: string
  razon_social?: string
  estado: ComprobanteEstado
  motivo?: string
  nota_credito?: string
  fecha_emision: string
  orden_id: string
  created_at: string
  updated_at: string
}

export interface ComprobanteEmitir {
  orden_id: string
  tipo: ComprobanteTipo
  nombre_pagador: string
  ruc?: string
  razon_social?: string
}

// ---- Conciliacion ----
export type ConciliacionEstado = 'abierta' | 'en_revision' | 'cerrada'

export interface Conciliacion {
  id: string
  periodo_inicio: string
  periodo_fin: string
  monto_esperado: number
  monto_abonado: number
  comision: number
  estado: ConciliacionEstado
  fecha_cierre?: string
  created_at: string
  updated_at: string
}

export interface ConciliacionOrden {
  id: string
  orden_id: string
  conciliada: boolean
  diferencia?: number
}

export interface ConciliacionDetalle extends Conciliacion {
  ordenes: ConciliacionOrden[]
}

export interface ConciliacionCreate {
  periodo_inicio: string
  periodo_fin: string
}

// ---- Usuario ----
// Mismos roles que UserRole (types/auth.ts) menos 'alumno': un alumno nunca es un Usuario de staff.
export type UsuarioRol = Exclude<UserRole, 'alumno'>
export type UsuarioEstado = 'activo' | 'inactivo'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: UsuarioRol
  estado: UsuarioEstado
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
  estado?: UsuarioEstado
  password?: string
}

// ---- CuentaAlumno ----
export type CuentaAlumnoEstado = 'activa' | 'inactiva'

export interface CuentaAlumno {
  id: string
  nombres: string
  apellidos: string
  dni: string
  correo: string
  telefono: string
  estado: CuentaAlumnoEstado
  created_at: string
  updated_at: string
}

export interface CuentaAlumnoUpdate {
  nombres?: string
  apellidos?: string
  dni?: string
  telefono?: string
  estado?: CuentaAlumnoEstado
}

export type LeadOrigen = 'popup' | 'formulario'
export type LeadEstado = 'nuevo' | 'contactado' | 'pago' | 'descartado'
export interface Lead {
  id: string
  nombre?: string
  correo?: string
  telefono?: string
  origen: LeadOrigen
  estado: LeadEstado
  created_at: string
  updated_at: string
}

export type ConceptoCobroTipo = 'matricula' | 'mensualidad' | 'certificacion' | 'gratuito'
export type ConceptoCobroEstado = 'activo' | 'inactivo'
export interface ConceptoCobro {
  id: string
  tipo: ConceptoCobroTipo
  monto: number
  descripcion?: string
  estado: ConceptoCobroEstado
  programa_id: string
  created_at: string
  updated_at: string
}
