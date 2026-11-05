import { describe, expect, it } from 'vitest'
import { siguienteCodigo } from './codigoPrograma'

describe('siguienteCodigo', () => {
  it('usa el prefijo que corresponde al tipo elegido', () => {
    expect(siguienteCodigo([], 'carrera')).toBe('CAR001')
    expect(siguienteCodigo([], 'auxiliar')).toBe('AUX001')
    expect(siguienteCodigo([], 'especializacion')).toBe('ESP001')
    expect(siguienteCodigo([], 'curso')).toBe('CUR001')
  })

  it('cuenta por tipo: cada familia lleva su propia secuencia', () => {
    // Datos reales: 4 carreras, 3 auxiliares, 4 especializaciones, 31 cursos.
    const existentes = ['CAR001', 'CAR004', 'AUX007', 'ESP011', 'CUR042']
    expect(siguienteCodigo(existentes, 'carrera')).toBe('CAR005')
    expect(siguienteCodigo(existentes, 'curso')).toBe('CUR043')
  })

  it('no deja que el número de un tipo arrastre al de otro', () => {
    // Hay un CUR042, pero eso no debe empujar la numeración de auxiliares.
    expect(siguienteCodigo(['CUR042', 'AUX003'], 'auxiliar')).toBe('AUX004')
  })

  it('mantiene tres dígitos con ceros a la izquierda', () => {
    expect(siguienteCodigo(['CUR008'], 'curso')).toBe('CUR009')
  })

  it('crece más allá de tres dígitos sin truncar', () => {
    expect(siguienteCodigo(['CUR999'], 'curso')).toBe('CUR1000')
  })

  it('toma el mayor aunque la lista venga desordenada', () => {
    expect(siguienteCodigo(['CUR030', 'CAR002', 'CUR041', 'AUX005'], 'curso')).toBe('CUR042')
  })

  it('ignora códigos con formato inesperado en vez de romperse', () => {
    expect(siguienteCodigo(['SIN-NUMERO', '', 'CUR012'], 'curso')).toBe('CUR013')
  })

  it('empieza en 001 cuando todavía no hay ningún programa', () => {
    expect(siguienteCodigo([], 'curso')).toBe('CUR001')
  })
})
