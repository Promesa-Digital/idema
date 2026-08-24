export function formatFecha(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** El backend manda montos como string (Decimal), no number, para no perder precisión. */
export function formatMonto(monto: number | string): string {
  const num = typeof monto === 'string' ? Number(monto) : monto
  return `S/ ${Number.isFinite(num) ? num.toFixed(2) : '0.00'}`
}
