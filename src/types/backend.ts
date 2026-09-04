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
