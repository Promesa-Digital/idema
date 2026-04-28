import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaTimes, FaTrash, FaMinus, FaPlus, FaShoppingCart, FaWhatsapp, FaCheckCircle } from 'react-icons/fa'
import { MdArrowBack, MdSend } from 'react-icons/md'
import { useCart } from '../../context/CartContext'

type Step = 'cart' | 'form' | 'success'

const paymentMethods = [
  {
    bank: 'BCP',
    lines: ['Recaudación: 20430', 'Cuenta: 25105155619028', 'CCI: 00225110515561902870'],
  },
  {
    bank: 'BCP Móvil',
    lines: ['Pago de Servicios → Instituto Idema'],
  },
  {
    bank: 'Yape / Plin',
    lines: ['991 317 346'],
  },
  {
    bank: 'BBVA',
    lines: ['001107630200236164'],
  },
  {
    bank: 'Interbank',
    lines: ['Cuenta: 5503004249241', 'CCI: 003550003004249241'],
  },
]

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, clearCart, totalPrice, totalItems } = useCart()

  const [step, setStep] = useState<Step>('cart')
  const [sending, setSending] = useState(false)
  const [form, setForm] = useState({ nombre: '', email: '', telefono: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleClose = () => {
    closeCart()
    setTimeout(() => setStep('cart'), 400)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.nombre.trim()) e.nombre = 'Ingresa tu nombre'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido'
    if (!form.telefono.trim()) e.telefono = 'Ingresa tu teléfono'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const itemsList = items.map(i => `• ${i.product.title} — S/.${(i.price * i.quantity).toFixed(2)}`).join('\n')
    const mensaje = `Solicitud de inscripción / pago pendiente de validación:\n\n${itemsList}\n\nTotal: S/.${totalPrice.toFixed(2)}`

    try {
      setSending(true)
      const body = new FormData()
      body.append('access_key', 'c58368ae-ca4c-419b-91a7-d19435dafcfc')
      body.append('subject', `💳 Pago pendiente – ${form.nombre} | ${items.map(i => i.product.shortTitle || i.product.title).join(', ')}`)
      body.append('from_name', 'IDEMA Carrito Web')
      body.append('Nombre', form.nombre)
      body.append('Email', form.email)
      body.append('Teléfono', form.telefono)
      body.append('Cursos / Programas', itemsList)
      body.append('Total', `S/.${totalPrice.toFixed(2)}`)
      body.append('Mensaje', mensaje)

      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body })
      const data = await res.json()

      if (data.success) {
        setStep('success')
        clearCart()
      }
    } catch {
      // silent
    } finally {
      setSending(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 z-[60]"
          />

          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[61] flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-dark to-deep p-5 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3 text-white">
                {step === 'form' && (
                  <button onClick={() => setStep('cart')} className="text-white/70 hover:text-white mr-1">
                    <MdArrowBack className="text-xl" />
                  </button>
                )}
                <FaShoppingCart className="text-xl" />
                <h2 className="text-lg font-bold">
                  {step === 'cart' ? 'Carrito de Compras' : step === 'form' ? 'Datos de Inscripción' : '¡Listo!'}
                </h2>
                {step === 'cart' && totalItems > 0 && (
                  <span className="bg-white/20 text-sm px-2 py-0.5 rounded-full">
                    {totalItems} {totalItems === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <button onClick={handleClose} className="text-white/70 hover:text-white transition-colors p-1">
                <FaTimes className="text-xl" />
              </button>
            </div>

            {/* ── STEP: CART ── */}
            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  {items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-deep/50">
                      <FaShoppingCart className="text-6xl mb-4 opacity-30" />
                      <p className="text-lg font-semibold">Tu carrito está vacío</p>
                      <p className="text-sm mt-1">Explora nuestros cursos y programas</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {items.map(item => (
                        <motion.div
                          key={item.product.slug} layout
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 100 }}
                          className="bg-surface rounded-xl p-4 border border-deep/10"
                        >
                          <div className="flex gap-3">
                            <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface">
                              <img src={item.product.image} alt={item.product.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-deep text-sm leading-tight truncate">{item.product.title}</h3>
                              <p className="text-xs text-deep/70 mt-0.5">{item.product.duration} • {item.modality || item.product.modality}</p>
                              <p className="text-primary font-bold mt-1">S/.{item.price.toFixed(2)}</p>
                            </div>
                            <button onClick={() => removeItem(item.product.slug)} className="text-deep/50 hover:text-cta transition-colors p-1 self-start">
                              <FaTrash className="text-sm" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-deep/10">
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateQuantity(item.product.slug, item.quantity - 1)} className="w-7 h-7 rounded-full bg-surface flex items-center justify-center">
                                <FaMinus className="text-[10px]" />
                              </button>
                              <span className="font-semibold text-deep w-6 text-center">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.product.slug, item.quantity + 1)} className="w-7 h-7 rounded-full bg-primary/15 text-dark flex items-center justify-center">
                                <FaPlus className="text-[10px]" />
                              </button>
                            </div>
                            <span className="font-bold text-deep">S/.{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {items.length > 0 && (
                  <div className="border-t border-deep/10 p-5 space-y-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                      <span className="text-deep/80 font-semibold">Total:</span>
                      <span className="text-2xl font-bold text-deep">S/.{totalPrice.toFixed(2)}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('form')}
                      className="w-full py-4 bg-gradient-to-r from-primary to-dark text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                    >
                      <MdSend className="text-lg" />
                      Proceder a la Inscripción
                    </motion.button>
                    <button onClick={clearCart} className="w-full text-center text-sm text-deep/50 hover:text-cta transition-colors">
                      Vaciar carrito
                    </button>
                  </div>
                )}
              </>
            )}

            {/* ── STEP: FORM ── */}
            {step === 'form' && (
              <div className="flex-1 overflow-y-auto">
                {/* Medios de pago */}
                <div className="bg-surface p-4 border-b border-deep/10">
                  <p className="text-xs font-bold text-deep uppercase tracking-wider mb-3">💳 Medios de Pago</p>
                  <div className="grid grid-cols-1 gap-2">
                    {paymentMethods.map(m => (
                      <div key={m.bank} className="bg-white rounded-lg px-3 py-2 border border-deep/10">
                        <p className="text-xs font-bold text-primary mb-0.5">🏦 {m.bank}</p>
                        {m.lines.map(l => (
                          <p key={l} className="text-xs text-deep/70">{l}</p>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-deep/50 mt-3 leading-snug">
                    📌 Envíanos tu comprobante de pago, correo y foto de DNI (ambas caras) por WhatsApp para validar tu inscripción.
                  </p>
                </div>

                {/* Resumen */}
                <div className="px-4 pt-4 pb-2">
                  <p className="text-xs font-bold text-deep uppercase tracking-wider mb-2">Resumen del pedido</p>
                  {items.map(i => (
                    <div key={i.product.slug} className="flex justify-between text-sm text-deep/80 mb-1">
                      <span className="truncate pr-2">{i.product.title}</span>
                      <span className="font-semibold flex-shrink-0">S/.{(i.price * i.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold text-deep border-t border-deep/10 mt-2 pt-2">
                    <span>Total</span>
                    <span>S/.{totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-4 pb-6 space-y-3">
                  <p className="text-xs font-bold text-deep uppercase tracking-wider mb-1 pt-2">Tus datos</p>

                  <div>
                    <input
                      type="text" placeholder="Nombre completo"
                      value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                      className="w-full border border-deep/20 rounded-lg px-3 py-2.5 text-sm text-deep placeholder-deep/40 focus:outline-none focus:border-primary"
                    />
                    {errors.nombre && <p className="text-xs text-cta mt-1">{errors.nombre}</p>}
                  </div>

                  <div>
                    <input
                      type="email" placeholder="Correo electrónico"
                      value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full border border-deep/20 rounded-lg px-3 py-2.5 text-sm text-deep placeholder-deep/40 focus:outline-none focus:border-primary"
                    />
                    {errors.email && <p className="text-xs text-cta mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <input
                      type="tel" placeholder="Teléfono / WhatsApp"
                      value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                      className="w-full border border-deep/20 rounded-lg px-3 py-2.5 text-sm text-deep placeholder-deep/40 focus:outline-none focus:border-primary"
                    />
                    {errors.telefono && <p className="text-xs text-cta mt-1">{errors.telefono}</p>}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    type="submit" disabled={sending}
                    className="w-full py-4 bg-gradient-to-r from-primary to-dark text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 disabled:opacity-60"
                  >
                    <MdSend className="text-lg" />
                    {sending ? 'Enviando...' : 'Confirmar Inscripción'}
                  </motion.button>
                </form>
              </div>
            )}

            {/* ── STEP: SUCCESS ── */}
            {step === 'success' && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
                <FaCheckCircle className="text-6xl text-primary" />
                <h3 className="text-2xl font-bold text-deep">¡Gracias!</h3>
                <p className="text-deep/70 leading-relaxed">
                  Recibimos tu solicitud. Un asesor se pondrá en contacto contigo a la brevedad para validar tu inscripción.
                </p>
                <p className="text-sm text-deep/50">
                  Recuerda enviarnos tu comprobante de pago, correo y DNI por WhatsApp para completar el proceso.
                </p>
                <a
                  href="https://wa.me/51991317346"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-whatsapp text-white font-bold px-6 py-3 rounded-full hover:shadow-lg transition-all"
                >
                  <FaWhatsapp className="text-xl" />
                  Enviar comprobante
                </a>
                <button onClick={handleClose} className="text-sm text-deep/50 hover:text-primary transition-colors mt-2">
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
