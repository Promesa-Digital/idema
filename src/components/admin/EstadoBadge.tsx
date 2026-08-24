import type { ProgramaEstado } from '../../types/admin'
import { PROGRAMA_ESTADO_LABELS } from '../../types/admin'

const ESTADO_CLASSES: Record<ProgramaEstado, string> = {
  no_publicado: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
  publicado: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  archivado: 'bg-white/10 text-white/50 border-white/20',
}

export default function EstadoBadge({ estado }: { estado: ProgramaEstado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${ESTADO_CLASSES[estado]}`}>
      {PROGRAMA_ESTADO_LABELS[estado]}
    </span>
  )
}
