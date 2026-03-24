import { useState } from 'react'
import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MdPhone, MdEmail, MdLocationOn } from 'react-icons/md'
import {
  validateName,
  validatePhone,
  validateEmail,
  validateComment,
} from '../../utils/validation'
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
  const [submitSuccess, setSubmitSuccess] = useState(false)

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

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const nameValidation = validateName(formData.firstName)
    if (!nameValidation.valid) {
      newErrors.firstName = nameValidation.error || 'Error de validación'
    }

    const lastNameValidation = validateName(formData.lastName)
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.error || 'Error de validación'
    }

    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error || 'Error de validación'
    }

    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error || 'Error de validación'
    } else if (emailValidation.suggestion) {
      // Offer suggestion for typo
      newErrors.email = `${emailValidation.error} (${emailValidation.suggestion})`
    }

    const commentValidation = validateComment(formData.comment)
    if (!commentValidation.valid) {
      newErrors.comment = commentValidation.error || 'Error de validación'
    }

    if (!formData.acceptPolicies) {
      newErrors.acceptPolicies = 'Debes aceptar la política de privacidad'
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

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))

    setSubmitSuccess(true)
    setFormData({
      firstName: '',
      lastName: '',
      countryCode: '51',
      phone: '',
      email: '',
      comment: '',
      acceptPolicies: false,
    })

    // Reset success message after 3 seconds
    setTimeout(() => setSubmitSuccess(false), 3000)
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
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.6 }}
          >
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 border border-primary/30 text-deep px-4 py-3 rounded-lg"
                >
                  ¡Gracias por tu mensaje! Nos contactaremos pronto.
                </motion.div>
              )}

              {/* Names row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    className={`w-full px-4 py-3 rounded-lg bg-white/90 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition ${
                      errors.firstName ? 'ring-2 ring-cta' : ''
                    }`}
                  />
                  {errors.firstName && (
                    <p className="text-cta text-xs mt-1">
                      {errors.firstName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-white text-sm font-semibold mb-2">
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Tu apellido"
                    className={`w-full px-4 py-3 rounded-lg bg-white/90 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition ${
                      errors.lastName ? 'ring-2 ring-cta' : ''
                    }`}
                  />
                  {errors.lastName && (
                    <p className="text-cta text-xs mt-1">
                      {errors.lastName}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone with country code */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Teléfono
                </label>
                <div className="flex gap-2">
                  <select
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleChange}
                    className="px-3 py-3 rounded-lg bg-white/90 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
                  >
                    <option value="51">🇵🇪 +51</option>
                    <option value="1">🇺🇸 +1</option>
                    <option value="34">🇪🇸 +34</option>
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="123456789"
                    className={`flex-1 px-4 py-3 rounded-lg bg-white/90 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition ${
                      errors.phone ? 'ring-2 ring-cta' : ''
                    }`}
                  />
                </div>
                {errors.phone && (
                  <p className="text-cta text-xs mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  className={`w-full px-4 py-3 rounded-lg bg-white/90 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition ${
                    errors.email ? 'ring-2 ring-cta' : ''
                  }`}
                />
                {errors.email && (
                  <p className="text-cta text-xs mt-1">{errors.email}</p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label className="block text-white text-sm font-semibold mb-2">
                  Mensaje
                </label>
                <textarea
                  name="comment"
                  value={formData.comment}
                  onChange={handleChange}
                  placeholder="Cuéntanos sobre tu interés..."
                  rows={4}
                  className={`w-full px-4 py-3 rounded-lg bg-white/90 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition resize-none ${
                    errors.comment ? 'ring-2 ring-cta' : ''
                  }`}
                />
                {errors.comment && (
                  <p className="text-cta text-xs mt-1">{errors.comment}</p>
                )}
              </div>

              {/* Privacy checkbox */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  name="acceptPolicies"
                  checked={formData.acceptPolicies}
                  onChange={handleChange}
                  className="w-5 h-5 mt-1 rounded cursor-pointer"
                />
                <label className="text-white/90 text-sm">
                  Acepto la{' '}
                  <a
                    href="/politica-privacidad"
                    className="underline hover:text-white"
                  >
                    política de privacidad
                  </a>
                </label>
              </div>
              {errors.acceptPolicies && (
                <p className="text-cta text-xs">{errors.acceptPolicies}</p>
              )}

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 sm:py-4 bg-cta text-white font-bold rounded-lg hover:shadow-lg hover:shadow-cta/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Mensaje'}
              </motion.button>
            </form>
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
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3824.4651159437463!2d-71.5366!3d-16.3894!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2sIDEMA!5e0!3m2!1ses!2spe!4v"
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
                    Arequipa, Perú
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
                    href="tel:+5156161234"
                    className="text-white/80 text-sm hover:text-white transition"
                  >
                    +51 (6) 1612345
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
