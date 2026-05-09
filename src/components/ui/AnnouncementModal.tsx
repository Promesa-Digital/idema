import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import { anuncios } from '../../data/anuncios'
import type { Anuncio } from '../../types'

const STORAGE_PREFIX = 'idema:anuncio:'

function isWithinRange(a: Anuncio, today: Date): boolean {
  const t = today.getTime()
  if (a.startDate) {
    const start = new Date(`${a.startDate}T00:00:00`).getTime()
    if (t < start) return false
  }
  if (a.endDate) {
    const end = new Date(`${a.endDate}T23:59:59`).getTime()
    if (t > end) return false
  }
  return true
}

function wasDismissed(a: Anuncio): boolean {
  const key = `${STORAGE_PREFIX}${a.id}`
  const freq = a.frequency ?? 'session'
  if (freq === 'always') return false
  if (freq === 'session') {
    try {
      return sessionStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }
  // 'day' — comparar fecha guardada con hoy
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return false
    const today = new Date().toISOString().slice(0, 10)
    return saved === today
  } catch {
    return false
  }
}

function markDismissed(a: Anuncio) {
  const key = `${STORAGE_PREFIX}${a.id}`
  const freq = a.frequency ?? 'session'
  if (freq === 'always') return
  try {
    if (freq === 'session') {
      sessionStorage.setItem(key, '1')
    } else {
      localStorage.setItem(key, new Date().toISOString().slice(0, 10))
    }
  } catch {
    /* storage bloqueado: ignorar */
  }
}

function pickAnuncio(pathname: string): Anuncio | null {
  const today = new Date()
  for (const a of anuncios) {
    const pages = a.pages ?? ['/']
    if (!pages.includes(pathname)) continue
    if (!isWithinRange(a, today)) continue
    if (wasDismissed(a)) continue
    return a
  }
  return null
}

export default function AnnouncementModal() {
  const { pathname } = useLocation()
  const [anuncio, setAnuncio] = useState<Anuncio | null>(null)
  const [open, setOpen] = useState(false)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()

  // Selección por ruta
  useEffect(() => {
    const match = pickAnuncio(pathname)
    if (match) {
      setAnuncio(match)
      // pequeño delay para que el resto del layout monte primero
      const t = window.setTimeout(() => setOpen(true), 350)
      return () => window.clearTimeout(t)
    }
    setAnuncio(null)
    setOpen(false)
  }, [pathname])

  // Cerrar
  const handleClose = () => {
    if (anuncio) markDismissed(anuncio)
    setOpen(false)
  }

  // ESC + scroll lock + focus management
  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
      } else if (e.key === 'Tab' && dialogRef.current) {
        // Focus trap simple
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
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

    // foco inicial
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 60)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      previouslyFocused.current?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const titleId = useMemo(() => (anuncio ? `anuncio-${anuncio.id}` : ''), [anuncio])

  return (
    <AnimatePresence>
      {open && anuncio && (
        <motion.div
          key="anuncio-overlay"
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          aria-hidden={!open}
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Cerrar anuncio"
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
            tabIndex={-1}
          />

          {/* Dialog */}
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92, y: 16 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 280, damping: 26 }}
            className="relative z-10 w-full max-w-[min(92vw,560px)] max-h-[92dvh] flex flex-col items-center"
          >
            <h2 id={titleId} className="sr-only">
              {anuncio.alt}
            </h2>

            {/* Botón cerrar — siempre visible y con tamaño táctil ≥44px */}
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleClose}
              aria-label="Cerrar anuncio"
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 z-20 grid place-items-center w-11 h-11 rounded-full bg-white text-[var(--color-dark)] shadow-lg ring-1 ring-black/5 transition hover:scale-105 hover:bg-[var(--color-cta)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
            >
              <FaTimes aria-hidden="true" className="text-lg" />
            </button>

            {/* Imagen */}
            <div className="w-full overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 bg-[var(--color-dark)]">
              <img
                src={anuncio.image}
                alt={anuncio.alt}
                className="block w-full h-auto max-h-[80dvh] object-contain select-none"
                draggable={false}
                fetchPriority="high"
              />
            </div>

            {/* CTA opcional */}
            {anuncio.cta && (
              <a
                href={anuncio.cta.href}
                target={anuncio.cta.external ? '_blank' : undefined}
                rel={anuncio.cta.external ? 'noopener noreferrer' : undefined}
                onClick={handleClose}
                className="mt-4 inline-flex items-center justify-center gap-2 px-6 py-3 min-h-[44px] rounded-full font-semibold text-white shadow-lg transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60"
                style={{ background: 'linear-gradient(135deg, var(--color-cta), var(--color-accent))' }}
              >
                {anuncio.cta.label}
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
