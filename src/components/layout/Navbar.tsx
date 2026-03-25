import { useState, useEffect, useRef } from 'react'
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
import { useCart } from '../../context/CartContext'
import { validateName, validatePhone, validateEmail, validateComment } from '../../utils/validation'
import { useToast } from '../../hooks/useToast'
import type { ContactFormData } from '../../types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
  const navRef = useRef<HTMLDivElement>(null)
  const { addToast } = useToast()
  const { totalItems, toggleCart } = useCart()
  const location = useLocation()

  // Check if we're on the home page (hero has dark bg, so transparent works)
  const isHome = location.pathname === '/'

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80)
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false)
    setOpenDropdown(null)
    setShowContactForm(false)
  }, [location.pathname])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
        setShowContactForm(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    const nameValidation = validateName(`${formData.firstName} ${formData.lastName}`)
    if (!nameValidation.valid) errors.firstName = nameValidation.error || 'Nombre inválido'
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) errors.phone = phoneValidation.error || 'Teléfono inválido'
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) errors.email = emailValidation.error || 'Email inválido'
    const commentValidation = validateComment(formData.comment)
    if (!commentValidation.valid) errors.comment = commentValidation.error || 'Comentario inválido'
    if (!formData.acceptPolicies) errors.acceptPolicies = 'Debes aceptar las políticas'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    addToast('success', '¡Enviado!', 'Gracias, te llamaremos pronto.')
    setFormData({ firstName: '', lastName: '', countryCode: '51', phone: '', email: '', comment: '', acceptPolicies: false })
    setShowContactForm(false)
    setOpenDropdown(null)
  }

  // Navbar background: on home transparent until scrolled, on other pages always dark
  const navBg = !isHome
    ? 'bg-dark/95 backdrop-blur-md shadow-lg'
    : isScrolled
      ? 'bg-dark/95 backdrop-blur-md shadow-lg'
      : 'bg-transparent'

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${navBg}`}
      style={{ padding: isScrolled ? '0.35rem 0' : '0.75rem 0' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img
              src="/assets/img/idema-white.png"
              alt="IDEMA"
              className="transition-all duration-300"
              style={{ height: isScrolled ? '36px' : '44px' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {mainNavLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
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
                        <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                      ) : (
                        <Link key={item.href} to={item.href} onClick={() => setOpenDropdown(null)} className={cls}>{inner}</Link>
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
                onClick={() => {
                  setShowContactForm(!showContactForm)
                  setOpenDropdown(null)
                }}
                className="bg-primary text-white px-5 py-2 rounded-full text-sm font-semibold hover:shadow-[0_4px_25px_rgba(13,202,240,0.5)] transition-all duration-300 flex items-center gap-2"
                style={{ animation: 'pulse-glow 2s infinite' }}
              >
                <FaPhone className="w-3 h-3" />
                ¡Contáctanos!
              </button>

              {/* Contact Form Dropdown */}
              <AnimatePresence>
                {showContactForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-3 w-[380px] rounded-2xl shadow-2xl overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-gradient-to-br from-accent to-deep p-5">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-white font-bold text-base">¡Nos Comunicamos Contigo!</h5>
                        <button onClick={() => setShowContactForm(false)} className="text-white/60 hover:text-white transition-colors">
                          <FaTimes className="w-4 h-4" />
                        </button>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-2.5">
                        <div className="flex gap-2">
                          <input type="text" name="firstName" placeholder="Nombres *" value={formData.firstName} onChange={handleFormChange} maxLength={50}
                            className={`flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40 placeholder-deep/50 ${formErrors.firstName ? 'ring-2 ring-cta' : ''}`} />
                          <input type="text" name="lastName" placeholder="Apellidos *" value={formData.lastName} onChange={handleFormChange} maxLength={50}
                            className={`flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40 placeholder-deep/50 ${formErrors.firstName ? 'ring-2 ring-cta' : ''}`} />
                        </div>

                        <div className="flex gap-2">
                          <select name="countryCode" value={formData.countryCode} onChange={handleFormChange}
                            className="w-[100px] px-2 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40">
                            {countryCodes.map(c => (
                              <option key={c.code} value={c.code}>{c.flag} +{c.code}</option>
                            ))}
                          </select>
                          <input type="tel" name="phone" placeholder="987 654 321" value={formData.phone} onChange={handleFormChange} maxLength={9}
                            className={`flex-1 px-3 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40 placeholder-deep/50 ${formErrors.phone ? 'ring-2 ring-cta' : ''}`} />
                        </div>

                        <input type="email" name="email" placeholder="Correo Electrónico *" value={formData.email} onChange={handleFormChange} maxLength={100}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40 placeholder-deep/50 ${formErrors.email ? 'ring-2 ring-cta' : ''}`} />

                        <input type="text" name="comment" placeholder="¿Qué carrera o curso te interesa? *" value={formData.comment} onChange={handleFormChange} maxLength={200}
                          className={`w-full px-3 py-2.5 rounded-xl text-sm bg-white/95 border-none outline-none focus:ring-2 focus:ring-white/40 placeholder-deep/50 ${formErrors.comment ? 'ring-2 ring-cta' : ''}`} />

                        <label className="flex items-start gap-2 text-white/90 text-xs cursor-pointer">
                          <input type="checkbox" name="acceptPolicies" checked={formData.acceptPolicies} onChange={handleFormChange}
                            className="w-4 h-4 mt-0.5 rounded" />
                          <span>
                            Acepto las <Link to="/politica-privacidad" className="text-white underline" target="_blank">Políticas de Privacidad</Link> y los <Link to="/terminos-y-condiciones" className="text-white underline" target="_blank">Términos y condiciones</Link>.
                          </span>
                        </label>

                        <button type="submit"
                          className="w-full py-2.5 rounded-full font-semibold text-sm text-white bg-gradient-to-r from-cta to-accent hover:translate-y-[-2px] hover:shadow-[0_6px_20px_rgba(245,87,108,0.4)] transition-all duration-300">
                          Enviar
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
                  onClick={() => setIsMobileOpen(false)}
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
                          <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" onClick={() => setIsMobileOpen(false)} className={cls}>{inner}</a>
                        ) : (
                          <Link key={item.href} to={item.href} onClick={() => setIsMobileOpen(false)} className={cls}>{inner}</Link>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={() => { setShowContactForm(!showContactForm); setIsMobileOpen(false) }}
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
  )
}
