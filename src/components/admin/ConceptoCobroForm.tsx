import { useState } from 'react'
import FieldError from '../ui/FieldError'
import { conceptoCobroSchema, conceptoCobroTipos } from '../../schemas/conceptoCobro'
import type { ConceptoCobroFormValues } from '../../schemas/conceptoCobro'
import { CONCEPTO_COBRO_TIPO_LABELS } from '../../types/admin'

interface ConceptoCobroFormFields {
  nombre: string
  monto: string
  tipo: string
}

const emptyFields: ConceptoCobroFormFields = {
  nombre: '',
  monto: '',
  tipo: 'matricula',
}

interface ConceptoCobroFormProps {
  initialValues?: Partial<ConceptoCobroFormFields>
  onSubmit: (values: ConceptoCobroFormValues) => Promise<void>
  submitLabel: string
  submitError?: string | null
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 disabled:cursor-not-allowed ${hasError ? 'ring-2 ring-rose-400' : ''}`

export default function ConceptoCobroForm({ initialValues, onSubmit, submitLabel, submitError }: ConceptoCobroFormProps) {
  const [formData, setFormData] = useState<ConceptoCobroFormFields>({ ...emptyFields, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

    const result = conceptoCobroSchema.safeParse(formData)
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
        <label htmlFor="concepto-nombre" className="block text-white text-sm font-semibold mb-2">Nombre</label>
        <input
          id="concepto-nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej. Matrícula 2026-II"
          disabled={isSubmitting}
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? 'concepto-err-nombre' : undefined}
          className={inputClass(!!errors.nombre)}
        />
        <FieldError id="concepto-err-nombre" message={errors.nombre} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="concepto-monto" className="block text-white text-sm font-semibold mb-2">Monto (S/.)</label>
          <input
            id="concepto-monto"
            type="number"
            step="0.01"
            min="0"
            name="monto"
            value={formData.monto}
            onChange={handleChange}
            placeholder="350.00"
            disabled={isSubmitting}
            aria-invalid={!!errors.monto}
            aria-describedby={errors.monto ? 'concepto-err-monto' : undefined}
            className={inputClass(!!errors.monto)}
          />
          <FieldError id="concepto-err-monto" message={errors.monto} />
        </div>

        <div>
          <label htmlFor="concepto-tipo" className="block text-white text-sm font-semibold mb-2">Tipo</label>
          <select
            id="concepto-tipo"
            name="tipo"
            value={formData.tipo}
            onChange={handleChange}
            disabled={isSubmitting}
            aria-invalid={!!errors.tipo}
            aria-describedby={errors.tipo ? 'concepto-err-tipo' : undefined}
            className={inputClass(!!errors.tipo)}
          >
            {conceptoCobroTipos.map((tipo) => (
              <option key={tipo} value={tipo}>{CONCEPTO_COBRO_TIPO_LABELS[tipo]}</option>
            ))}
          </select>
          <FieldError id="concepto-err-tipo" message={errors.tipo} />
        </div>
      </div>

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
