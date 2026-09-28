/**
 * Reglas de los campos numericos de un programa.
 *
 * El diccionario de datos define `anio` como "ano calendario de cuatro digitos", pero el
 * formulario solo declaraba min=1: se podia guardar un programa del ano 1800. Y las
 * lecciones negativas solo las rechazaba el backend, con un mensaje en ingles y sin
 * decir que campo era.
 */

/** Cuatro digitos, con margen razonable alrededor del presente. */
export const ANIO_MINIMO = 1990
export const ANIO_MAXIMO = 2100

export const LECCIONES_MAXIMO = 9999

export interface RangosPrograma {
  anio: string
  num_lecciones: string
}

export type CampoNumerico = keyof RangosPrograma

/**
 * Devuelve el primer campo fuera de rango, o null. Se valida aqui y no solo en el
 * servidor para que el aviso salga en espanol y junto al campo.
 */
export function validarRangos(
  datos: RangosPrograma,
): { campo: CampoNumerico; mensaje: string } | null {
  const anio = Number(datos.anio)
  if (!Number.isInteger(anio) || anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    return {
      campo: 'anio',
      mensaje: `El año debe estar entre ${ANIO_MINIMO} y ${ANIO_MAXIMO}.`,
    }
  }

  const lecciones = Number(datos.num_lecciones)
  if (!Number.isInteger(lecciones) || lecciones < 0 || lecciones > LECCIONES_MAXIMO) {
    return {
      campo: 'num_lecciones',
      mensaje: `El número de lecciones debe estar entre 0 y ${LECCIONES_MAXIMO}.`,
    }
  }

  return null
}
