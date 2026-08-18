import { z } from 'zod'

const CODIGO_REGEX = /^[A-Z0-9]+(-[A-Z0-9]+)*$/

export const programaCategorias = ['carrera', 'auxiliar', 'especializacion', 'curso'] as const

const codigoField = z
  .string()
  .trim()
  .min(1, 'El código es obligatorio.')
  .transform((value) => value.toUpperCase())
  .pipe(z.string().regex(CODIGO_REGEX, 'Usa solo letras, números y guiones, en mayúsculas (ej. CAR-001).'))

const programaBaseSchema = z.object({
  nombre: z.string().trim().min(3, 'El nombre debe tener al menos 3 caracteres.').max(150, 'El nombre es demasiado largo.'),
  categoria: z.enum(programaCategorias, { message: 'Selecciona una categoría.' }),
  modalidad: z.string().trim().min(1, 'La modalidad es obligatoria.').max(100, 'La modalidad es demasiado larga.'),
  duracion: z.string().trim().min(1, 'La duración es obligatoria.').max(100, 'La duración es demasiado larga.'),
  descripcion: z
    .string()
    .trim()
    .min(20, 'La descripción debe tener al menos 20 caracteres.')
    .max(2000, 'La descripción es demasiado larga.'),
})

/** El código solo se define al crear el programa; en edición es de solo lectura y no forma parte del payload. */
export const createProgramaSchema = programaBaseSchema.extend({ codigo: codigoField })
export const updateProgramaSchema = programaBaseSchema

export type CreateProgramaValues = z.infer<typeof createProgramaSchema>
export type UpdateProgramaValues = z.infer<typeof updateProgramaSchema>
