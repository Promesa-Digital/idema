import { useState, useEffect, useRef, useCallback } from 'react'
import type { ChangeEvent, ComponentType, FocusEvent, FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaPhone,
  FaSitemap,
  FaNewspaper,
  FaGraduationCap,
  FaBook,
  FaBriefcase,
  FaUsers,
  FaUserPlus,
  FaRobot,
  FaShoppingCart,
} from 'react-icons/fa'
import { mainNavLinks, accederDropdown, countryCodes } from '../../data/navigation'
import { useCart } from '../../hooks/useCart'
import { validateNamePart, validatePhone, validateEmail, validateComment } from '../../utils/validation'
import { submitLead } from '../../utils/leadIntake'
import SuccessCheck from '../ui/SuccessCheck'
import FieldError from '../ui/FieldError'
import type { ContactFormData } from '../../types'

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  FaSitemap,
  FaNewspaper,
  FaGraduationCap,
  FaBook,
  FaBriefcase,
  FaUsers,
  FaUserPlus,
  FaRobot,
}

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    firstName: '',
    lastName: '',
    countryCode: '51',
    phone: '',
    email: '',
    comment: '',
    acceptPolicies: false,
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedLead, setSubmittedLead] = useState<{ code?: string } | null>(null)
  const [submitFeedback, setSubmitFeedback] = useState<
    { tone: 'info' | 'warning' | 'error'; message: string } | null
  >(null)
  const [popupPos, setPopupPos] = useState<{ top: number; right: number }>({
    top: 76, right: 16,
  })
  const navRef = useRef<HTMLDivElement>(null)
  const contactBtnRef = useRef<HTMLButtonElement>(null)
  const { totalItems, toggleCart } = useCart()
  const location = useLocation()

  // Check if we're on the home page (hero has dark bg, so transparent works)
  const isHome = location.pathname === '/'

  const closeNavigationState = () => {
    setIsMobileOpen(false)
    setOpenDropdown(null)
    setShowContactForm(false)
  }

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close only the dropdown when clicking outside the navbar.
  // The popup has its own overlay click handler — and ahora vive en un Portal,
  // así que NO está dentro de navRef y este handler no lo debe cerrar.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset al cerrar el popup (por overlay, X, o cambio de ruta)
  useEffect(() => {
    if (!showContactForm) {
      setSubmittedLead(null)
      setFormErrors({})
      setSubmitFeedback(null)
      setIsSubmitting(false)
    }
  }, [showContactForm])

  // Auto-cerrar el popup luego de mostrar el éxito unos segundos
  useEffect(() => {
    if (!submittedLead) return
    const t = setTimeout(() => setShowContactForm(false), 6000)
    return () => clearTimeout(t)
  }, [submittedLead])

  // Calcula la posición del popup según el botón "¡Contáctanos!".
  // En mobile (<lg) el botón vive dentro del menú móvil y se cierra al abrir
  // el popup, así que caemos a un anclaje "top-right del viewport".
  const computePopupPos = useCallback(() => {
    const btn = contactBtnRef.current
    if (!btn || window.innerWidth < 1024) {
      return { top: 76, right: 16 }
    }
    const rect = btn.getBoundingClientRect()
    return {
      top: Math.max(64, rect.bottom + 10),
      right: Math.max(16, window.innerWidth - rect.right),
    }
  }, [])

  // Reposicionar mientras el popup está abierto (resize, scroll de cualquier
  // contenedor). El cálculo inicial se hace en el handler del click para
  // evitar un flash de posición incorrecta en el primer mount.
  useEffect(() => {
    if (!showContactForm) return
    const update = () => setPopupPos(computePopupPos())
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [showContactForm, computePopupPos])

  const openContactForm = () => {
    setPopupPos(computePopupPos())
    setShowContactForm(true)
    setOpenDropdown(null)
  }

  // Escape para cerrar el popup
  useEffect(() => {
    if (!showContactForm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowContactForm(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [showContactForm])

  const handleFormChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    // Limpia el error del campo al editarlo (re-valida en blur o submit)
    if (formErrors[name]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    // Si había un mensaje de submit (duplicado, error, etc.), también lo limpiamos
    // — el usuario está corrigiendo, dejemos que reintente
    if (submitFeedback) setSubmitFeedback(null)
  }

  const fieldError = (name: string, value: string | boolean): string | undefined => {
    switch (name) {
      case 'firstName':     return validateNamePart(String(value), 'nombre').error
      case 'lastName':      return validateNamePart(String(value), 'apellido').error
      case 'phone':         return validatePhone(String(value)).error
      case 'email':         return validateEmail(String(value)).error
      case 'comment':       return validateComment(String(value)).error
      case 'acceptPolicies': return value ? undefined : 'Acepta las políticas para continuar.'
      default:              return undefined
    }
  }

  const handleFormBlur = (e: FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const err = fieldError(name, value)
    setFormErrors(prev => {
      if (!err) {
        const next = { ...prev }
        delete next[name]
        return next
      }
      return { ...prev, [name]: err }
    })
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
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
      if (err) errors[name] = err
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitFeedback(null)
    setIsSubmitting(true)
    const result = await submitLead({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      form: 1,
      message: formData.comment,
    })
    setIsSubmitting(false)

    if (result.ok) {
      setSubmittedLead({ code: result.leadCode })
      setFormData({ firstName: '', lastName: '', countryCode: '51', phone: '', email: '', comment: '', acceptPolicies: false })
      setOpenDropdown(null)
      return
    }

    if (result.duplicate) {
      setSubmitFeedback({
        tone: 'info',
        message: 'Ya estás en nuestro sistema. Pronto te contactaremos.',
      })
      return
    }

    if (result.queued) {
      setSubmitFeedback({
        tone: 'warning',
        message: 'Sin conexión. Guardamos tus datos y lo reintentaremos.',
      })
      return
    }

    setSubmitFeedback({
      tone: 'error',
      message: result.error || 'No se pudo enviar. Intenta nuevamente.',
    })
  }

  // Navbar background: on home transparent until scrolled, on other pages always dark
  const navBg = !isHome
    ? 'bg-dark/95 backdrop-blur-md shadow-lg'
    : isScrolled
      ? 'bg-dark/95 backdrop-blur-md shadow-lg'
      : 'bg-transparent'

  return (
    <>
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${navBg}`}
      style={{ padding: isScrolled ? '0.35rem 0' : '0.75rem 0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeNavigationState} className="flex-shrink-0 flex items-center gap-3">
            <img
              src="/assets/img/idema-white.png"
              alt="IDEMA"
              className="transition-all duration-300"
              style={{ height: isScrolled ? '36px' : '44px' }}
            />
            <span
              className={`hidden sm:block text-white text-[10px] leading-tight font-medium tracking-wide border-l border-white/15 pl-3 transition-opacity duration-300 ${
                isScrolled ? 'opacity-100' : 'opacity-90'
              }`}
            >
              Instituto Santiago<br />Ramón y Cajal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                onClick={closeNavigationState}
                className="text-white/90 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider px-3 py-2"
              >
                {link.label}
              </Link>
            ))}

            {/* Acceder Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'acceder' ? null : 'acceder')}
                className="text-white/90 hover:text-primary transition-colors text-sm font-semibold uppercase tracking-wider px-3 py-2 flex items-center gap-1"
              >
                Acceder
                <FaChevronDown className={`w-2.5 h-2.5 transition-transform duration-200 ${openDropdown === 'acceder' ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {openDropdown === 'acceder' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -5, scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl overflow-hidden border border-deep/10"
                  >
                    {accederDropdown.map(item => {
                      const Icon = iconMap[item.icon]
                      const cls = "flex items-center gap-3 px-4 py-3 text-deep hover:bg-surface transition-colors text-sm"
                      const inner = (
                        <>
                          <Icon className="w-4 h-4 text-primary" />
                          <span>{item.label}</span>
                        </>
                      )
                      return item.external ? (
                        <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpenDropdown(null)} className={cls}>{inner}</a>
                      ) : (
                        <Link key={item.href} to={item.href} onClick={closeNavigationState} className={cls}>{inner}</Link>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart Button */}
            <button
              onClick={toggleCart}
              className="relative text-white/90 hover:text-primary transition-colors p-2 ml-1"
              aria-label="Carrito de compras"
            >
              <FaShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-cta text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Contact Button */}
            <div className="relative ml-2">
              <button
                ref={contactBtnRef}
                onClick={() => {
                  if (showContactForm) setShowContactForm(false)
                  else openContactForm()
                }}
                className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-[0_4px_25px_rgba(13,202,240,0.5)] transition-all duration-300 flex items-center gap-2"
                style={{ animation: 'pulse-glow 2s infinite' }}
                aria-haspopup="dialog"
                aria-expanded={showContactForm}
              >
                <FaPhone className="w-3 h-3" />
                ¡Contáctanos!
              </button>

            </div>
          </div>

          {/* Mobile Cart + Menu Buttons */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={toggleCart}
              className="relative text-white/90 hover:text-primary transition-colors p-2"
              aria-label="Carrito de compras"
            >
              <FaShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-cta text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="text-white p-2"
              aria-label="Menú"
            >
              {isMobileOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden mt-3 pt-3 border-t border-white/10 bg-dark/95 backdrop-blur-md rounded-xl px-2 pb-2"
            >
              {mainNavLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={closeNavigationState}
                  className="block text-white/90 hover:text-primary py-2.5 text-sm font-semibold uppercase tracking-wider"
                >
                  {link.label}
                </Link>
              ))}

              {/* Mobile Acceder */}
              <div className="mt-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'acceder' ? null : 'acceder')}
                  className="text-white/90 hover:text-primary w-full text-left text-sm font-semibold uppercase tracking-wider flex items-center gap-2 py-2.5"
                >
                  Acceder
                  <FaChevronDown className={`w-2.5 h-2.5 transition-transform ${openDropdown === 'acceder' ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {openDropdown === 'acceder' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="pl-4 pb-2 space-y-1"
                    >
                      {accederDropdown.map(item => {
                        const Icon = iconMap[item.icon]
                        const cls = "flex items-center gap-2 text-white/60 hover:text-primary py-1.5 text-sm"
                        const inner = (<><Icon className="w-3 h-3" />{item.label}</>)
                        return item.external ? (
                          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={closeNavigationState} className={cls}>{inner}</a>
                        ) : (
                          <Link key={item.href} to={item.href} onClick={closeNavigationState} className={cls}>{inner}</Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => { setIsMobileOpen(false); openContactForm() }}
                className="w-full mt-3 mb-2 bg-primary text-white px-4 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2"
              >
                <FaPhone className="w-3 h-3" />
                ¡Contáctanos!
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </nav>

    {createPortal(
      <AnimatePresence>
        {showContactForm && (
          <>
            {/* Click-outside invisible catcher (sin dim del fondo) */}
            <div
              className="fixed inset-0 z-[100]"
              onClick={() => setShowContactForm(false)}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              style={{
                top: popupPos.top,
                right: popupPos.right,
                transformOrigin: 'top right',
              }}
              className="fixed w-[380px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col border border-white/10 z-[110]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="false"
              aria-labelledby="contact-popup-title"
            >
              {/* Background: 3-stop gradient + radial spotlight en la esquina */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(135deg, var(--color-cta) 0%, var(--color-accent) 42%, var(--color-deep) 100%)',
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                  background: 'radial-gradient(600px circle at 100% 0%, rgba(255,255,255,0.18), transparent 50%)',
                }}
              />

              <div className="relative p-6 sm:p-7 overflow-y-auto">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-white/55 text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                      Asesoría IDEMA
                    </p>
                    <h5 id="contact-popup-title" className="text-white font-bold text-xl leading-tight">
                      {submittedLead ? '¡Mensaje recibido!' : 'Conversemos.'}
                    </h5>
                    {!submittedLead && (
                      <p className="text-white/70 text-xs mt-1">
                        Te llamamos en menos de 24h.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowContactForm(false)}
                    className="text-white/50 hover:text-white transition-colors p-1.5 -m-1.5 rounded-full hover:bg-white/10"
                    aria-label="Cerrar"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>

                {submittedLead ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="py-2 flex flex-col items-center text-center"
                  >
                    <SuccessCheck size={92} />
                    <motion.h6
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.4 }}
                      className="mt-5 text-white font-bold text-xl leading-tight"
                    >
                      ¡Te llamaremos pronto!
                    </motion.h6>
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.85, duration: 0.4 }}
                      className="mt-2 text-white/85 text-sm leading-relaxed max-w-[300px]"
                    >
                      Nos comunicaremos contigo en breve por teléfono o WhatsApp.
                    </motion.p>
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.4 }}
                      onClick={() => setShowContactForm(false)}
                      className="mt-6 px-7 py-2.5 rounded-full text-sm font-semibold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-colors"
                    >
                      Cerrar
                    </motion.button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3" noValidate>
                    <AnimatePresence>
                      {submitFeedback && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: 'auto' }}
                          exit={{ opacity: 0, y: -8, height: 0 }}
                          transition={{ duration: 0.2 }}
                          role="alert"
                          className={`px-3.5 py-3 rounded-xl text-xs leading-relaxed flex items-start gap-2 border ${
                            submitFeedback.tone === 'info'
                              ? 'bg-white/15 border-white/25 text-white'
                              : submitFeedback.tone === 'warning'
                                ? 'bg-amber-300/15 border-amber-200/30 text-amber-50'
                                : 'bg-rose-400/15 border-rose-300/30 text-rose-50'
                          }`}
                        >
                          <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 bg-current opacity-80" />
                          <span>{submitFeedback.message}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input type="text" name="firstName" placeholder="Nombres *" value={formData.firstName} onChange={handleFormChange} onBlur={handleFormBlur} maxLength={50} autoComplete="given-name" disabled={isSubmitting}
                          aria-invalid={!!formErrors.firstName}
                          aria-describedby={formErrors.firstName ? 'err-firstName' : undefined}
                          className={`w-full px-3.5 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary placeholder-deep/50 disabled:opacity-60 ${formErrors.firstName ? 'ring-2 ring-rose-400' : ''}`} />
                        <FieldError id="err-firstName" message={formErrors.firstName} />
                      </div>
                      <div>
                        <input type="text" name="lastName" placeholder="Apellidos *" value={formData.lastName} onChange={handleFormChange} onBlur={handleFormBlur} maxLength={50} autoComplete="family-name" disabled={isSubmitting}
                          aria-invalid={!!formErrors.lastName}
                          aria-describedby={formErrors.lastName ? 'err-lastName' : undefined}
                          className={`w-full px-3.5 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary placeholder-deep/50 disabled:opacity-60 ${formErrors.lastName ? 'ring-2 ring-rose-400' : ''}`} />
                        <FieldError id="err-lastName" message={formErrors.lastName} />
                      </div>
                    </div>

                    <div>
                      <div className="flex gap-2">
                        <select name="countryCode" value={formData.countryCode} onChange={handleFormChange} disabled={isSubmitting}
                          className="w-[100px] px-2 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary disabled:opacity-60">
                          {countryCodes.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                          ))}
                        </select>
                        <input type="tel" name="phone" placeholder="987 654 321" value={formData.phone} onChange={handleFormChange} onBlur={handleFormBlur} maxLength={9} autoComplete="tel-national" inputMode="numeric" disabled={isSubmitting}
                          aria-invalid={!!formErrors.phone}
                          aria-describedby={formErrors.phone ? 'err-phone' : undefined}
                          className={`flex-1 min-w-0 px-3.5 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary placeholder-deep/50 disabled:opacity-60 ${formErrors.phone ? 'ring-2 ring-rose-400' : ''}`} />
                      </div>
                      <FieldError id="err-phone" message={formErrors.phone} />
                    </div>

                    <div>
                      <input type="email" name="email" placeholder="Correo Electrónico *" value={formData.email} onChange={handleFormChange} onBlur={handleFormBlur} maxLength={100} autoComplete="email" disabled={isSubmitting}
                        aria-invalid={!!formErrors.email}
                        aria-describedby={formErrors.email ? 'err-email' : undefined}
                        className={`w-full px-3.5 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary placeholder-deep/50 disabled:opacity-60 ${formErrors.email ? 'ring-2 ring-rose-400' : ''}`} />
                      <FieldError id="err-email" message={formErrors.email} />
                    </div>

                    <div>
                      <input type="text" name="comment" placeholder="¿Qué carrera o curso te interesa? *" value={formData.comment} onChange={handleFormChange} onBlur={handleFormBlur} maxLength={200} disabled={isSubmitting}
                        aria-invalid={!!formErrors.comment}
                        aria-describedby={formErrors.comment ? 'err-comment' : undefined}
                        className={`w-full px-3.5 py-3 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-primary placeholder-deep/50 disabled:opacity-60 ${formErrors.comment ? 'ring-2 ring-rose-400' : ''}`} />
                      <FieldError id="err-comment" message={formErrors.comment} />
                    </div>

                    <div>
                      <label className="flex items-start gap-2 text-white/85 text-[11px] leading-relaxed cursor-pointer pt-1">
                        <input type="checkbox" name="acceptPolicies" checked={formData.acceptPolicies} onChange={handleFormChange} disabled={isSubmitting}
                          className="w-4 h-4 mt-0.5 rounded accent-primary flex-shrink-0" />
                        <span>
                          Acepto las <Link to="/politica-privacidad" className="text-white underline underline-offset-2" target="_blank">Políticas de Privacidad</Link> y los <Link to="/terminos-y-condiciones" className="text-white underline underline-offset-2" target="_blank">Términos y condiciones</Link>.
                        </span>
                      </label>
                      <FieldError message={formErrors.acceptPolicies} />
                    </div>

                    <button type="submit" disabled={isSubmitting}
                      className="w-full py-3 mt-1 rounded-full font-semibold text-sm text-deep bg-white hover:bg-white/95 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.18)]">
                      {isSubmitting ? (
                        <>
                          <span className="inline-block w-4 h-4 rounded-full border-2 border-deep/20 border-t-deep animate-spin" aria-hidden />
                          Enviando…
                        </>
                      ) : (
                        <>Enviar mensaje</>
                      )}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-white/60 text-[11px] pt-1">
                      <FaPhone className="w-3 h-3" />
                      <span>O llámanos al</span>
                      <a href="tel:+5161612345" className="text-white hover:text-primary transition-colors font-semibold">+51 (6) 1612345</a>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>,
      document.body,
    )}
    </>
  )
}
