import { useState } from 'react'
import FieldError from '../ui/FieldError'
import { createProgramaSchema, updateProgramaSchema, programaCategorias } from '../../schemas/programa'
import type { CreateProgramaValues, UpdateProgramaValues } from '../../schemas/programa'
import { PROGRAMA_CATEGORIA_LABELS } from '../../types/admin'

interface ProgramaFormFields {
  codigo: string
  nombre: string
  categoria: string
  modalidad: string
  duracion: string
  descripcion: string
}

const emptyFields: ProgramaFormFields = {
  codigo: '',
  nombre: '',
  categoria: '',
  modalidad: '',
  duracion: '',
  descripcion: '',
}

interface ProgramaFormProps {
  mode: 'create' | 'edit'
  initialValues?: Partial<ProgramaFormFields>
  onSubmit: (values: CreateProgramaValues | UpdateProgramaValues) => Promise<void>
  submitLabel: string
  submitError?: string | null
}

const inputClass = (hasError: boolean) =>
  `w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 disabled:cursor-not-allowed ${hasError ? 'ring-2 ring-rose-400' : ''}`

export default function ProgramaForm({ mode, initialValues, onSubmit, submitLabel, submitError }: ProgramaFormProps) {
  const [formData, setFormData] = useState<ProgramaFormFields>({ ...emptyFields, ...initialValues })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const schema = mode === 'create' ? createProgramaSchema : updateProgramaSchema
    const result = schema.safeParse(formData)
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
        <label htmlFor="programa-codigo" className="block text-white text-sm font-semibold mb-2">Código</label>
        <input
          id="programa-codigo"
          type="text"
          name="codigo"
          value={formData.codigo}
          onChange={handleChange}
          placeholder="Ej. CAR-001"
          disabled={mode === 'edit' || isSubmitting}
          aria-invalid={!!errors.codigo}
          aria-describedby={errors.codigo ? 'programa-err-codigo' : undefined}
          className={inputClass(!!errors.codigo)}
        />
        {mode === 'edit' && (
          <p className="mt-1.5 ml-1 text-[11px] text-white/50">El código no se puede modificar después de crear el programa.</p>
        )}
        <FieldError id="programa-err-codigo" message={errors.codigo} />
      </div>

      <div>
        <label htmlFor="programa-nombre" className="block text-white text-sm font-semibold mb-2">Nombre</label>
        <input
          id="programa-nombre"
          type="text"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          placeholder="Ej. Carrera Técnica en Enfermería"
          disabled={isSubmitting}
          aria-invalid={!!errors.nombre}
          aria-describedby={errors.nombre ? 'programa-err-nombre' : undefined}
          className={inputClass(!!errors.nombre)}
        />
        <FieldError id="programa-err-nombre" message={errors.nombre} />
      </div>

      <div>
        <label htmlFor="programa-categoria" className="block text-white text-sm font-semibold mb-2">Categoría</label>
        <select
          id="programa-categoria"
          name="categoria"
          value={formData.categoria}
          onChange={handleChange}
          disabled={isSubmitting}
          aria-invalid={!!errors.categoria}
          aria-describedby={errors.categoria ? 'programa-err-categoria' : undefined}
          className={inputClass(!!errors.categoria)}
        >
          <option value="" disabled>Selecciona una categoría</option>
          {programaCategorias.map((categoria) => (
            <option key={categoria} value={categoria}>{PROGRAMA_CATEGORIA_LABELS[categoria]}</option>
          ))}
        </select>
        <FieldError id="programa-err-categoria" message={errors.categoria} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <label htmlFor="programa-modalidad" className="block text-white text-sm font-semibold mb-2">Modalidad</label>
          <input
            id="programa-modalidad"
            type="text"
            name="modalidad"
            value={formData.modalidad}
            onChange={handleChange}
            placeholder="Ej. Virtual"
            disabled={isSubmitting}
            aria-invalid={!!errors.modalidad}
            aria-describedby={errors.modalidad ? 'programa-err-modalidad' : undefined}
            className={inputClass(!!errors.modalidad)}
          />
          <FieldError id="programa-err-modalidad" message={errors.modalidad} />
        </div>

        <div>
          <label htmlFor="programa-duracion" className="block text-white text-sm font-semibold mb-2">Duración</label>
          <input
            id="programa-duracion"
            type="text"
            name="duracion"
            value={formData.duracion}
            onChange={handleChange}
            placeholder="Ej. 10 meses"
            disabled={isSubmitting}
            aria-invalid={!!errors.duracion}
            aria-describedby={errors.duracion ? 'programa-err-duracion' : undefined}
            className={inputClass(!!errors.duracion)}
          />
          <FieldError id="programa-err-duracion" message={errors.duracion} />
        </div>
      </div>

      <div>
        <label htmlFor="programa-descripcion" className="block text-white text-sm font-semibold mb-2">Descripción</label>
        <textarea
          id="programa-descripcion"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          placeholder="Describe brevemente el programa"
          rows={5}
          disabled={isSubmitting}
          aria-invalid={!!errors.descripcion}
          aria-describedby={errors.descripcion ? 'programa-err-descripcion' : undefined}
          className={inputClass(!!errors.descripcion)}
        />
        <FieldError id="programa-err-descripcion" message={errors.descripcion} />
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
