import type { ComboBackend, ComboEstado } from '@/types/backend'

export const ESTADO_COMBO_LABELS: Record<ComboEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

/** Un paquete de un solo programa no es un paquete. */
export const PROGRAMAS_MINIMOS = 2

export type CampoCombo = 'nombre' | 'vigencia_inicio' | 'vigencia_fin' | 'programa_ids'

export type ErroresCombo = Partial<Record<CampoCombo, string>>

export interface DatosCombo {
  nombre: string
  vigencia_inicio: string
  vigencia_fin: string
  programa_ids: string[]
}

export function validarCombo(
  datos: DatosCombo,
  existentes: ComboBackend[] = [],
  editandoId?: string,
): ErroresCombo {
  const errores: ErroresCombo = {}

  const nombre = datos.nombre.trim()
  if (!nombre) {
    errores.nombre = 'Ponle un nombre al combo.'
  } else {
    // Dos combos con el mismo nombre son indistinguibles en la web y en los reportes.
    const repetido = existentes.some(
      (combo) =>
        combo.id !== editandoId &&
        combo.nombre.trim().localeCompare(nombre, 'es', { sensitivity: 'base' }) === 0,
    )
    if (repetido) errores.nombre = 'Ya existe un combo con este nombre.'
  }

  if (!datos.vigencia_inicio) errores.vigencia_inicio = 'Indica desde cuándo se ofrece.'
  if (!datos.vigencia_fin) errores.vigencia_fin = 'Indica hasta cuándo se ofrece.'
  if (
    datos.vigencia_inicio &&
    datos.vigencia_fin &&
    datos.vigencia_inicio > datos.vigencia_fin
  ) {
    errores.vigencia_fin = 'La fecha de fin no puede ser anterior a la de inicio.'
  }

  if (datos.programa_ids.length < PROGRAMAS_MINIMOS) {
    errores.programa_ids = `Agrega al menos ${PROGRAMAS_MINIMOS} programas.`
  } else if (new Set(datos.programa_ids).size !== datos.programa_ids.length) {
    // El backend también lo rechaza; aquí se evita el viaje y el mensaje genérico.
    errores.programa_ids = 'Hay un programa repetido en el combo.'
  }

  return errores
}

/**
 * Mueve un elemento una posición. Devuelve el mismo array si el movimiento no cabe, para
 * que React no vuelva a renderizar por nada.
 */
export function moverEnLista<T>(lista: T[], indice: number, direccion: -1 | 1): T[] {
  const destino = indice + direccion
  if (destino < 0 || destino >= lista.length) return lista
  const copia = [...lista]
  ;[copia[indice], copia[destino]] = [copia[destino], copia[indice]]
  return copia
}
