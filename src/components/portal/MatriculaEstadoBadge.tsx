import type { EstadoMatricula } from '../../types/matricula'
import { ESTADO_MATRICULA_LABELS } from '../../types/matricula'

const ESTADO_CLASSES: Record<EstadoMatricula, string> = {
  activa: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  finalizada: 'bg-white/10 text-white/50 border-white/20',
  suspendida: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
}

export default function MatriculaEstadoBadge({ estado }: { estado: EstadoMatricula }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${ESTADO_CLASSES[estado]}`}
    >
      {ESTADO_MATRICULA_LABELS[estado]}
    </span>
  )
}
