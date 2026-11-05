export type EstadoVigencia = 'programado' | 'vigente' | 'vencido'

/**
 * Dónde cae hoy respecto a un rango de fechas.
 *
 * Existe porque un registro puede estar "activo" o "publicado" y aun así no verse: el
 * estado y la vigencia son dos cosas distintas, y la tabla solo mostraba la primera.
 * Compara solo la parte de fecha, en local, porque la vigencia se define por días.
 */
export function estadoVigencia(
  fechaInicio: string,
  fechaFin: string,
  hoy = new Date(),
): EstadoVigencia {
  const dia = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
    hoy.getDate(),
  ).padStart(2, '0')}`
  if (dia < fechaInicio.slice(0, 10)) return 'programado'
  if (dia > fechaFin.slice(0, 10)) return 'vencido'
  return 'vigente'
}

/** "2026-03-09" -> "09/03/2026". */
export function formatFecha(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}
