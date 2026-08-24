import { z } from 'zod'

export const programaCategorias = ['carrera', 'auxiliar', 'especializacion', 'curso'] as const

const programaBaseSchema = z.object({
  abreviatura: z.string().trim().min(1).max(50),
  nombre: z.string().trim().min(3).max(255),
  tipo: z.enum(programaCategorias),
  categoria: z.string().trim().min(1).max(100),
  malla: z.string().trim().min(1).max(255),
  descripcion: z.string().trim().optional(),
  anio: z.coerce.number().int().min(1),
  num_lecciones: z.coerce.number().int().min(0),
  certificado: z.boolean(),
  tutor: z.string().trim().optional(),
  publicacion_programada: z.string().optional(),
})

/** El código solo se define al crear el programa; en edición es de solo lectura y no forma parte del payload. */
export const createProgramaSchema = programaBaseSchema.extend({ codigo: z.string().trim().min(1).max(10).transform((value) => value.toUpperCase()) })
export const updateProgramaSchema = programaBaseSchema

export type CreateProgramaValues = z.infer<typeof createProgramaSchema>
export type UpdateProgramaValues = z.infer<typeof updateProgramaSchema>
