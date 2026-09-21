import { describe, expect, it } from 'vitest'
import type { ConceptoCobroBackend } from '@/types/backend'
import type { DatosConcepto } from './conceptoCobro'
import { enlaceValido, formatMonto, validarConcepto } from './conceptoCobro'

const VALIDO: DatosConcepto = {
  tipo: 'matricula',
  monto: '350',
  enlacePago: '',
  destinoTipo: 'programa',
  destinoId: 'prog-1',
}

function concepto(parcial: Partial<ConceptoCobroBackend>): ConceptoCobroBackend {
  return {
    id: 'c-1',
    tipo: 'matricula',
    monto: '350.00',
    descripcion: null,
    modalidad: null,
    enlace_pago: null,
    programa_id: 'prog-1',
    combo_id: null,
    estado: 'activo',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...parcial,
  }
}

describe('validarConcepto: monto', () => {
  it('acepta un formulario correcto', () => {
    expect(validarConcepto(VALIDO, [])).toEqual({})
  })

  it('rechaza el monto vacío', () => {
    expect(validarConcepto({ ...VALIDO, monto: '  ' }, []).monto).toMatch(/monto válido/)
  })

  it('rechaza un monto que no es número', () => {
    expect(validarConcepto({ ...VALIDO, monto: 'gratis' }, []).monto).toBeTruthy()
  })

  it('obliga a que un concepto gratuito cueste cero', () => {
    const errores = validarConcepto({ ...VALIDO, tipo: 'gratuito', monto: '50' }, [])
    expect(errores.monto).toMatch(/S\/ 0\.00/)
  })

  it('acepta cero solo en los gratuitos', () => {
    expect(validarConcepto({ ...VALIDO, tipo: 'gratuito', monto: '0' }, []).monto).toBeUndefined()
    expect(validarConcepto({ ...VALIDO, monto: '0' }, []).monto).toMatch(/mayor que/)
  })

  it('rechaza montos negativos', () => {
    expect(validarConcepto({ ...VALIDO, monto: '-10' }, []).monto).toBeTruthy()
  })
})

describe('validarConcepto: enlace de pago', () => {
  it('lo deja pasar vacío, porque es opcional', () => {
    expect(validarConcepto(VALIDO, []).enlacePago).toBeUndefined()
  })

  it('rechaza un enlace sin protocolo', () => {
    expect(validarConcepto({ ...VALIDO, enlacePago: 'culqi.com/pago' }, []).enlacePago).toBeTruthy()
  })

  it('acepta https y http', () => {
    expect(
      validarConcepto({ ...VALIDO, enlacePago: 'https://culqi.com/x' }, []).enlacePago,
    ).toBeUndefined()
    expect(
      validarConcepto({ ...VALIDO, enlacePago: 'http://culqi.com/x' }, []).enlacePago,
    ).toBeUndefined()
  })

  it('rechaza otros protocolos, como javascript:', () => {
    expect(enlaceValido('javascript:alert(1)')).toBe(false)
    expect(enlaceValido('ftp://archivo')).toBe(false)
  })
})

describe('validarConcepto: destino', () => {
  it('exige elegir destino y lo nombra según el tipo', () => {
    expect(validarConcepto({ ...VALIDO, destinoId: '' }, []).destinoId).toBe('Elige un programa.')
    expect(
      validarConcepto({ ...VALIDO, destinoTipo: 'combo', destinoId: '' }, []).destinoId,
    ).toBe('Elige un combo.')
  })

  it('no busca duplicados si aún no hay destino, para no tapar el error real', () => {
    const errores = validarConcepto({ ...VALIDO, destinoId: '' }, [concepto({})])
    expect(errores.destinoId).toBe('Elige un programa.')
  })
})

describe('validarConcepto: duplicados', () => {
  it('detecta otro concepto del mismo tipo para el mismo programa', () => {
    const errores = validarConcepto(VALIDO, [concepto({ id: 'otro' })])
    expect(errores.destinoId).toMatch(/Ya existe un concepto de Matrícula \(activo\)/)
  })

  it('también detecta el duplicado inactivo, y lo dice', () => {
    const errores = validarConcepto(VALIDO, [concepto({ id: 'otro', estado: 'inactivo' })])
    expect(errores.destinoId).toMatch(/\(inactivo\)/)
  })

  it('no se denuncia a sí mismo al editar', () => {
    const existente = concepto({ id: 'c-1' })
    expect(validarConcepto(VALIDO, [existente], 'c-1').destinoId).toBeUndefined()
  })

  it('no confunde tipos distintos sobre el mismo programa', () => {
    const errores = validarConcepto(VALIDO, [concepto({ id: 'otro', tipo: 'pension' })])
    expect(errores.destinoId).toBeUndefined()
  })

  it('no confunde el mismo tipo en programas distintos', () => {
    const errores = validarConcepto(VALIDO, [concepto({ id: 'otro', programa_id: 'prog-9' })])
    expect(errores.destinoId).toBeUndefined()
  })

  it('no cruza programas con combos aunque compartan identificador', () => {
    const comboMismoId = concepto({ id: 'otro', programa_id: null, combo_id: 'prog-1' })
    expect(validarConcepto(VALIDO, [comboMismoId]).destinoId).toBeUndefined()
  })

  it('detecta el duplicado en combos', () => {
    const datos = { ...VALIDO, destinoTipo: 'combo' as const, destinoId: 'combo-1' }
    const existente = concepto({ id: 'otro', programa_id: null, combo_id: 'combo-1' })
    expect(validarConcepto(datos, [existente]).destinoId).toBeTruthy()
  })
})

describe('validarConcepto: varios errores a la vez', () => {
  it('devuelve monto y enlace juntos, no el primero que encuentra', () => {
    const errores = validarConcepto(
      { ...VALIDO, monto: '', enlacePago: 'culqi.com' },
      [],
    )
    expect(errores.monto).toBeTruthy()
    expect(errores.enlacePago).toBeTruthy()
  })
})

describe('formatMonto', () => {
  it('pone dos decimales y el símbolo', () => {
    expect(formatMonto('350')).toBe('S/ 350.00')
  })

  it('separa los miles', () => {
    expect(formatMonto('1200.5')).toBe('S/ 1,200.50')
  })

  it('no rompe si el backend manda algo que no es número', () => {
    expect(formatMonto('n/d')).toBe('S/ n/d')
  })
})
