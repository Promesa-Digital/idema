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
