import { z } from 'zod'

export const popupTipos = ['imagen', 'video', 'texto'] as const

export const popupSchema = z.object({
  tipo: z.enum(popupTipos),
  texto: z.string().trim().min(1, 'El texto es obligatorio.'),
  imagen_url: z.string().trim().min(1, 'La imagen es obligatoria.'),
  video_url: z.string().trim().optional(),
  enlace: z.string().trim().optional(),
  paginas: z.string().trim().min(1, 'Las páginas son obligatorias.'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es obligatoria.'),
  fecha_fin: z.string().min(1, 'La fecha de fin es obligatoria.'),
}).refine((data) => data.fecha_inicio <= data.fecha_fin, {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
  path: ['fecha_fin'],
})

export type PopupFormValues = z.infer<typeof popupSchema>
