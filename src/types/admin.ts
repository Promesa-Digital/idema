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
