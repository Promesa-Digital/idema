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

export const passwordSchema = z
  .object({
    passwordActual: z.string().min(1, 'Ingresa tu contraseña actual.'),
    passwordNueva: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.')
      .regex(/\d/, 'La contraseña debe incluir al menos un número.')
      .regex(/[^a-zA-Z0-9]/, 'La contraseña debe incluir al menos un símbolo.'),
    passwordConfirmar: z.string(),
  })
  .refine((values) => values.passwordNueva === values.passwordConfirmar, {
    message: 'Las contraseñas no coinciden.',
    path: ['passwordConfirmar'],
  })

export type PasswordValues = z.infer<typeof passwordSchema>