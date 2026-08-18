import type { PopupEstado } from '../../types/admin'
import { POPUP_ESTADO_LABELS } from '../../types/admin'

const ESTADO_CLASSES: Record<PopupEstado, string> = {
  borrador: 'bg-white/10 text-white/50 border-white/20',
  pendiente_aprobacion: 'bg-amber-500/15 text-amber-300 border-amber-400/40',
  aprobado: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40',
  rechazado: 'bg-rose-500/15 text-rose-300 border-rose-400/40',
}

export default function PopupEstadoBadge({ estado }: { estado: PopupEstado }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${ESTADO_CLASSES[estado]}`}>
      {POPUP_ESTADO_LABELS[estado]}
    </span>
  )
}
