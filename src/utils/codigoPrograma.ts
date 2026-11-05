import type { ProgramaTipo } from '@/types/backend'

/** El prefijo lo decide el tipo: un curso nunca debería llamarse CAR0xx. */
export const PREFIJO_POR_TIPO: Record<ProgramaTipo, string> = {
  carrera: 'CAR',
  auxiliar: 'AUX',
  especializacion: 'ESP',
  curso: 'CUR',
}

const LARGO_NUMERO = 3

/**
 * Sugiere el siguiente código para un programa nuevo.
 *
 * Cada tipo lleva **su propia numeración**: si hay cuatro carreras, la siguiente es
 * CAR005. Así el número dice cuántos hay de esa familia y los códigos de un tipo quedan
 * juntos, en vez de repartidos por una secuencia global.
 *
 * Los datos iniciales venían numerados de corrido (CAR001-004, AUX005-007, ESP008-011,
 * CUR012-042), seguramente por haberse cargado de una sola vez. Eso hace que las
 * primeras sugerencias reaprovechen números ya usados por otro prefijo —la próxima
 * carrera es CAR005, que convive con AUX005—, lo cual es correcto: el código es único
 * por su prefijo más su número, no solo por el número.
 *
 * Es una sugerencia, no una garantía: si dos personas crean a la vez pueden pedir el
 * mismo. El backend tiene la restricción de unicidad y responde 409, que es donde se
 * resuelve de verdad.
 */
export function siguienteCodigo(codigosExistentes: string[], tipo: ProgramaTipo): string {
  const prefijo = PREFIJO_POR_TIPO[tipo]

  const numeros = codigosExistentes
    .map((codigo) => new RegExp(`^${prefijo}(\\d+)$`).exec(codigo.trim().toUpperCase())?.[1])
    .filter((numero): numero is string => Boolean(numero))
    .map(Number)

  const siguiente = (numeros.length ? Math.max(...numeros) : 0) + 1
  return `${prefijo}${String(siguiente).padStart(LARGO_NUMERO, '0')}`
}
