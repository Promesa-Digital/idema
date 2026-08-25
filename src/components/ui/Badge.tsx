type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

const STATUS_COLOR: Record<string, BadgeColor> = {
  // Verde
  activo: 'green',
  pagada: 'green',
  publicado: 'green',
  aprobado: 'green',
  activa: 'green',
  emitido: 'green',
  completado: 'green',
  cerrada: 'green',
  // Amarillo
  pendiente: 'yellow',
  borrador: 'yellow',
  en_revision: 'yellow',
  pendiente_confirmacion: 'yellow',
  nuevo: 'yellow',
  activado: 'yellow',
  // Rojo
  anulada: 'red',
  anulado: 'red',
  fallida: 'red',
  rechazado: 'red',
  inactivo: 'red',
  inactiva: 'red',
  archivado: 'red',
  observado: 'red',
  cancelado: 'red',
  // Azul
  contactado: 'blue',
  retorno: 'blue',
  en_curso: 'blue',
  // Gris
  descartado: 'gray',
  finalizado: 'gray',
  no_publicado: 'gray',
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-[#DCFCE7] text-[#16A34A]',
  yellow: 'bg-[#FEF9C3] text-[#CA8A04]',
  red: 'bg-[#FEE2E2] text-[#DC2626]',
  blue: 'bg-[#DBEAFE] text-[#1D4ED8]',
  gray: 'bg-[#F3F4F6] text-[#6B7280]',
}

interface BadgeProps {
  value: string
  /** Texto a mostrar en vez de `value` (p. ej. "Estudiante Activo" en vez de "activa").
   * El color sigue derivándose de `value`, no del label. */
  label?: string
}

export default function Badge({ value, label }: BadgeProps) {
  const key = value.toLowerCase()
  const color = STATUS_COLOR[key] ?? 'gray'

  return (
    <span
      className={`inline-flex items-center rounded-full px-[10px] py-[2px] text-xs font-semibold capitalize ${COLOR_CLASSES[color]}`}
      style={{ fontFamily: 'var(--font-body)' }}
    >
      {label ?? value.replace(/_/g, ' ')}
    </span>
  )
}
