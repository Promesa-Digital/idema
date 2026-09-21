import { describe, expect, it } from 'vitest'
import type {
  ComboBackend,
  ConceptoCobroBackend,
  DescuentoBackend,
  PopupBackend,
} from '@/types/backend'
import { detectarAvisos } from './avisos'

const HOY = new Date(2026, 2, 15) // 15 de marzo de 2026

function concepto(parcial: Partial<ConceptoCobroBackend>): ConceptoCobroBackend {
  return {
    id: 'con-1',
    tipo: 'matricula',
    monto: '350.00',
    descripcion: null,
    modalidad: null,
    enlace_pago: 'https://culqi.com/x',
    estado: 'activo',
    programa_id: 'prog-1',
    combo_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...parcial,
  }
}

function combo(parcial: Partial<ComboBackend>): ComboBackend {
  return {
    id: 'com-1',
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

function popup(parcial: Partial<PopupBackend>): PopupBackend {
  return {
    id: 'pop-1',
    tipo: 'anuncio',
    texto: 'Matrículas abiertas',
    imagen_url: '/x.webp',
    video_url: null,
    enlace: null,
    paginas: '/',
    concepto_cobro_id: null,
    duracion_temporizador: null,
    texto_superior: null,
    fecha_inicio: '2026-03-01',
    fecha_fin: '2026-03-31',
    estado: 'publicado',
    creado_por: 'u-1',
    aprobado_por: null,
    publicado_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...parcial,
  }
}

function descuento(parcial: Partial<DescuentoBackend>): DescuentoBackend {
  return {
    id: 'des-1',
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

describe('detectarAvisos: nada que avisar', () => {
  it('no inventa avisos sin datos', () => {
    expect(detectarAvisos({}, HOY)).toEqual([])
  })

  it('calla cuando todo está bien configurado', () => {
    const avisos = detectarAvisos(
      {
        conceptos: [concepto({})],
        combos: [combo({})],
        popups: [popup({})],
        descuentos: [descuento({})],
      },
      HOY,
    )
    expect(avisos).toEqual([])
  })
})

describe('detectarAvisos: combos sin precio', () => {
  it('avisa del combo activo sin concepto de cobro', () => {
    const avisos = detectarAvisos({ combos: [combo({ monto: null })] }, HOY)
    expect(avisos[0].id).toBe('combos-sin-precio')
    expect(avisos[0].cantidad).toBe(1)
  })

  it('ignora los combos inactivos: no se ofrecen a nadie', () => {
    const avisos = detectarAvisos(
      { combos: [combo({ monto: null, estado: 'inactivo' })] },
      HOY,
    )
    expect(avisos).toEqual([])
  })
})

describe('detectarAvisos: conceptos sin enlace', () => {
  it('avisa del concepto de pago sin enlace', () => {
    const avisos = detectarAvisos({ conceptos: [concepto({ enlace_pago: null })] }, HOY)
    expect(avisos[0].id).toBe('conceptos-sin-enlace')
  })

  it('no avisa de los gratuitos, que no se cobran', () => {
    const avisos = detectarAvisos(
      { conceptos: [concepto({ tipo: 'gratuito', monto: '0.00', enlace_pago: null })] },
      HOY,
    )
    expect(avisos).toEqual([])
  })

  it('no avisa de los inactivos', () => {
    const avisos = detectarAvisos(
      { conceptos: [concepto({ enlace_pago: null, estado: 'inactivo' })] },
      HOY,
    )
    expect(avisos).toEqual([])
  })
})

describe('detectarAvisos: descuentos en conflicto', () => {
  it('avisa cuando un concepto tiene dos descuentos activos', () => {
    const avisos = detectarAvisos(
      { descuentos: [descuento({ id: 'a' }), descuento({ id: 'b' })] },
      HOY,
    )
    expect(avisos[0].id).toBe('descuentos-en-conflicto')
    expect(avisos[0].cantidad).toBe(1)
  })

  it('cuenta conceptos en conflicto, no descuentos sobrantes', () => {
    const avisos = detectarAvisos(
      {
        descuentos: [
          descuento({ id: 'a' }),
          descuento({ id: 'b' }),
          descuento({ id: 'c' }),
          descuento({ id: 'd', concepto_id: 'con-2' }),
          descuento({ id: 'e', concepto_id: 'con-2' }),
        ],
      },
      HOY,
    )
    expect(avisos[0].cantidad).toBe(2)
  })

  it('un inactivo no entra en el conflicto', () => {
    const avisos = detectarAvisos(
      { descuentos: [descuento({ id: 'a' }), descuento({ id: 'b', estado: 'inactivo' })] },
      HOY,
    )
    expect(avisos).toEqual([])
  })
})

describe('detectarAvisos: fuera de fecha', () => {
  it('avisa del popup publicado que ya venció', () => {
    const avisos = detectarAvisos(
      { popups: [popup({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' })] },
      HOY,
    )
    expect(avisos[0].id).toBe('popups-vencidos')
  })

  it('no avisa del que todavía no ha empezado: eso es estar programado', () => {
    const avisos = detectarAvisos(
      { popups: [popup({ fecha_inicio: '2026-06-01', fecha_fin: '2026-06-30' })] },
      HOY,
    )
    expect(avisos).toEqual([])
  })

  it('no avisa de un popup vencido que ya se finalizó', () => {
    const avisos = detectarAvisos(
      {
        popups: [
          popup({ estado: 'finalizado', fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' }),
        ],
      },
      HOY,
    )
    expect(avisos).toEqual([])
  })

  it('avisa del combo activo vencido', () => {
    const avisos = detectarAvisos(
      { combos: [combo({ vigencia_inicio: '2025-01-01', vigencia_fin: '2025-12-31' })] },
      HOY,
    )
    expect(avisos[0].id).toBe('combos-vencidos')
  })
})

describe('detectarAvisos: orden', () => {
  it('pone primero lo que impide cobrar y al final lo que solo deja de verse', () => {
    const avisos = detectarAvisos(
      {
        combos: [combo({ monto: null })],
        conceptos: [concepto({ enlace_pago: null })],
        descuentos: [descuento({ id: 'a' }), descuento({ id: 'b' })],
        popups: [popup({ fecha_inicio: '2026-01-01', fecha_fin: '2026-02-01' })],
      },
      HOY,
    )
    expect(avisos.map((aviso) => aviso.id)).toEqual([
      'combos-sin-precio',
      'conceptos-sin-enlace',
      'descuentos-en-conflicto',
      'popups-vencidos',
    ])
  })

  it('cada aviso apunta al módulo donde se arregla', () => {
    const avisos = detectarAvisos({ combos: [combo({ monto: null })] }, HOY)
    expect(avisos[0].ruta).toBe('/admin/combos')
  })
})
