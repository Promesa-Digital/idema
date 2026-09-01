import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import FieldError from '../ui/FieldError'
import SuccessCheck from '../ui/SuccessCheck'
import { validateName, validatePhone, validateEmail } from '../../utils/validation'
import { submitCita } from '../../utils/citaIntake'

const MENSAJE_MAX_LENGTH = 300
const DEFAULT_ERROR_MESSAGE = 'Ocurrió un error. Por favor intenta de nuevo o contáctanos directamente por WhatsApp.'

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

interface CitaFormData {
  nombreCompleto: string
  email: string
  telefono: string
  servicioSlug: string
  mensaje: string
  consentimiento: boolean
  website: string // honeypot — nunca lo rellena un usuario real
}

const emptyForm = (servicioSlugInicial: string): CitaFormData => ({
  nombreCompleto: '',
  email: '',
  telefono: '',
  servicioSlug: servicioSlugInicial,
  mensaje: '',
  consentimiento: false,
  website: '',
})

export default function CitaForm({
  servicios,
  defaultServicioSlug,
  title = 'Solicitar cita',
  subtitle = 'Completa el formulario y nos comunicaremos contigo para confirmar tu cita.',
}: Props) {
  const servicioSlugInicial = servicios.length === 1
    ? servicios[0].slug
    : (servicios.find(s => s.slug === defaultServicioSlug)?.slug ?? '')

  const [formData, setFormData] = useState<CitaFormData>(() => emptyForm(servicioSlugInicial))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState(DEFAULT_ERROR_MESSAGE)

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
    if (status !== 'idle') setStatus('idle')
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    const nameResult = validateName(formData.nombreCompleto)
    if (!nameResult.valid) newErrors.nombreCompleto = nameResult.error!

    const emailResult = validateEmail(formData.email)
    if (!emailResult.valid) newErrors.email = emailResult.error!

    const phoneResult = validatePhone(formData.telefono)
    if (!phoneResult.valid) newErrors.telefono = phoneResult.error!

    if (!formData.servicioSlug) newErrors.servicioSlug = 'Selecciona el servicio solicitado.'
    if (!formData.consentimiento) newErrors.consentimiento = 'Debes autorizar el tratamiento de tus datos personales.'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setStatus('idle')

    const servicioTitle = servicios.find(s => s.slug === formData.servicioSlug)?.title ?? ''

    const result = await submitCita({
      nombreCompleto: formData.nombreCompleto,
      email: formData.email,
      telefono: formData.telefono,
      servicioSlug: formData.servicioSlug,
      servicio: servicioTitle,
      mensaje: formData.mensaje,
      consentimiento: formData.consentimiento,
      origen: window.location.hostname,
      website: formData.website,
    })

    if (result.ok) {
      setStatus('success')
      setFormData(emptyForm(servicioSlugInicial))
    } else {
      setStatus('error')
      setErrorMessage(result.error || DEFAULT_ERROR_MESSAGE)
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
        {status === 'success' ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center text-center py-6 sm:py-10"
            role="status"
          >
            <SuccessCheck size={100} />
            <h3 className="mt-6 text-white font-bold text-2xl leading-tight">✓ Tu solicitud fue enviada</h3>
            <p className="mt-3 text-white/85 text-base leading-relaxed max-w-md">
              Nos comunicaremos contigo a la brevedad para confirmar tu cita.
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="mt-8 px-8 py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cta to-accent hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Solicitar otra cita
            </button>
          </motion.div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5" noValidate>
          {/* Honeypot anti-bot: invisible fuera de pantalla, no display:none/hidden
              (los bots simples saltan esos). Oculto también a lectores de pantalla
              y navegación por teclado. */}
          <div className="absolute left-[-9999px] top-auto w-px h-px overflow-hidden" aria-hidden="true">
            <label htmlFor="cita-website">No completar este campo</label>
            <input
              id="cita-website" type="text" name="website" value={formData.website}
              onChange={handleChange} tabIndex={-1} autoComplete="off"
            />
          </div>

          {status === 'error' && (
            <div className="bg-rose-500/15 border border-rose-400/40 text-rose-50 px-4 py-3 rounded-lg text-sm" role="alert">
              {errorMessage}
            </div>
          )}

          {servicios.length > 1 ? (
            <div>
              <label htmlFor="cita-servicio" className="block text-white text-sm font-semibold mb-2">Servicio solicitado</label>
              <select
                id="cita-servicio" name="servicioSlug" value={formData.servicioSlug} onChange={handleChange}
                disabled={isSubmitting} aria-invalid={!!errors.servicioSlug}
                aria-describedby={errors.servicioSlug ? 'cita-err-servicio' : undefined}
                className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.servicioSlug ? 'ring-2 ring-rose-400' : ''}`}
              >
                <option value="" disabled>Selecciona un servicio</option>
                {servicios.map(s => (
                  <option key={s.slug} value={s.slug}>{s.title}</option>
                ))}
              </select>
              <FieldError id="cita-err-servicio" message={errors.servicioSlug} />
            </div>
          ) : (
            <div className="px-4 py-3 rounded-lg bg-white/10 border border-white/15 text-white text-sm">
              <span className="text-white/60">Servicio: </span>
              <span className="font-semibold">{servicios[0]?.title}</span>
            </div>
          )}

          <div>
            <label htmlFor="cita-nombre" className="block text-white text-sm font-semibold mb-2">Nombre completo</label>
            <input
              id="cita-nombre" type="text" name="nombreCompleto" value={formData.nombreCompleto}
              onChange={handleChange} placeholder="Tu nombre completo" autoComplete="name" disabled={isSubmitting}
              aria-invalid={!!errors.nombreCompleto}
              aria-describedby={errors.nombreCompleto ? 'cita-err-nombre' : undefined}
              className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.nombreCompleto ? 'ring-2 ring-rose-400' : ''}`}
            />
            <FieldError id="cita-err-nombre" message={errors.nombreCompleto} />
          </div>

          <div>
            <label htmlFor="cita-email" className="block text-white text-sm font-semibold mb-2">Correo electrónico</label>
            <input
              id="cita-email" type="email" name="email" value={formData.email}
              onChange={handleChange} placeholder="tu@email.com" autoComplete="email" disabled={isSubmitting}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'cita-err-email' : undefined}
              className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.email ? 'ring-2 ring-rose-400' : ''}`}
            />
            <FieldError id="cita-err-email" message={errors.email} />
          </div>

          <div>
            <label htmlFor="cita-telefono" className="block text-white text-sm font-semibold mb-2">Teléfono / WhatsApp</label>
            <input
              id="cita-telefono" type="text" name="telefono" value={formData.telefono}
              onChange={handleChange} placeholder="987 654 321" autoComplete="tel-national" inputMode="numeric"
              maxLength={9} disabled={isSubmitting}
              aria-invalid={!!errors.telefono}
              aria-describedby={errors.telefono ? 'cita-err-telefono' : undefined}
              className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.telefono ? 'ring-2 ring-rose-400' : ''}`}
            />
            <FieldError id="cita-err-telefono" message={errors.telefono} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="cita-mensaje" className="block text-white text-sm font-semibold">
                Motivo o mensaje <span className="text-white/50 font-normal">(opcional)</span>
              </label>
              <span className="text-xs text-white/50">{formData.mensaje.length}/{MENSAJE_MAX_LENGTH}</span>
            </div>
            <textarea
              id="cita-mensaje" name="mensaje" value={formData.mensaje} onChange={handleChange}
              placeholder="Cuéntanos en qué podemos ayudarte..." rows={4} maxLength={MENSAJE_MAX_LENGTH}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition resize-none disabled:opacity-60"
            />
          </div>

          <div>
            <div className="flex items-start gap-2">
              <input
                id="cita-consentimiento" type="checkbox" name="consentimiento" checked={formData.consentimiento}
                onChange={handleChange} disabled={isSubmitting}
                className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary flex-shrink-0"
              />
              <label htmlFor="cita-consentimiento" className="text-white/90 text-sm cursor-pointer select-none">
                Autorizo el tratamiento de mis datos personales para la gestión de mi cita (Ley N.° 29733), de
                acuerdo con nuestra{' '}
                <Link to="/politica-privacidad" className="underline hover:text-white" target="_blank">
                  política de tratamiento de datos y privacidad
                </Link>.
              </label>
            </div>
            <FieldError message={errors.consentimiento} />
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
            {isSubmitting ? 'Enviando...' : 'Solicitar Cita'}
          </motion.button>
        </form>
        )}
      </div>
    </div>
  )
}
