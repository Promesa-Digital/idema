import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FiAlertTriangle, FiX } from 'react-icons/fi'
import type { Orden } from '../../types/admin'

interface AnularOrdenModalProps {
  orden: Orden | null
  isSubmitting: boolean
  onCancel: () => void
  onConfirm: (motivo: string) => void
}

const MOTIVO_MIN_LENGTH = 10

export default function AnularOrdenModal({ orden, isSubmitting, onCancel, onConfirm }: AnularOrdenModalProps) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const open = orden !== null

  useEffect(() => {
    if (!open) {
      setMotivo('')
      setError(null)
      return
    }

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancel()
      } else if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => textareaRef.current?.focus(), 60)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      previouslyFocused.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleConfirm = () => {
    const trimmed = motivo.trim()
    if (trimmed.length < MOTIVO_MIN_LENGTH) {
      setError(`Ingresa un motivo de al menos ${MOTIVO_MIN_LENGTH} caracteres.`)
      return
    }
    setError(null)
    onConfirm(trimmed)
  }

  return (
    <AnimatePresence>
      {open && orden && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCancel}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
            tabIndex={-1}
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="anular-orden-title"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 12 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 280, damping: 26 }}
            className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-deep shadow-2xl p-6"
          >
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cerrar"
              disabled={isSubmitting}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition disabled:opacity-50"
            >
              <FiX />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-rose-500/15 border border-rose-400/40 flex items-center justify-center">
                <FiAlertTriangle className="text-rose-300" aria-hidden />
              </div>
              <div>
                <h2 id="anular-orden-title" className="text-lg font-bold text-white">Anular orden</h2>
                <p className="text-sm text-white/60">
                  Orden de <span className="text-white font-semibold">{orden.alumno}</span> — S/. {orden.monto.toFixed(2)}
                </p>
              </div>
            </div>

            <p className="text-sm text-rose-200 bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2.5 mb-4">
              Esta acción no genera ningún reembolso automático. Si el alumno ya pagó, coordina la devolución por
              otro medio antes de continuar.
            </p>

            <label htmlFor="anular-orden-motivo" className="block text-white text-sm font-semibold mb-2">
              Motivo de anulación
            </label>
            <textarea
              ref={textareaRef}
              id="anular-orden-motivo"
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value)
                setError(null)
              }}
              disabled={isSubmitting}
              rows={3}
              placeholder="Ej. Duplicado, pago rechazado por el banco, solicitud del alumno..."
              aria-invalid={!!error}
              aria-describedby={error ? 'anular-orden-motivo-err' : undefined}
              className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 resize-none ${
                error ? 'ring-2 ring-rose-400' : ''
              }`}
            />
            {error && (
              <p id="anular-orden-motivo-err" className="mt-1.5 ml-1 text-[11px] font-medium text-rose-200">
                {error}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white/80 hover:bg-white/10 transition disabled:opacity-50"
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-rose-500 text-white hover:bg-rose-600 transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && (
                  <span className="inline-block w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
                )}
                {isSubmitting ? 'Anulando...' : 'Anular orden (sin reembolso)'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
