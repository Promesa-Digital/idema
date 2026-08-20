import type { OrdenEstado } from '../../types/admin'
import { ORDEN_ESTADO_LABELS } from '../../types/admin'

const ESTADO_CLASSES: Record<OrdenEstado, string> = {
  pendiente: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
  pagada: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  anulada: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
}

export default function OrdenEstadoBadge({ estado }: { estado: OrdenEstado }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${ESTADO_CLASSES[estado]}`}
    >
      {ORDEN_ESTADO_LABELS[estado]}
    </span>
  )
}
