type BadgeColor = 'green' | 'yellow' | 'red' | 'blue' | 'gray'

const STATUS_COLOR: Record<string, BadgeColor> = {
  // verde
  activo: 'green',
  pagada: 'green',
  publicado: 'green',
  aprobado: 'green',
  activa: 'green',
  emitido: 'green',
  // amarillo
  pendiente: 'yellow',
  borrador: 'yellow',
  en_revision: 'yellow',
  pendiente_confirmacion: 'yellow',
  // rojo
  anulada: 'red',
  fallida: 'red',
  rechazado: 'red',
  inactivo: 'red',
  archivado: 'red',
  observado: 'red',
  // azul
  nuevo: 'blue',
  contactado: 'blue',
  // gris
  descartado: 'gray',
  cerrada: 'gray',
}

const COLOR_CLASSES: Record<BadgeColor, string> = {
  green: 'bg-emerald-100 text-emerald-700',
  yellow: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
}

interface BadgeProps {
  value: string
  label?: string
}

export default function Badge({ value, label }: BadgeProps) {
  const color = STATUS_COLOR[value] ?? 'gray'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${COLOR_CLASSES[color]}`}
    >
      {label ?? value.replace(/_/g, ' ')}
    </span>
  )
}
