import { z } from 'zod'

export const popupFrequencies = ['session', 'day', 'always'] as const

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const IMAGE_PATH_REGEX = /^(https?:\/\/|\/)\S+$/

const toOptional = (value: string) => {
  const trimmed = value.trim()
  return trimmed === '' ? undefined : trimmed
}

const optionalDateField = z
  .string()
  .transform(toOptional)
  .refine((value) => value === undefined || DATE_REGEX.test(value), 'Usa el formato AAAA-MM-DD.')

const optionalTextField = (max: number) =>
  z.string().max(max, 'El texto es demasiado largo.').transform(toOptional)

export const popupSchema = z
  .object({
    image: z
      .string()
      .trim()
      .min(1, 'La imagen es obligatoria.')
      .regex(IMAGE_PATH_REGEX, 'Usa una URL (https://...) o una ruta que empiece con "/".'),
    alt: z
      .string()
      .trim()
      .min(3, 'El texto alternativo debe tener al menos 3 caracteres.')
      .max(200, 'El texto alternativo es demasiado largo.'),
    startDate: optionalDateField,
    endDate: optionalDateField,
    frequency: z.enum(popupFrequencies, { message: 'Selecciona una frecuencia.' }),
    pages: z.string().transform((value) =>
      value
        .split(',')
        .map((page) => page.trim())
        .filter(Boolean),
    ),
    ctaLabel: optionalTextField(60),
    ctaHref: optionalTextField(500),
    ctaExternal: z.boolean(),
  })
  .refine((data) => !data.startDate || !data.endDate || data.startDate <= data.endDate, {
    message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
    path: ['endDate'],
  })
  .refine((data) => Boolean(data.ctaLabel) === Boolean(data.ctaHref), {
    message: 'Completa tanto el texto como el enlace del botón, o deja ambos vacíos.',
    path: ['ctaHref'],
  })

export type PopupFormValues = z.infer<typeof popupSchema>
