import { motion, AnimatePresence } from 'framer-motion'
import { useContext } from 'react'
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'
import { ToastContext } from '../../context/ToastContextType'
import type { Toast } from '../../context/ToastContextType'

const iconMap = {
  success: FaCheck,
  error: FaTimes,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
}

const colorMap = {
  success: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: 'text-primary',
    title: 'text-deep',
    text: 'text-deep',
  },
  error: {
    bg: 'bg-cta/10',
    border: 'border-cta/30',
    icon: 'text-cta',
    title: 'text-deep',
    text: 'text-deep',
  },
  warning: {
    bg: 'bg-accent/10',
    border: 'border-accent/30',
    icon: 'text-accent',
    title: 'text-deep',
    text: 'text-deep',
  },
  info: {
    bg: 'bg-primary/10',
    border: 'border-primary/30',
    icon: 'text-primary',
    title: 'text-deep',
    text: 'text-deep',
  },
}

export default function ToastContainer() {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, removeToast } = context

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => {
          const Icon = iconMap[toast.type]
          const colors = colorMap[toast.type]

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 400 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 400 }}
              transition={{ duration: 0.3 }}
              className={`mb-3 pointer-events-auto ${colors.bg} border ${colors.border} rounded-lg p-4 shadow-lg max-w-sm`}
            >
              <div className="flex gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`} />
                <div className="flex-1">
                  <h3 className={`font-semibold text-sm ${colors.title}`}>{toast.title}</h3>
                  <p className={`text-sm mt-1 ${colors.text}`}>{toast.message}</p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`flex-shrink-0 ${colors.text} hover:opacity-75 transition-opacity`}
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
