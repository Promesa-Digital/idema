import { z } from 'zod'

export const conceptoCobroTipos = ['matricula', 'mensualidad', 'certificado', 'otro'] as const

export const conceptoCobroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres.')
    .max(150, 'El nombre es demasiado largo.'),
  monto: z.coerce
    .number({ message: 'Ingresa un monto válido.' })
    .positive('El monto debe ser mayor a 0.'),
  tipo: z.enum(conceptoCobroTipos, { message: 'Selecciona un tipo.' }),
})

export type ConceptoCobroFormValues = z.infer<typeof conceptoCobroSchema>
