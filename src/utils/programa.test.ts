import { describe, expect, it } from 'vitest'
import { ANIO_MAXIMO, ANIO_MINIMO, validarRangos } from './programa'

const VALIDO = { anio: '2026', num_lecciones: '40' }

describe('validarRangos: año', () => {
  it('acepta un año normal', () => {
    expect(validarRangos(VALIDO)).toBeNull()
  })

  it('rechaza 1800, que es lo que se colaba', () => {
    // El diccionario dice "cuatro dígitos"; el formulario solo tenía min=1.
    expect(validarRangos({ ...VALIDO, anio: '1800' })?.campo).toBe('anio')
  })

  it('respeta los límites, inclusive', () => {
    expect(validarRangos({ ...VALIDO, anio: String(ANIO_MINIMO) })).toBeNull()
    expect(validarRangos({ ...VALIDO, anio: String(ANIO_MAXIMO) })).toBeNull()
    expect(validarRangos({ ...VALIDO, anio: String(ANIO_MINIMO - 1) })?.campo).toBe('anio')
    expect(validarRangos({ ...VALIDO, anio: String(ANIO_MAXIMO + 1) })?.campo).toBe('anio')
  })

  it('rechaza lo que no es un entero', () => {
    expect(validarRangos({ ...VALIDO, anio: '20.5' })?.campo).toBe('anio')
    expect(validarRangos({ ...VALIDO, anio: 'dosmil' })?.campo).toBe('anio')
  })
})

describe('validarRangos: lecciones', () => {
  it('rechaza negativas antes de llegar al servidor', () => {
    // Antes fallaba en el backend con "Input should be greater than or equal to 0".
    const r = validarRangos({ ...VALIDO, num_lecciones: '-5' })
    expect(r?.campo).toBe('num_lecciones')
    expect(r?.mensaje).toMatch(/entre 0 y/)
  })

  it('acepta cero: un programa puede no tener lecciones contadas', () => {
    expect(validarRangos({ ...VALIDO, num_lecciones: '0' })).toBeNull()
  })

  it('avisa del año primero si los dos están mal', () => {
    expect(validarRangos({ anio: '1800', num_lecciones: '-5' })?.campo).toBe('anio')
  })
})
