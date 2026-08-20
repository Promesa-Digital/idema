export type EstadoMatricula = 'activa' | 'finalizada' | 'suspendida'

export const ESTADO_MATRICULA_LABELS: Record<EstadoMatricula, string> = {
  activa: 'Activa',
  finalizada: 'Finalizada',
  suspendida: 'Suspendida',
}

export interface Matricula {
  id: string
  programa: string
  periodo: string
  modalidad: string
  estado: EstadoMatricula
  fechaInicio: string
}
