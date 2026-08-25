import { z } from 'zod'

export const tarjetaSchema = z.object({
  cardNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\s+/g, ''))
    .refine((v) => /^\d{16}$/.test(v), 'El número de tarjeta debe tener 16 dígitos.'),
  expiracion: z
    .string()
    .trim()
    .refine((v) => /^\d{2}\/\d{2}$/.test(v), 'Usa el formato MM/AA.')
    .refine((v) => {
      const mes = Number(v.split('/')[0])
      return mes >= 1 && mes <= 12
    }, 'El mes debe estar entre 01 y 12.'),
  cvv: z
    .string()
    .trim()
    .refine((v) => /^\d{3}$/.test(v), 'El CVV debe tener 3 dígitos.'),
  titular: z.string().trim().min(3, 'Ingresa el nombre del titular.'),
})

export type TarjetaValues = z.infer<typeof tarjetaSchema>

export const yapeSchema = z.object({
  celular: z
    .string()
    .trim()
    .refine((v) => /^9\d{8}$/.test(v), 'El celular debe tener 9 dígitos y empezar con 9.'),
  otp: z
    .string()
    .trim()
    .refine((v) => /^\d{6}$/.test(v), 'El código OTP debe tener 6 dígitos.'),
})

export type YapeValues = z.infer<typeof yapeSchema>

export const YAPE_LIMITE_SOLES = 2000
