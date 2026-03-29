import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa'

// This component needs to be integrated with your toast context
// For now, we'll create a standalone version that listens to the useToast hook

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

interface ToastContainerProps {
  toasts?: Toast[]
  onRemove?: (id: string) => void
}

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

// Context to store and manage toasts globally
import React, { createContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: Toast['type'], title: string, message: string) => void
  removeToast: (id: string) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let toastId = 0

  const addToast = useCallback((type: Toast['type'], title: string, message: string) => {
    const id = String(++toastId)
    const toast: Toast = { id, type, title, message }
    setToasts(prev => [...prev, toast])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainerComponent />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider')
  }
  return context
}

function ToastContainerComponent() {
  const context = React.useContext(ToastContext)
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

// Default export for standalone usage without provider
export default function ToastContainer({ toasts = [], onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null

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
                  onClick={() => onRemove?.(toast.id)}
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
