import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaWhatsapp, FaTimes } from 'react-icons/fa'
import { whatsappReps, getWhatsAppUrl } from '../../data/whatsapp'

const repImages: Record<string, string> = {
  MERY: '/assets/img/vendedoras/idema-mery.jpeg',
  RODOLFO: '/assets/img/vendedoras/idema-rodolfo.jpeg',
  TATIANA: '/assets/img/idemaNEWLOGO2026.png',
  RODRIGO: '/assets/img/idemaNEWLOGO2026.png',
  GERALDINE: '/assets/img/vendedoras/GERALDINE.png',
}

export default function WhatsAppButton() {
  const [showMenu, setShowMenu] = useState(false)
  const [isFooterInView, setIsFooterInView] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterInView(entry.isIntersecting),
      { threshold: 0.1 }
    )
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleRepClick = (rep: typeof whatsappReps[0]) => {
    const url = getWhatsAppUrl(rep.phone, 'Hola! Me interesa obtener información sobre los cursos de IDEMA.')
    window.open(url, '_blank')
    setShowMenu(false)
  }

  return (
    <AnimatePresence>
      {!isFooterInView && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          className="fixed bottom-6 right-6 z-[1000] flex flex-col items-end gap-3"
        >
          {/* Rep Selection Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="bg-white rounded-2xl shadow-2xl overflow-hidden w-72 border border-deep/10"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-whatsapp to-dark text-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base">¡Hola! 👋</h3>
                      <p className="text-xs text-white/80 mt-0.5">Selecciona un asesor</p>
                    </div>
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Rep List */}
                <div className="max-h-72 overflow-y-auto">
                  {whatsappReps.map((rep, i) => (
                    <motion.button
                      key={rep.phone}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => handleRepClick(rep)}
                      className="w-full px-4 py-3 text-left border-b border-deep/5 last:border-b-0 hover:bg-primary/10 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-surface flex-shrink-0 ring-2 ring-whatsapp/20">
                        <img
                          src={repImages[rep.name] || '/assets/img/idemaNEWLOGO2026.png'}
                          alt={rep.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/img/idemaNEWLOGO2026.png'
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-deep">{rep.name}</p>
                        <p className="text-xs text-deep/50">Asesor de ventas</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-whatsapp flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaWhatsapp className="w-4 h-4 text-white" />
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Footer note */}
                <div className="px-4 py-2 bg-surface text-center">
                  <p className="text-[10px] text-deep/50">Respuesta inmediata por WhatsApp</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating WhatsApp Button */}
          <div className="relative">
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full bg-whatsapp animate-ping opacity-20" />
            <motion.button
              onClick={() => setShowMenu(!showMenu)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="relative w-[60px] h-[60px] rounded-full bg-gradient-to-br from-whatsapp to-dark text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
              aria-label="Contactar por WhatsApp"
            >
              <FaWhatsapp className="w-8 h-8" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
