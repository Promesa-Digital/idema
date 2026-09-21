import type { PopupEstado, PopupTipo } from '@/types/backend'

export const TIPO_POPUP_LABELS: Record<PopupTipo, string> = {
  anuncio: 'Anuncio',
  descuento: 'Descuento',
}

export const ESTADO_POPUP_LABELS: Record<PopupEstado, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  publicado: 'Publicado',
  finalizado: 'Finalizado',
}

/**
 * Qué pasa después en cada estado.
 *
 * El circuito tiene seis estados y cuatro roles: quien crea un popup ve "Pendiente" y no
 * sabe si le toca hacer algo o esperar. Esta frase lo dice.
 */
export const ESTADO_POPUP_SIGUIENTE: Record<PopupEstado, string> = {
  borrador: 'Envíalo a aprobación cuando esté listo.',
  pendiente: 'Esperando revisión de Dirección de Marketing.',
  aprobado: 'Aprobado: falta publicarlo para que se vea.',
  rechazado: 'Corrígelo y vuelve a enviarlo.',
  publicado: 'Visible en la web dentro de su vigencia.',
  finalizado: 'Retirado. Ya no se muestra a nadie.',
}

export type CampoPopup =
  | 'texto'
  | 'imagen_url'
  | 'video_url'
  | 'enlace'
  | 'concepto_cobro_id'
  | 'texto_superior'
  | 'fecha_inicio'
  | 'fecha_fin'

export type ErroresPopup = Partial<Record<CampoPopup, string>>

/** Lo que la validación necesita del formulario. */
export interface DatosPopup {
  tipo: PopupTipo
  texto: string
  imagen_url: string
  video_url: string
  enlace: string
  concepto_cobro_id: string
  texto_superior: string
  fecha_inicio: string
  fecha_fin: string
}

/**
 * Acepta una URL absoluta http(s) o una ruta interna que empiece por "/".
 * Un enlace suelto como "promociones" no lleva a ninguna parte desde un popup.
 */
export function destinoValido(valor: string): boolean {
  if (valor.startsWith('/')) return true
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validarPopup(datos: DatosPopup): ErroresPopup {
  const errores: ErroresPopup = {}

  if (!datos.texto.trim()) errores.texto = 'Escribe el texto del popup.'
  if (!datos.imagen_url.trim()) errores.imagen_url = 'Sube una imagen.'

  const enlace = datos.enlace.trim()
  if (enlace && !destinoValido(enlace)) {
    errores.enlace = 'Usa una dirección https:// o una ruta interna que empiece por "/".'
  }

  const video = datos.video_url.trim()
  if (datos.tipo === 'anuncio' && video && !destinoValido(video)) {
    errores.video_url = 'Usa una dirección https:// válida.'
  }

  if (datos.tipo === 'descuento') {
    if (!datos.concepto_cobro_id) {
      errores.concepto_cobro_id = 'Elige el concepto de cobro al que aplica el descuento.'
    }
    if (!datos.texto_superior.trim()) {
      errores.texto_superior = 'Escribe el texto superior del descuento.'
    }
  }

  if (!datos.fecha_inicio) errores.fecha_inicio = 'Indica desde cuándo se muestra.'
  if (!datos.fecha_fin) errores.fecha_fin = 'Indica hasta cuándo se muestra.'

  // Antes esto solo pintaba un aviso ámbar y dejaba guardar: se podían crear popups
  // que terminaban antes de empezar, y no se mostraban nunca sin decir por qué.
  if (datos.fecha_inicio && datos.fecha_fin && datos.fecha_inicio > datos.fecha_fin) {
    errores.fecha_fin = 'La fecha de fin no puede ser anterior a la de inicio.'
  }

  return errores
}

