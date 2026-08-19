import { z } from 'zod'

export const datosContactoSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'El correo es obligatorio.')
    .email('Ingresa un correo válido.')
    .max(100, 'El correo es demasiado largo.'),
  telefono: z
    .string()
    .trim()
    .refine((v) => v === '' || /^9\d{8}$/.test(v), 'El celular debe tener 9 dígitos y empezar con 9.'),
})

export type DatosContactoValues = z.infer<typeof datosContactoSchema>