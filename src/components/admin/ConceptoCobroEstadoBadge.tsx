import type { ConceptoCobroEstado } from '../../types/admin'
import { CONCEPTO_COBRO_ESTADO_LABELS } from '../../types/admin'

const ESTADO_CLASSES: Record<ConceptoCobroEstado, string> = {
  activo: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  inactivo: 'bg-white/10 text-white/50 border-white/20',
}

export default function ConceptoCobroEstadoBadge({ estado }: { estado: ConceptoCobroEstado }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${ESTADO_CLASSES[estado]}`}
    >
      {CONCEPTO_COBRO_ESTADO_LABELS[estado]}
    </span>
  )
}
