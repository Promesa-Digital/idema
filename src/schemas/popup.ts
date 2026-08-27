import { z } from 'zod'

export const popupTipos = ['anuncio', 'descuento'] as const

export const popupSchema = z.object({
  tipo: z.enum(popupTipos),
  texto: z.string().trim().min(1, 'El texto es obligatorio.'),
  imagen_url: z.string().trim().min(1, 'La imagen es obligatoria.'),
  video_url: z.string().trim().optional(),
  enlace: z.string().trim().optional(),
  paginas: z.string().trim().min(1, 'Las páginas son obligatorias.'),
  fecha_inicio: z.string().min(1, 'La fecha de inicio es obligatoria.'),
  fecha_fin: z.string().min(1, 'La fecha de fin es obligatoria.'),
  // Solo aplican a tipo "descuento" (EDU-02); se validan como obligatorios más abajo.
  monto_descuento: z.string().trim().optional(),
  duracion_temporizador: z.string().trim().optional(),
  texto_superior: z.string().trim().optional(),
}).refine((data) => data.fecha_inicio <= data.fecha_fin, {
  message: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
  path: ['fecha_fin'],
}).superRefine((data, ctx) => {
  if (data.tipo !== 'descuento') return

  if (!data.monto_descuento || Number.isNaN(Number(data.monto_descuento)) || Number(data.monto_descuento) <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El monto del descuento es obligatorio.', path: ['monto_descuento'] })
  }
  if (!data.duracion_temporizador || Number.isNaN(Number(data.duracion_temporizador)) || Number(data.duracion_temporizador) <= 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'La duración del temporizador es obligatoria.', path: ['duracion_temporizador'] })
  }
  if (!data.texto_superior) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El texto superior es obligatorio.', path: ['texto_superior'] })
  }
})

export type PopupFormValues = z.infer<typeof popupSchema>
