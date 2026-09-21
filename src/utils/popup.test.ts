import { describe, expect, it } from 'vitest'
import type { DatosPopup } from './popup'
import { destinoValido, formatFecha, validarPopup, vigenciaPopup } from './popup'

const ANUNCIO: DatosPopup = {
  tipo: 'anuncio',
  texto: 'Matrículas abiertas 2026',
  imagen_url: '/assets/img/popups/matriculas.webp',
  video_url: '',
  enlace: '',
  concepto_cobro_id: '',
  texto_superior: '',
  fecha_inicio: '2026-03-01',
  fecha_fin: '2026-03-31',
}

const DESCUENTO: DatosPopup = {
  ...ANUNCIO,
  tipo: 'descuento',
  concepto_cobro_id: 'con-1',
  texto_superior: '30% de descuento',
}

describe('validarPopup: campos obligatorios', () => {
  it('acepta un anuncio bien lleno', () => {
    expect(validarPopup(ANUNCIO)).toEqual({})
  })

  it('acepta un descuento bien lleno', () => {
    expect(validarPopup(DESCUENTO)).toEqual({})
  })

  it('exige texto e imagen', () => {
    const errores = validarPopup({ ...ANUNCIO, texto: '   ', imagen_url: '' })
    expect(errores.texto).toBeTruthy()
    expect(errores.imagen_url).toBeTruthy()
  })

  it('exige ambas fechas', () => {
    const errores = validarPopup({ ...ANUNCIO, fecha_inicio: '', fecha_fin: '' })
    expect(errores.fecha_inicio).toBeTruthy()
    expect(errores.fecha_fin).toBeTruthy()
  })
})

describe('validarPopup: vigencia al revés', () => {
  it('rechaza que el fin sea anterior al inicio', () => {
    const errores = validarPopup({ ...ANUNCIO, fecha_inicio: '2026-03-31', fecha_fin: '2026-03-01' })
    expect(errores.fecha_fin).toMatch(/anterior a la de inicio/)
  })

  it('acepta que empiece y acabe el mismo día', () => {
    const errores = validarPopup({ ...ANUNCIO, fecha_inicio: '2026-03-10', fecha_fin: '2026-03-10' })
    expect(errores.fecha_fin).toBeUndefined()
  })
})

describe('validarPopup: campos propios del descuento', () => {
  it('exige concepto de cobro y texto superior', () => {
    const errores = validarPopup({ ...DESCUENTO, concepto_cobro_id: '', texto_superior: '' })
    expect(errores.concepto_cobro_id).toBeTruthy()
    expect(errores.texto_superior).toBeTruthy()
  })

  it('no los exige en un anuncio', () => {
    const errores = validarPopup(ANUNCIO)
    expect(errores.concepto_cobro_id).toBeUndefined()
    expect(errores.texto_superior).toBeUndefined()
  })
})

describe('validarPopup: enlaces', () => {
  it('deja el enlace vacío, porque es opcional', () => {
    expect(validarPopup(ANUNCIO).enlace).toBeUndefined()
  })

  it('acepta una ruta interna', () => {
    expect(validarPopup({ ...ANUNCIO, enlace: '/programas-de-estudio/enfermeria' }).enlace).toBeUndefined()
  })

  it('acepta una dirección https', () => {
    expect(validarPopup({ ...ANUNCIO, enlace: 'https://idema.edu.pe/x' }).enlace).toBeUndefined()
  })

  it('rechaza un texto que no es dirección ni ruta', () => {
    expect(validarPopup({ ...ANUNCIO, enlace: 'promociones' }).enlace).toBeTruthy()
  })

  it('rechaza javascript: y otros protocolos', () => {
    expect(destinoValido('javascript:alert(1)')).toBe(false)
    expect(destinoValido('data:text/html,x')).toBe(false)
  })

  it('valida el video solo en los anuncios', () => {
    expect(validarPopup({ ...ANUNCIO, video_url: 'youtube' }).video_url).toBeTruthy()
    // En un descuento el campo ni se muestra, así que no debe estorbar.
    expect(validarPopup({ ...DESCUENTO, video_url: 'youtube' }).video_url).toBeUndefined()
  })
})

describe('vigenciaPopup', () => {
  const hoy = new Date(2026, 2, 15) // 15 de marzo de 2026

  it('marca como programado lo que aún no empieza', () => {
    expect(vigenciaPopup('2026-04-01', '2026-04-30', hoy)).toBe('programado')
  })

  it('marca como vigente lo que está dentro del rango', () => {
    expect(vigenciaPopup('2026-03-01', '2026-03-31', hoy)).toBe('vigente')
  })

  it('marca como vencido lo que ya pasó', () => {
    expect(vigenciaPopup('2026-01-01', '2026-02-28', hoy)).toBe('vencido')
  })

  it('incluye los días de borde: hoy es el primero y el último', () => {
    expect(vigenciaPopup('2026-03-15', '2026-03-20', hoy)).toBe('vigente')
    expect(vigenciaPopup('2026-03-01', '2026-03-15', hoy)).toBe('vigente')
  })

  it('tolera las fechas con hora que devuelve la API', () => {
    expect(vigenciaPopup('2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', hoy)).toBe('vigente')
  })
})

describe('formatFecha', () => {
  it('pasa a formato peruano', () => {
    expect(formatFecha('2026-03-09')).toBe('09/03/2026')
  })

  it('recorta la hora si viene', () => {
    expect(formatFecha('2026-03-09T12:30:00Z')).toBe('09/03/2026')
  })

  it('devuelve el original si no reconoce el formato', () => {
    expect(formatFecha('sin fecha')).toBe('sin fecha')
  })
})
