import { useState } from 'react'
import FieldError from '../ui/FieldError'
import { popupSchema, popupFrequencies } from '../../schemas/popup'
import type { PopupFormValues } from '../../schemas/popup'
import { POPUP_FREQUENCY_LABELS } from '../../types/admin'

interface PopupFormFields {
  image: string
  alt: string
  startDate: string
  endDate: string
  frequency: string
  pages: string
  ctaLabel: string
  ctaHref: string
  ctaExternal: boolean
}

const emptyFields: PopupFormFields = {
  image: '',
  alt: '',
  startDate: '',
  endDate: '',
  frequency: 'session',
  pages: '',
  ctaLabel: '',
  ctaHref: '',
  ctaExternal: false,
}

interface PopupFormProps {
  initialValues?: Partial<PopupFormFields>
  onSubmit: (values: PopupFormValues) => Promise<void>
  submitLabel: string
  submitError?: string | null
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 disabled:cursor-not-allowed ${hasError ? 'ring-2 ring-rose-400' : ''}`

export default function PopupForm({ initialValues, onSubmit, submitLabel, submitError }: PopupFormProps) {
  const [formData, setFormData] = useState<PopupFormFields>({ ...emptyFields, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const nextValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setFormData((prev) => ({ ...prev, [name]: nextValue }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = popupSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(result.data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {submitError && (
        <div className="bg-rose-500/15 border border-rose-400/40 text-rose-50 px-4 py-3 rounded-lg text-sm" role="alert">
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="popup-image" className="block text-white text-sm font-semibold mb-2">Imagen</label>
        <input
          id="popup-image"
          type="text"
          name="image"
          value={formData.image}
          onChange={handleChange}
          placeholder="/assets/img/anuncios/promo.webp"
          disabled={isSubmitting}
          aria-invalid={!!errors.image}
          aria-describedby={errors.image ? 'popup-err-image' : undefined}
          className={inputClass(!!errors.image)}
        />
        <FieldError id="popup-err-image" message={errors.image} />
      </div>

      <div>
        <label htmlFor="popup-alt" className="block text-white text-sm font-semibold mb-2">Texto alternativo</label>
        <input
          id="popup-alt"
          type="text"
          name="alt"
          value={formData.alt}
          onChange={handleChange}
          placeholder="Ej. Promoción de matrícula 2026"
          disabled={isSubmitting}
          aria-invalid={!!errors.alt}
          aria-describedby={errors.alt ? 'popup-err-alt' : undefined}
          className={inputClass(!!errors.alt)}
        />
        <FieldError id="popup-err-alt" message={errors.alt} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="popup-startDate" className="block text-white text-sm font-semibold mb-2">Fecha de inicio</label>
          <input
            id="popup-startDate"
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={!!errors.startDate}
            aria-describedby={errors.startDate ? 'popup-err-startDate' : undefined}
            className={inputClass(!!errors.startDate)}
          />
          <FieldError id="popup-err-startDate" message={errors.startDate} />
        </div>

        <div>
          <label htmlFor="popup-endDate" className="block text-white text-sm font-semibold mb-2">Fecha de fin</label>
          <input
            id="popup-endDate"
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={!!errors.endDate}
            aria-describedby={errors.endDate ? 'popup-err-endDate' : undefined}
            className={inputClass(!!errors.endDate)}
          />
          <FieldError id="popup-err-endDate" message={errors.endDate} />
        </div>
      </div>

      <div>
        <label htmlFor="popup-frequency" className="block text-white text-sm font-semibold mb-2">Frecuencia</label>
        <select
          id="popup-frequency"
          name="frequency"
          value={formData.frequency}
          onChange={handleChange}
          disabled={isSubmitting}
          aria-invalid={!!errors.frequency}
          aria-describedby={errors.frequency ? 'popup-err-frequency' : undefined}
          className={inputClass(!!errors.frequency)}
        >
          {popupFrequencies.map((freq) => (
            <option key={freq} value={freq}>{POPUP_FREQUENCY_LABELS[freq]}</option>
          ))}
        </select>
        <FieldError id="popup-err-frequency" message={errors.frequency} />
      </div>

      <div>
        <label htmlFor="popup-pages" className="block text-white text-sm font-semibold mb-2">Páginas donde aparece</label>
        <input
          id="popup-pages"
          type="text"
          name="pages"
          value={formData.pages}
          onChange={handleChange}
          placeholder="/, /carreras (separadas por coma; vacío = solo inicio)"
          disabled={isSubmitting}
          aria-invalid={!!errors.pages}
          aria-describedby={errors.pages ? 'popup-err-pages' : undefined}
          className={inputClass(!!errors.pages)}
        />
        <FieldError id="popup-err-pages" message={errors.pages} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="popup-ctaLabel" className="block text-white text-sm font-semibold mb-2">Texto del botón (opcional)</label>
          <input
            id="popup-ctaLabel"
            type="text"
            name="ctaLabel"
            value={formData.ctaLabel}
            onChange={handleChange}
            placeholder="Ej. Ver más"
            disabled={isSubmitting}
            aria-invalid={!!errors.ctaLabel}
            aria-describedby={errors.ctaLabel ? 'popup-err-ctaLabel' : undefined}
            className={inputClass(!!errors.ctaLabel)}
          />
          <FieldError id="popup-err-ctaLabel" message={errors.ctaLabel} />
        </div>

        <div>
          <label htmlFor="popup-ctaHref" className="block text-white text-sm font-semibold mb-2">Enlace del botón (opcional)</label>
          <input
            id="popup-ctaHref"
            type="text"
            name="ctaHref"
            value={formData.ctaHref}
            onChange={handleChange}
            placeholder="/carreras o https://..."
            disabled={isSubmitting}
            aria-invalid={!!errors.ctaHref}
            aria-describedby={errors.ctaHref ? 'popup-err-ctaHref' : undefined}
            className={inputClass(!!errors.ctaHref)}
          />
          <FieldError id="popup-err-ctaHref" message={errors.ctaHref} />
        </div>
      </div>

      <label className="flex items-center gap-2.5 text-white/90 text-sm select-none cursor-pointer">
        <input
          type="checkbox"
          name="ctaExternal"
          checked={formData.ctaExternal}
          onChange={handleChange}
          disabled={isSubmitting}
          className="w-4 h-4 rounded accent-cta"
        />
        El enlace del botón abre en una pestaña nueva
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        {isSubmitting ? 'Guardando...' : submitLabel}
      </button>
    </form>
  )
}
