import { describe, expect, it } from 'vitest'
import { estadoVigencia, formatFecha } from './vigencia'

describe('estadoVigencia', () => {
  const hoy = new Date(2026, 2, 15) // 15 de marzo de 2026

  it('marca como programado lo que aún no empieza', () => {
    expect(estadoVigencia('2026-04-01', '2026-04-30', hoy)).toBe('programado')
  })

  it('marca como vigente lo que está dentro del rango', () => {
    expect(estadoVigencia('2026-03-01', '2026-03-31', hoy)).toBe('vigente')
  })

  it('marca como vencido lo que ya pasó', () => {
    expect(estadoVigencia('2026-01-01', '2026-02-28', hoy)).toBe('vencido')
  })

  it('incluye los días de borde: hoy es el primero y el último', () => {
    expect(estadoVigencia('2026-03-15', '2026-03-20', hoy)).toBe('vigente')
    expect(estadoVigencia('2026-03-01', '2026-03-15', hoy)).toBe('vigente')
  })

  it('tolera las fechas con hora que devuelve la API', () => {
    expect(estadoVigencia('2026-03-01T00:00:00Z', '2026-03-31T00:00:00Z', hoy)).toBe('vigente')
  })

  it('un rango de un solo día es vigente ese día', () => {
    expect(estadoVigencia('2026-03-15', '2026-03-15', hoy)).toBe('vigente')
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
