import { describe, expect, it } from 'vitest'
import { aCuerpoLead, submitLead } from './leadIntake'

const BASE = {
  firstName: 'Rosa María',
  lastName: 'Quispe',
  phone: '987654321',
  email: 'rosa@example.com',
  form: 2 as const,
}

describe('aCuerpoLead', () => {
  it('une nombre y apellido, porque el backend guarda un solo campo', () => {
    expect(aCuerpoLead(BASE).nombre).toBe('Rosa María Quispe')
  })

  it('no deja espacios sueltos si falta el apellido', () => {
    expect(aCuerpoLead({ ...BASE, lastName: '' }).nombre).toBe('Rosa María')
  })

  it('traduce los nombres de campo a los del backend', () => {
    const cuerpo = aCuerpoLead(BASE)
    expect(cuerpo.correo).toBe('rosa@example.com')
    expect(cuerpo.telefono).toBe('987654321')
    expect(cuerpo.origen).toBe('formulario')
  })

  it('incluye el mensaje solo si lo hay: el backend rechaza campos vacíos de más', () => {
    expect(aCuerpoLead(BASE).mensaje).toBeUndefined()
    expect(aCuerpoLead({ ...BASE, message: 'Quiero informes' }).mensaje).toBe('Quiero informes')
  })

  it('manda el consentimiento que marcó el visitante', () => {
    expect(aCuerpoLead({ ...BASE, consent: true }).consentimiento).toBe(true)
    expect(aCuerpoLead({ ...BASE, consent: false }).consentimiento).toBe(false)
  })

  it('no inventa campos que el backend no acepta', () => {
    // LeadCreate declara extra='forbid': una clave de más devuelve 422.
    expect(Object.keys(aCuerpoLead({ ...BASE, message: 'hola' })).sort()).toEqual([
      'consentimiento',
      'correo',
      'mensaje',
      'nombre',
      'origen',
      'telefono',
    ])
  })
})

describe('submitLead: validación antes de salir a la red', () => {
  it('rechaza un teléfono que no tiene 9 dígitos', async () => {
    const r = await submitLead({ ...BASE, phone: '12345' })
    expect(r.ok).toBe(false)
    expect(r.error).toMatch(/9 dígitos/)
  })

  it('se queda con los últimos 9 dígitos y descarta el formato', async () => {
    // "+51 987 654 321" es el mismo teléfono que "987654321".
    expect(aCuerpoLead(normalizarParaPrueba('+51 987 654 321')).telefono).toBe('987654321')
  })

  it('no envía nada sin consentimiento, en vez de que lo rechace el servidor', async () => {
    const r = await submitLead({ ...BASE, consent: false })
    expect(r.status).toBe(400)
    expect(r.error).toMatch(/política de privacidad/)
  })
})

/** Pasa un teléfono por la misma normalización que aplica submitLead. */
function normalizarParaPrueba(phone: string) {
  return { ...BASE, phone: phone.replace(/\D/g, '').slice(-9) }
}
