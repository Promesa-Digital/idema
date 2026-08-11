import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import FieldError from '../ui/FieldError'
import SuccessCheck from '../ui/SuccessCheck'
import { countryCodes } from '../../data/navigation'
import { validateNamePart, validatePhone, validateEmail, validateComment } from '../../utils/validation'
import { submitLead } from '../../utils/leadIntake'
import type { ContactFormData } from '../../types'

interface ServicioOption {
  slug: string
  title: string
}

interface Props {
  servicios: ServicioOption[]
  defaultServicioSlug?: string
  title?: string
  subtitle?: string
}

export default function CitaForm({ servicios, defaultServicioSlug, title = 'Solicita tu cita', subtitle = 'Completa el formulario y te contactaremos para coordinar tu atención.' }: Props) {
  const [servicioSeleccionado, setServicioSeleccionado] = useState(
    () => servicios.find(s => s.slug === defaultServicioSlug)?.slug ?? servicios[0]?.slug ?? '',
  )

  useEffect(() => {
    const match = servicios.find(s => s.slug === defaultServicioSlug)
    if (match) setServicioSeleccionado(match.slug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultServicioSlug])

  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    countryCode: '51',
    phone: '',
    email: '',
    comment: '',
    acceptPolicies: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedLead, setSubmittedLead] = useState<{ code?: string } | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const fieldError = (name: string, value: string | boolean): string | undefined => {
    switch (name) {
      case 'firstName':      return validateNamePart(String(value), 'nombre').error
      case 'lastName':       return validateNamePart(String(value), 'apellido').error
      case 'phone':          return validatePhone(String(value)).error
      case 'email':          return validateEmail(String(value)).error
      case 'comment':        return validateComment(String(value)).error
      case 'acceptPolicies': return value ? undefined : 'Acepta la política de privacidad para continuar.'
      default:               return undefined
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const err = fieldError(name, value)
    setErrors(prev => {
      if (!err) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return { ...prev, [name]: err }
    })
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    const fields: Array<[string, string | boolean]> = [
      ['firstName', formData.firstName],
      ['lastName',  formData.lastName],
      ['phone',     formData.phone],
      ['email',     formData.email],
      ['comment',   formData.comment],
      ['acceptPolicies', formData.acceptPolicies],
    ]
    for (const [name, value] of fields) {
      const err = fieldError(name, value)
      if (err) newErrors[name] = err
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsSubmitting(true)
    const servicioLabel = servicios.find(s => s.slug === servicioSeleccionado)?.title ?? ''
    const result = await submitLead({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      form: 2,
      message: `[Bienestar Estudiantil - ${servicioLabel}] ${formData.comment}`,
    })

    if (result.ok) {
      setSubmittedLead({ code: result.leadCode })
      setFormData({ firstName: '', lastName: '', countryCode: '51', phone: '', email: '', comment: '', acceptPolicies: false })
    } else if (result.duplicate) {
      setErrors({ submit: 'Ya estás registrado. Pronto te contactamos.' })
    } else if (result.queued) {
      setErrors({ submit: 'No pudimos contactar al servidor. Guardamos tus datos y reintentaremos.' })
    } else {
      setErrors({ submit: result.error || 'Error al enviar la solicitud. Intenta nuevamente.' })
    }
    setIsSubmitting(false)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">{title}</h2>
        <p className="text-white/80">{subtitle}</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
        {submittedLead ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center py-6 sm:py-10"
          >
            <SuccessCheck size={100} />
            <h3 className="mt-6 text-white font-bold text-2xl leading-tight">¡Solicitud enviada!</h3>
            <p className="mt-3 text-white/85 text-base leading-relaxed max-w-md">
              Nos pondremos en contacto contigo para confirmar el día y la hora de tu cita.
            </p>
            <button
              onClick={() => setSubmittedLead(null)}
              className="mt-8 px-8 py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cta to-accent hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Solicitar otra cita
            </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
            {errors.submit && (
              <div className="bg-cta/15 border border-cta/40 text-white px-4 py-3 rounded-lg text-sm" role="alert">
                {errors.submit}
              </div>
            )}

            {servicios.length > 1 ? (
              <div>
                <label htmlFor="cita-servicio" className="block text-white text-sm font-semibold mb-2">Servicio</label>
                <select
                  id="cita-servicio"
                  value={servicioSeleccionado}
                  onChange={e => setServicioSeleccionado(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60"
                >
                  {servicios.map(s => (
                    <option key={s.slug} value={s.slug}>{s.title}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white text-sm">
                <span className="text-white/60">Servicio: </span>
                <span className="font-semibold">{servicios[0]?.title}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cita-firstName" className="block text-white text-sm font-semibold mb-2">Nombre</label>
                <input
                  id="cita-firstName" type="text" name="firstName" value={formData.firstName}
                  onChange={handleChange} onBlur={handleBlur} placeholder="Tu nombre" autoComplete="given-name"
                  disabled={isSubmitting} aria-invalid={!!errors.firstName}
                  aria-describedby={errors.firstName ? 'cita-err-firstName' : undefined}
                  className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.firstName ? 'ring-2 ring-rose-400' : ''}`}
                />
                <FieldError id="cita-err-firstName" message={errors.firstName} />
              </div>
              <div>
                <label htmlFor="cita-lastName" className="block text-white text-sm font-semibold mb-2">Apellido</label>
                <input
                  id="cita-lastName" type="text" name="lastName" value={formData.lastName}
                  onChange={handleChange} onBlur={handleBlur} placeholder="Tu apellido" autoComplete="family-name"
                  disabled={isSubmitting} aria-invalid={!!errors.lastName}
                  aria-describedby={errors.lastName ? 'cita-err-lastName' : undefined}
                  className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.lastName ? 'ring-2 ring-rose-400' : ''}`}
                />
                <FieldError id="cita-err-lastName" message={errors.lastName} />
              </div>
            </div>

            <div>
              <label htmlFor="cita-phone" className="block text-white text-sm font-semibold mb-2">Teléfono</label>
              <div className="flex gap-2">
                <select
                  name="countryCode" value={formData.countryCode} onChange={handleChange} disabled={isSubmitting}
                  className="px-3 py-3 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60"
                >
                  {countryCodes.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                  ))}
                </select>
                <input
                  id="cita-phone" type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} onBlur={handleBlur} placeholder="987 654 321" autoComplete="tel-national"
                  inputMode="numeric" maxLength={9} disabled={isSubmitting} aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'cita-err-phone' : undefined}
                  className={`flex-1 min-w-0 px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.phone ? 'ring-2 ring-rose-400' : ''}`}
                />
              </div>
              <FieldError id="cita-err-phone" message={errors.phone} />
            </div>

            <div>
              <label htmlFor="cita-email" className="block text-white text-sm font-semibold mb-2">Email</label>
              <input
                id="cita-email" type="email" name="email" value={formData.email}
                onChange={handleChange} onBlur={handleBlur} placeholder="tu@email.com" autoComplete="email"
                disabled={isSubmitting} aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'cita-err-email' : undefined}
                className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.email ? 'ring-2 ring-rose-400' : ''}`}
              />
              <FieldError id="cita-err-email" message={errors.email} />
            </div>

            <div>
              <label htmlFor="cita-comment" className="block text-white text-sm font-semibold mb-2">Mensaje</label>
              <textarea
                id="cita-comment" name="comment" value={formData.comment}
                onChange={handleChange} onBlur={handleBlur} placeholder="Cuéntanos brevemente el motivo de tu cita..."
                rows={4} disabled={isSubmitting} aria-invalid={!!errors.comment}
                aria-describedby={errors.comment ? 'cita-err-comment' : undefined}
                className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition resize-none disabled:opacity-60 ${errors.comment ? 'ring-2 ring-rose-400' : ''}`}
              />
              <FieldError id="cita-err-comment" message={errors.comment} />
            </div>

            <div>
              <div className="flex items-start gap-2">
                <input
                  id="cita-policies" type="checkbox" name="acceptPolicies" checked={formData.acceptPolicies}
                  onChange={handleChange} disabled={isSubmitting}
                  className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary"
                />
                <label htmlFor="cita-policies" className="text-white/90 text-sm cursor-pointer select-none">
                  Acepto la{' '}
                  <a href="/politica-privacidad" className="underline hover:text-white">política de privacidad</a>
                </label>
              </div>
              <FieldError message={errors.acceptPolicies} />
            </div>

            <motion.button
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
              )}
              {isSubmitting ? 'Enviando…' : 'Solicitar Cita'}
            </motion.button>
          </form>
        )}
      </div>
    </div>
  )
}
