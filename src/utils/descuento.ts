import type {
  ConceptoCobroBackend,
  DescuentoBackend,
  DescuentoEstado,
  DescuentoTipo,
} from '@/types/backend'
import { TIPO_CONCEPTO_LABELS, formatMonto } from './conceptoCobro'

export const TIPO_DESCUENTO_LABELS: Record<DescuentoTipo, string> = {
  manual: 'Manual',
  pronto_pago: 'Pronto pago',
}

export const ESTADO_DESCUENTO_LABELS: Record<DescuentoEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

/** Límites del porcentaje, según el requisito. */
export const PORCENTAJE_MINIMO = 0.1
export const PORCENTAJE_MAXIMO = 30

export type CampoDescuento = 'porcentaje' | 'concepto_id'

export type ErroresDescuento = Partial<Record<CampoDescuento, string>>

export interface DatosDescuento {
  porcentaje: string
  concepto_id: string
}

/**
 * Cómo se nombra un concepto de cobro en una lista.
 *
 * Antes se mostraba "matricula - S/ 350.00", con el valor crudo del enum y sin decir a
 * qué programa pertenece: dos matrículas de carreras distintas con el mismo precio eran
 * indistinguibles. El destino va primero porque es por donde se busca.
 */
export function etiquetaConcepto(
  concepto: ConceptoCobroBackend,
  nombreDestino?: string,
): string {
  const destino = nombreDestino ?? 'Sin destino'
  return `${destino} · ${TIPO_CONCEPTO_LABELS[concepto.tipo]} · ${formatMonto(concepto.monto)}`
}

/**
 * `estadoActual` distingue crear o editar un descuento activo (donde otro activo sobre el
 * mismo concepto es un choque real) de editar uno ya dado de baja, que no compite con nada
 * hasta que se reactive.
 */
export function validarDescuento(
  datos: DatosDescuento,
  existentes: DescuentoBackend[],
  editandoId?: string,
  estadoActual: DescuentoEstado = 'activo',
): ErroresDescuento {
  const errores: ErroresDescuento = {}

  const porcentaje = Number(datos.porcentaje)
  const dosDecimalesComoMucho = /^\d+(?:\.\d{1,2})?$/.test(datos.porcentaje.trim())

  if (
    !datos.porcentaje.trim() ||
    !dosDecimalesComoMucho ||
    !Number.isFinite(porcentaje) ||
    porcentaje < PORCENTAJE_MINIMO ||
    porcentaje > PORCENTAJE_MAXIMO
  ) {
    errores.porcentaje = `Entre ${PORCENTAJE_MINIMO}% y ${PORCENTAJE_MAXIMO}%, con hasta 2 decimales.`
  }

  if (!datos.concepto_id) {
    errores.concepto_id = 'Elige el concepto de cobro al que se aplica.'
    return errores
  }

  if (estadoActual === 'activo') {
    const choque = buscarActivoDelConcepto(existentes, datos.concepto_id, editandoId)
    if (choque) {
      errores.concepto_id = `Este concepto ya tiene un descuento activo del ${choque.porcentaje}%. Solo puede haber uno: desactiva ese antes de crear otro.`
    }
  }

  return errores
}

/**
 * El descuento activo de un concepto, si lo hay.
 *
 * El modelo no impide que haya dos y el backend resuelve el empate quedándose con el más
 * reciente, es decir al azar desde el punto de vista de quien cobra. Se evita aquí.
 */
export function buscarActivoDelConcepto(
  descuentos: DescuentoBackend[],
  conceptoId: string,
  excluirId?: string,
): DescuentoBackend | undefined {
  return descuentos.find(
    (descuento) =>
      descuento.id !== excluirId &&
      descuento.concepto_id === conceptoId &&
      descuento.estado === 'activo',
  )
}

/** Lo que costará el concepto una vez aplicado el descuento. */
export function montoConDescuento(monto: string, porcentaje: string): string {
  const base = Number(monto)
  const pct = Number(porcentaje)
  if (!Number.isFinite(base) || !Number.isFinite(pct)) return formatMonto(monto)
  return formatMonto(String(base * (1 - pct / 100)))
}
