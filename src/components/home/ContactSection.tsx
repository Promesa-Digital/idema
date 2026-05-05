import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MdPhone, MdEmail, MdLocationOn } from 'react-icons/md'
import {
  validateNamePart,
  validatePhone,
  validateEmail,
  validateComment,
} from '../../utils/validation'
import { submitLead } from '../../utils/leadIntake'
import SuccessCheck from '../ui/SuccessCheck'
import FieldError from '../ui/FieldError'
import type { ContactFormData } from '../../types'

export default function ContactSection() {
  const { ref, inView } = useInView({ triggerOnce: true })
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

  const resetForm = () => {
    setSubmittedLead(null)
    setErrors({})
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? (e.target as HTMLInputElement).checked
          : value,
    }))
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const fieldError = (name: string, value: string | boolean): string | undefined => {
    switch (name) {
      case 'firstName':      return validateNamePart(String(value), 'nombre').error
      case 'lastName':       return validateNamePart(String(value), 'apellido').error
      case 'phone':          return validatePhone(String(value)).error
      case 'email': {
        const r = validateEmail(String(value))
        if (r.valid) return undefined
        return r.suggestion ? `${r.error} (${r.suggestion})` : r.error
      }
      case 'comment':        return validateComment(String(value)).error
      case 'acceptPolicies': return value ? undefined : 'Acepta la política de privacidad para continuar.'
      default:               return undefined
    }
  }

  const handleBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    const result = await submitLead({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      form: 2,
      message: formData.comment,
    })

    if (result.ok) {
      setSubmittedLead({ code: result.leadCode })
      setFormData({
        firstName: '',
        lastName: '',
        countryCode: '51',
        phone: '',
        email: '',
        comment: '',
        acceptPolicies: false,
      })
    } else if (result.duplicate) {
      setErrors({ submit: 'Ya estás registrado. Pronto te contactamos.' })
    } else if (result.queued) {
      setErrors({ submit: 'No pudimos contactar al servidor. Guardamos tus datos y reintentaremos.' })
    } else {
      setErrors({ submit: result.error || 'Error al enviar el mensaje. Intenta nuevamente.' })
    }

    setIsSubmitting(false)
  }

  return (
    <section
      id="contacto"
      ref={ref}
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-accent to-deep"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            ¡Contáctanos!
          </h2>
          <p className="text-white/80 text-lg">
            Estamos aquí para resolver tus dudas
          </p>
        </motion.div>

        {/* Content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form / Success */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {submittedLead ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center text-center py-6 sm:py-10"
                  >
                    <SuccessCheck size={108} />
                    <motion.h3
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.45 }}
                      className="mt-6 text-white font-bold text-2xl sm:text-3xl leading-tight"
                    >
                      ¡Mensaje enviado!
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.85, duration: 0.45 }}
                      className="mt-3 text-white/85 text-base sm:text-lg leading-relaxed max-w-md"
                    >
                      Nos pondremos en contacto contigo en breve por teléfono o WhatsApp.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.4 }}
                      onClick={resetForm}
                      className="mt-8 px-8 py-3 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cta to-accent hover:translate-y-[-2px] hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
                    >
                      Enviar otro mensaje
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-4 sm:space-y-5"
                    noValidate
                  >
                    {errors.submit && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-cta/15 border border-cta/40 text-white px-4 py-3 rounded-lg text-sm"
                        role="alert"
                      >
                        {errors.submit}
                      </motion.div>
                    )}

                    {/* Names row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="cs-firstName" className="block text-white text-sm font-semibold mb-2">
                          Nombre
                        </label>
                        <input
                          id="cs-firstName"
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Tu nombre"
                          autoComplete="given-name"
                          disabled={isSubmitting}
                          aria-invalid={!!errors.firstName}
                          aria-describedby={errors.firstName ? 'cs-err-firstName' : undefined}
                          className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${
                            errors.firstName ? 'ring-2 ring-rose-400' : ''
                          }`}
                        />
                        <FieldError id="cs-err-firstName" message={errors.firstName} />
                      </div>
                      <div>
                        <label htmlFor="cs-lastName" className="block text-white text-sm font-semibold mb-2">
                          Apellido
                        </label>
                        <input
                          id="cs-lastName"
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Tu apellido"
                          autoComplete="family-name"
                          disabled={isSubmitting}
                          aria-invalid={!!errors.lastName}
                          aria-describedby={errors.lastName ? 'cs-err-lastName' : undefined}
                          className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${
                            errors.lastName ? 'ring-2 ring-rose-400' : ''
                          }`}
                        />
                        <FieldError id="cs-err-lastName" message={errors.lastName} />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="cs-phone" className="block text-white text-sm font-semibold mb-2">
                        Teléfono
                      </label>
                      <div className="flex gap-2">
                        <select
                          name="countryCode"
                          value={formData.countryCode}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="px-3 py-3 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60"
                        >
                          <option value="51">🇵🇪 +51</option>
                          <option value="1">🇺🇸 +1</option>
                          <option value="34">🇪🇸 +34</option>
                        </select>
                        <input
                          id="cs-phone"
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="987 654 321"
                          autoComplete="tel-national"
                          inputMode="numeric"
                          maxLength={9}
                          disabled={isSubmitting}
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? 'cs-err-phone' : undefined}
                          className={`flex-1 min-w-0 px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${
                            errors.phone ? 'ring-2 ring-rose-400' : ''
                          }`}
                        />
                      </div>
                      <FieldError id="cs-err-phone" message={errors.phone} />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="cs-email" className="block text-white text-sm font-semibold mb-2">
                        Email
                      </label>
                      <input
                        id="cs-email"
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="tu@email.com"
                        autoComplete="email"
                        disabled={isSubmitting}
                        aria-invalid={!!errors.email}
                        aria-describedby={errors.email ? 'cs-err-email' : undefined}
                        className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${
                          errors.email ? 'ring-2 ring-rose-400' : ''
                        }`}
                      />
                      <FieldError id="cs-err-email" message={errors.email} />
                    </div>

                    {/* Mensaje */}
                    <div>
                      <label htmlFor="cs-comment" className="block text-white text-sm font-semibold mb-2">
                        Mensaje
                      </label>
                      <textarea
                        id="cs-comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        placeholder="Cuéntanos sobre tu interés..."
                        rows={4}
                        disabled={isSubmitting}
                        aria-invalid={!!errors.comment}
                        aria-describedby={errors.comment ? 'cs-err-comment' : undefined}
                        className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition resize-none disabled:opacity-60 ${
                          errors.comment ? 'ring-2 ring-rose-400' : ''
                        }`}
                      />
                      <FieldError id="cs-err-comment" message={errors.comment} />
                    </div>

                    {/* Privacy */}
                    <div>
                      <div className="flex items-start gap-2">
                        <input
                          id="cs-policies"
                          type="checkbox"
                          name="acceptPolicies"
                          checked={formData.acceptPolicies}
                          onChange={handleChange}
                          disabled={isSubmitting}
                          className="w-5 h-5 mt-0.5 rounded cursor-pointer accent-primary"
                        />
                        <label htmlFor="cs-policies" className="text-white/90 text-sm cursor-pointer select-none">
                          Acepto la{' '}
                          <a href="/politica-privacidad" className="underline hover:text-white">
                            política de privacidad
                          </a>
                        </label>
                      </div>
                      <FieldError message={errors.acceptPolicies} />
                    </div>

                    {/* Submit */}
                    <motion.button
                      whileHover={!isSubmitting ? { scale: 1.02 } : {}}
                      whileTap={!isSubmitting ? { scale: 0.98 } : {}}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSubmitting && (
                        <span
                          className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
                          aria-hidden
                        />
                      )}
                      {isSubmitting ? 'Enviando…' : 'Enviar Mensaje'}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* Map placeholder */}
            <div className="rounded-2xl overflow-hidden shadow-xl h-64 sm:h-72 lg:h-96 bg-surface">
              <iframe src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d956.9149699538272!2d-71.5312063!3d-16.3912795!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91424a4de1c2d297%3A0x3ea4ad2e98c96fd7!2sManuel%20Ugarteche%20207%2C%20Arequipa%2004001!5e0!3m2!1ses!2spe!4v1776438054499!5m2!1ses!2spe" 
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
              ></iframe>
            </div>

            {/* Contact details */}
            <div className="space-y-4">
              {/* Address */}
              <motion.div
                whileHover={{ x: 5 }}
                className="flex gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
              >
                <MdLocationOn className="text-primary text-2xl flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Dirección</p>
                  <p className="text-white/80 text-sm">
                    Calle Manuel Ugarteche 207, Selva Alegre
                  </p>
                </div>
              </motion.div>

              {/* Phone */}
              <motion.div
                whileHover={{ x: 5 }}
                className="flex gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
              >
                <MdPhone className="text-primary text-2xl flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Teléfono</p>
                  <a
                    href="tel: 054209978"
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                     (054) 209978
                  </a>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                whileHover={{ x: 5 }}
                className="flex gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition"
              >
                <MdEmail className="text-primary text-2xl flex-shrink-0 mt-1" />
                <div>
                  <p className="font-semibold text-white">Email</p>
                  <a
                    href="mailto:info@idema.edu.pe"
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    info@idema.edu.pe
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
