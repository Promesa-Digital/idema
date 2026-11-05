import { describe, expect, it } from 'vitest'
import { generarSlug } from './slug'

describe('generarSlug', () => {
  it('quita las tildes, que es lo que romperia la URL', () => {
    expect(generarSlug('Enfermería Técnica')).toBe('enfermeria-tecnica')
  })

  it('conserva la eñe como n, sin dejarla escapar al slug', () => {
    expect(generarSlug('Diseño de Interiores')).toBe('diseno-de-interiores')
  })

  it('colapsa espacios y signos en un solo guion', () => {
    expect(generarSlug('Contabilidad  &  Finanzas')).toBe('contabilidad-finanzas')
  })

  it('no deja guiones sueltos al principio ni al final', () => {
    expect(generarSlug('  ¡Marketing Digital!  ')).toBe('marketing-digital')
  })

  it('devuelve cadena vacia si el nombre aun no se ha escrito', () => {
    expect(generarSlug('')).toBe('')
  })

  it('es idempotente: aplicarlo a un slug ya generado no lo cambia', () => {
    const slug = generarSlug('Auxiliar en Farmacia')
    expect(generarSlug(slug)).toBe(slug)
  })
})
