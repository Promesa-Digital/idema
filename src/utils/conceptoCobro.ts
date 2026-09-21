import type {
  ConceptoCobroBackend,
  ConceptoCobroEstado,
  ConceptoCobroTipo,
} from '@/types/backend'

export const TIPO_CONCEPTO_LABELS: Record<ConceptoCobroTipo, string> = {
  matricula: 'Matrícula',
  inscripcion: 'Inscripción',
  curso: 'Curso',
  pension: 'Pensión',
  gratuito: 'Gratuito',
}

export const ESTADO_CONCEPTO_LABELS: Record<ConceptoCobroEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

export type DestinoTipo = 'programa' | 'combo'

/** Los campos que pueden marcarse en rojo. El resto de fallos son del servidor. */
export type CampoConcepto = 'tipo' | 'monto' | 'enlacePago' | 'destinoId'

export type ErroresConcepto = Partial<Record<CampoConcepto, string>>

/** Lo que la validación necesita del formulario, sin arrastrar el resto de campos. */
export interface DatosConcepto {
  tipo: ConceptoCobroTipo
  monto: string
  enlacePago: string
  destinoTipo: DestinoTipo
  destinoId: string
}

/** Un enlace de pago solo sirve si es http(s): "culqi.com" a secas no lleva a ningún lado. */
export function enlaceValido(valor: string): boolean {
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function formatMonto(value: string): string {
  const monto = Number(value)
  if (!Number.isFinite(monto)) return `S/ ${value}`

  return `S/ ${monto.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

/**
 * Valida el formulario devolviendo un mensaje por campo, en vez de una sola frase arriba:
 * así el rojo cae junto al campo que hay que arreglar y no hay que adivinar cuál era.
 *
 * `editandoId` excluye de la busqueda de duplicados el concepto que se esta editando;
 * sin eso, guardar sin tocar el destino se denunciaria a si mismo como duplicado.
 */
export function validarConcepto(
  datos: DatosConcepto,
  existentes: ConceptoCobroBackend[],
  editandoId?: string,
): ErroresConcepto {
  const errores: ErroresConcepto = {}

  const montoTexto = datos.monto.trim()
  const monto = Number(montoTexto)

  if (!montoTexto || !Number.isFinite(monto)) {
    errores.monto = 'Ingresa un monto válido.'
  } else if (datos.tipo === 'gratuito' && monto !== 0) {
    errores.monto = 'Un concepto gratuito debe costar S/ 0.00.'
  } else if (datos.tipo !== 'gratuito' && monto <= 0) {
    errores.monto = 'El monto debe ser mayor que S/ 0.00.'
  }

  const enlace = datos.enlacePago.trim()
  if (enlace && !enlaceValido(enlace)) {
    errores.enlacePago = 'Debe empezar por https:// (o http://).'
  }

  if (!datos.destinoId) {
    errores.destinoId =
      datos.destinoTipo === 'programa' ? 'Elige un programa.' : 'Elige un combo.'
    return errores
  }

  // Dos conceptos del mismo tipo para el mismo destino compiten entre sí: al cobrar,
  // cuál de los dos precios vale queda al azar. Se detecta antes de guardar.
  const duplicado = existentes.find(
    (concepto) =>
      concepto.id !== editandoId &&
      concepto.tipo === datos.tipo &&
      (datos.destinoTipo === 'programa'
        ? concepto.programa_id === datos.destinoId
        : concepto.combo_id === datos.destinoId),
  )
  if (duplicado) {
    errores.destinoId = `Ya existe un concepto de ${TIPO_CONCEPTO_LABELS[datos.tipo]} (${ESTADO_CONCEPTO_LABELS[
      duplicado.estado
    ].toLowerCase()}) para este destino. Edita ese en vez de crear otro.`
  }

  return errores
}
