import { z } from 'zod'

export const yapeSchema = z.object({
  celular: z
    .string()
    .trim()
    .refine((v) => /^9\d{8}$/.test(v), 'Ingresa un número de celular válido (9 dígitos, empieza con 9).'),
})

export type YapeValues = z.infer<typeof yapeSchema>

const MAX_VOUCHER_SIZE = 5 * 1024 * 1024
const VOUCHER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export const transferenciaSchema = z.object({
  voucher: z
    .instanceof(File, { message: 'Adjunta el comprobante de transferencia.' })
    .refine((f) => VOUCHER_TYPES.includes(f.type), 'El comprobante debe ser una imagen (JPG, PNG, WEBP) o PDF.')
    .refine((f) => f.size <= MAX_VOUCHER_SIZE, 'El archivo no debe superar los 5 MB.'),
})

export type TransferenciaValues = z.infer<typeof transferenciaSchema>
