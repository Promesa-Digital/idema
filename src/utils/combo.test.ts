import { describe, expect, it } from 'vitest'
import type { ComboBackend } from '@/types/backend'
import { moverEnLista, validarCombo } from './combo'

function combo(parcial: Partial<ComboBackend>): ComboBackend {
  return {
    id: 'c-1',
    nombre: 'Pack Salud',
    descripcion: null,
    vigencia_inicio: '2026-01-01',
    vigencia_fin: '2026-12-31',
    estado: 'activo',
    programa_ids: ['p-1', 'p-2'],
    programa_nombres: ['Enfermería', 'Farmacia'],
    monto: '600.00',
    enlace_pago: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...parcial,
  }
}

const VALIDO = {
  nombre: 'Pack Negocios',
  vigencia_inicio: '2026-03-01',
  vigencia_fin: '2026-06-30',
  programa_ids: ['p-3', 'p-4'],
}

describe('validarCombo: nombre', () => {
  it('acepta un formulario correcto', () => {
    expect(validarCombo(VALIDO)).toEqual({})
  })

  it('exige nombre', () => {
    expect(validarCombo({ ...VALIDO, nombre: '   ' }).nombre).toBeTruthy()
  })

  it('detecta un nombre ya usado, ignorando mayúsculas y tildes', () => {
    expect(validarCombo({ ...VALIDO, nombre: 'pack salud' }, [combo({})]).nombre).toMatch(
      /Ya existe/,
    )
  })

  it('no se denuncia a sí mismo al editar', () => {
    expect(validarCombo({ ...VALIDO, nombre: 'Pack Salud' }, [combo({})], 'c-1').nombre).toBeUndefined()
  })
})

describe('validarCombo: vigencia', () => {
  it('exige ambas fechas', () => {
    const errores = validarCombo({ ...VALIDO, vigencia_inicio: '', vigencia_fin: '' })
    expect(errores.vigencia_inicio).toBeTruthy()
    expect(errores.vigencia_fin).toBeTruthy()
  })

  it('rechaza que el fin sea anterior al inicio', () => {
    const errores = validarCombo({
      ...VALIDO,
      vigencia_inicio: '2026-06-30',
      vigencia_fin: '2026-03-01',
    })
    expect(errores.vigencia_fin).toMatch(/anterior a la de inicio/)
  })

  it('acepta que empiece y acabe el mismo día', () => {
    const errores = validarCombo({
      ...VALIDO,
      vigencia_inicio: '2026-03-01',
      vigencia_fin: '2026-03-01',
    })
    expect(errores.vigencia_fin).toBeUndefined()
  })
})

describe('validarCombo: programas', () => {
  it('exige al menos dos', () => {
    expect(validarCombo({ ...VALIDO, programa_ids: ['p-1'] }).programa_ids).toMatch(/al menos 2/)
    expect(validarCombo({ ...VALIDO, programa_ids: [] }).programa_ids).toBeTruthy()
  })

  it('rechaza repetidos', () => {
    const errores = validarCombo({ ...VALIDO, programa_ids: ['p-1', 'p-1', 'p-2'] })
    expect(errores.programa_ids).toMatch(/repetido/)
  })
})

describe('moverEnLista', () => {
  it('sube un elemento', () => {
    expect(moverEnLista(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c'])
  })

  it('baja un elemento', () => {
    expect(moverEnLista(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b'])
  })

  it('devuelve el mismo array si el movimiento no cabe', () => {
    const lista = ['a', 'b']
    expect(moverEnLista(lista, 0, -1)).toBe(lista)
    expect(moverEnLista(lista, 1, 1)).toBe(lista)
  })

  it('no muta el original', () => {
    const lista = ['a', 'b']
    moverEnLista(lista, 0, 1)
    expect(lista).toEqual(['a', 'b'])
  })
})
