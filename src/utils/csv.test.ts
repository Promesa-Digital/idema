import { describe, expect, it } from 'vitest'
import { construirCSV } from './csv'

describe('construirCSV', () => {
  it('pone el encabezado primero y separa con punto y coma', () => {
    expect(construirCSV(['Codigo', 'Nombre'], [['CAR002', 'Enfermería']])).toBe(
      'Codigo;Nombre\r\nCAR002;Enfermería',
    )
  })

  it('entrecomilla el campo que trae el separador, para que no parta la fila', () => {
    expect(construirCSV(['Nombre'], [['Contabilidad; Finanzas']])).toBe(
      'Nombre\r\n"Contabilidad; Finanzas"',
    )
  })

  it('duplica las comillas internas segun RFC 4180', () => {
    expect(construirCSV(['Nombre'], [['Programa "Estrella"']])).toBe(
      'Nombre\r\n"Programa ""Estrella"""',
    )
  })

  it('entrecomilla los saltos de linea en vez de romper el archivo', () => {
    expect(construirCSV(['Desc'], [['Linea 1\nLinea 2']])).toBe('Desc\r\n"Linea 1\nLinea 2"')
  })

  it('escribe celda vacia cuando el dato es nulo', () => {
    expect(construirCSV(['A', 'B'], [[null, 0]])).toBe('A;B\r\n;0')
  })

  it('devuelve solo el encabezado si no hay filas', () => {
    expect(construirCSV(['A', 'B'], [])).toBe('A;B')
  })
})
