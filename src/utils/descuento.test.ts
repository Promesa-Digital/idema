import { describe, expect, it } from 'vitest'
import type { ConceptoCobroBackend, DescuentoBackend } from '@/types/backend'
import {
  buscarActivoDelConcepto,
  etiquetaConcepto,
  montoConDescuento,
  validarDescuento,
} from './descuento'

function descuento(parcial: Partial<DescuentoBackend>): DescuentoBackend {
  return {
    id: 'd-1',
    tipo: 'manual',
    porcentaje: '10.00',
    descripcion: null,
    estado: 'activo',
    concepto_id: 'con-1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...parcial,
  }
}

const VALIDO = { porcentaje: '15', concepto_id: 'con-1' }

describe('validarDescuento: porcentaje', () => {
  it('acepta un formulario correcto', () => {
    expect(validarDescuento(VALIDO, [])).toEqual({})
  })

  it('rechaza el vacío', () => {
    expect(validarDescuento({ ...VALIDO, porcentaje: '  ' }, []).porcentaje).toBeTruthy()
  })

  it('respeta los límites 0.1 y 30 inclusive', () => {
    expect(validarDescuento({ ...VALIDO, porcentaje: '0.1' }, []).porcentaje).toBeUndefined()
    expect(validarDescuento({ ...VALIDO, porcentaje: '30' }, []).porcentaje).toBeUndefined()
    expect(validarDescuento({ ...VALIDO, porcentaje: '0.05' }, []).porcentaje).toBeTruthy()
    expect(validarDescuento({ ...VALIDO, porcentaje: '30.01' }, []).porcentaje).toBeTruthy()
  })

  it('admite hasta dos decimales y no más', () => {
    expect(validarDescuento({ ...VALIDO, porcentaje: '12.75' }, []).porcentaje).toBeUndefined()
    expect(validarDescuento({ ...VALIDO, porcentaje: '12.755' }, []).porcentaje).toBeTruthy()
  })

  it('rechaza negativos y texto', () => {
    expect(validarDescuento({ ...VALIDO, porcentaje: '-5' }, []).porcentaje).toBeTruthy()
    expect(validarDescuento({ ...VALIDO, porcentaje: 'mucho' }, []).porcentaje).toBeTruthy()
  })
})

describe('validarDescuento: concepto', () => {
  it('exige elegir concepto', () => {
    expect(validarDescuento({ ...VALIDO, concepto_id: '' }, []).concepto_id).toBeTruthy()
  })

  it('no busca choques sin concepto, para no tapar el error real', () => {
    const errores = validarDescuento({ ...VALIDO, concepto_id: '' }, [descuento({})])
    expect(errores.concepto_id).toBe('Elige el concepto de cobro al que se aplica.')
  })
})

describe('validarDescuento: un solo activo por concepto', () => {
  it('detecta otro descuento activo sobre el mismo concepto', () => {
    const errores = validarDescuento(VALIDO, [descuento({ id: 'otro', porcentaje: '20.00' })])
    expect(errores.concepto_id).toMatch(/ya tiene un descuento activo del 20\.00%/)
  })

  it('ignora los inactivos: no compiten con nadie', () => {
    const errores = validarDescuento(VALIDO, [descuento({ id: 'otro', estado: 'inactivo' })])
    expect(errores.concepto_id).toBeUndefined()
  })

  it('no se denuncia a sí mismo al editar', () => {
    expect(validarDescuento(VALIDO, [descuento({ id: 'd-1' })], 'd-1').concepto_id).toBeUndefined()
  })

  it('no confunde conceptos distintos', () => {
    const errores = validarDescuento(VALIDO, [descuento({ id: 'otro', concepto_id: 'con-9' })])
    expect(errores.concepto_id).toBeUndefined()
  })

  it('no bloquea editar uno que está dado de baja', () => {
    const otroActivo = descuento({ id: 'otro' })
    const errores = validarDescuento(VALIDO, [otroActivo], 'd-1', 'inactivo')
    expect(errores.concepto_id).toBeUndefined()
  })
})

describe('buscarActivoDelConcepto', () => {
  it('devuelve el activo del concepto', () => {
    expect(buscarActivoDelConcepto([descuento({})], 'con-1')?.id).toBe('d-1')
  })

  it('devuelve undefined si solo hay inactivos', () => {
    expect(buscarActivoDelConcepto([descuento({ estado: 'inactivo' })], 'con-1')).toBeUndefined()
  })

  it('puede excluir uno concreto', () => {
    expect(buscarActivoDelConcepto([descuento({})], 'con-1', 'd-1')).toBeUndefined()
  })
})

describe('etiquetaConcepto', () => {
  const concepto: ConceptoCobroBackend = {
    id: 'con-1',
    tipo: 'matricula',
    monto: '350.00',
    descripcion: null,
    modalidad: null,
    enlace_pago: null,
    estado: 'activo',
    programa_id: 'prog-1',
    combo_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  }

  it('pone el destino primero y traduce el tipo', () => {
    expect(etiquetaConcepto(concepto, 'Enfermería Técnica')).toBe(
      'Enfermería Técnica · Matrícula · S/ 350.00',
    )
  })

  it('avisa cuando no se pudo resolver el destino', () => {
    expect(etiquetaConcepto(concepto)).toMatch(/^Sin destino/)
  })
})

describe('montoConDescuento', () => {
  it('aplica el porcentaje', () => {
    expect(montoConDescuento('350.00', '10')).toBe('S/ 315.00')
  })

  it('redondea a dos decimales', () => {
    expect(montoConDescuento('333.33', '15')).toBe('S/ 283.33')
  })

  it('devuelve el monto tal cual si algo no es número', () => {
    expect(montoConDescuento('350.00', 'x')).toBe('S/ 350.00')
  })
})
