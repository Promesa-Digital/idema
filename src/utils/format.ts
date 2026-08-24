export function formatFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatMonto(monto: number): string {
  return `S/ ${monto.toFixed(2)}`
}
