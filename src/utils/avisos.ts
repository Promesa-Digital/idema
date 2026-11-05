import type {
  ComboBackend,
  ConceptoCobroBackend,
  DescuentoBackend,
  PopupBackend,
} from '@/types/backend'
import { estadoVigencia } from './vigencia'

/**
 * Un problema de configuración: nadie está esperando a que lo resuelvas, pero mientras
 * siga ahí algo no se cobra, no se ofrece o se cobra mal.
 *
 * Se distingue de los "pendientes" en que estos no son trabajo en cola: son cosas que ya
 * parecen terminadas. Un combo activo sin precio se ve perfecto en la tabla de combos.
 */
export interface AvisoPanel {
  id: string
  ruta: string
  titulo: string
  /** Qué ocurre mientras no se arregle, en una frase. */
  consecuencia: string
  cantidad: number
}

export interface DatosAvisos {
  conceptos?: ConceptoCobroBackend[]
  popups?: PopupBackend[]
  combos?: ComboBackend[]
  descuentos?: DescuentoBackend[]
}

/**
 * Los avisos que aplican, en orden de daño: primero lo que impide cobrar, luego lo que
 * cobra un importe equivocado, y al final lo que solo deja de mostrarse.
 *
 * Solo se evalúa lo que se recibe. Si un rol no puede leer combos, no se le pide la
 * lista y aquí simplemente no sale ningún aviso de combos.
 */
export function detectarAvisos(datos: DatosAvisos, hoy = new Date()): AvisoPanel[] {
  const avisos: AvisoPanel[] = []

  const combosActivos = (datos.combos ?? []).filter((combo) => combo.estado === 'activo')
  const sinPrecio = combosActivos.filter((combo) => !combo.monto)
  if (sinPrecio.length > 0) {
    avisos.push({
      id: 'combos-sin-precio',
      ruta: '/admin/combos',
      titulo: `${sinPrecio.length} combo(s) activo(s) sin concepto de cobro`,
      consecuencia: 'Se ofrecen en la web pero no tienen precio: nadie puede pagarlos.',
      cantidad: sinPrecio.length,
    })
  }

  const conceptosSinEnlace = (datos.conceptos ?? []).filter(
    (concepto) =>
      concepto.estado === 'activo' && concepto.tipo !== 'gratuito' && !concepto.enlace_pago,
  )
  if (conceptosSinEnlace.length > 0) {
    avisos.push({
      id: 'conceptos-sin-enlace',
      ruta: '/admin/conceptos-cobro',
      titulo: `${conceptosSinEnlace.length} concepto(s) de pago sin enlace`,
      consecuencia: 'El alumno llega al pago y no hay a dónde enviarlo.',
      cantidad: conceptosSinEnlace.length,
    })
  }

  // Dos descuentos activos sobre el mismo concepto: el backend se queda con el más
  // reciente, así que el precio que ve el alumno depende del orden de creación.
  const activosPorConcepto = new Map<string, number>()
  for (const descuento of datos.descuentos ?? []) {
    if (descuento.estado !== 'activo') continue
    activosPorConcepto.set(
      descuento.concepto_id,
      (activosPorConcepto.get(descuento.concepto_id) ?? 0) + 1,
    )
  }
  const enConflicto = [...activosPorConcepto.values()].filter((cuenta) => cuenta > 1).length
  if (enConflicto > 0) {
    avisos.push({
      id: 'descuentos-en-conflicto',
      ruta: '/admin/descuentos',
      titulo: `${enConflicto} concepto(s) con dos descuentos activos`,
      consecuencia: 'Cuál de los dos se aplica depende de cuál se creó último.',
      cantidad: enConflicto,
    })
  }

  const popupsFueraDeFecha = (datos.popups ?? []).filter(
    (popup) =>
      popup.estado === 'publicado' &&
      estadoVigencia(popup.fecha_inicio, popup.fecha_fin, hoy) === 'vencido',
  )
  if (popupsFueraDeFecha.length > 0) {
    avisos.push({
      id: 'popups-vencidos',
      ruta: '/admin/popups',
      titulo: `${popupsFueraDeFecha.length} popup(s) publicado(s) fuera de fecha`,
      consecuencia: 'Figuran como publicados pero ya no se muestran a nadie.',
      cantidad: popupsFueraDeFecha.length,
    })
  }

  const combosFueraDeFecha = combosActivos.filter(
    (combo) => estadoVigencia(combo.vigencia_inicio, combo.vigencia_fin, hoy) === 'vencido',
  )
  if (combosFueraDeFecha.length > 0) {
    avisos.push({
      id: 'combos-vencidos',
      ruta: '/admin/combos',
      titulo: `${combosFueraDeFecha.length} combo(s) activo(s) fuera de vigencia`,
      consecuencia: 'Figuran como activos pero ya no se ofrecen.',
      cantidad: combosFueraDeFecha.length,
    })
  }

  return avisos
}
