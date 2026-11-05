import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { FaTimes } from 'react-icons/fa'
import { listarPopupsPublicos, registrarInteraccionPopup } from '@/services/popupsApi'
import type { PopupPublicoBackend, PopupTipo } from '@/types/backend'

const STORAGE_PREFIX = 'idema:popup:'

interface DisplayPopup {
  id: string
  tipo: PopupTipo
  texto: string
  image: string
  videoUrl: string | null
  enlace: string | null
  pages: string[]
  startDate: string
  endDate: string
  montoDescuento: number | null
  duracionTemporizador: number | null
  textoSuperior: string | null
}

function isWithinRange(popup: DisplayPopup, today: Date): boolean {
  const timestamp = today.getTime()
  const start = new Date(`${popup.startDate}T00:00:00`).getTime()
  const end = new Date(`${popup.endDate}T23:59:59`).getTime()
  return timestamp >= start && timestamp <= end
}

function wasDismissed(popup: DisplayPopup): boolean {
  if (popup.tipo === 'anuncio') return false
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}${popup.id}`) === new Date().toISOString().slice(0, 10)
  } catch {
    return false
  }
}

function markDismissed(popup: DisplayPopup): void {
  if (popup.tipo === 'anuncio') return
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${popup.id}`, new Date().toISOString().slice(0, 10))
  } catch {
    return
  }
}

function normalizePage(page: string): string {
  const value = page.trim()
  if (value === 'home') return '/'
  return value.startsWith('/') ? value : `/${value}`
}

function popupToDisplay(popup: PopupPublicoBackend): DisplayPopup {
  return {
    id: popup.id,
    tipo: popup.tipo,
    texto: popup.texto,
    image: popup.imagen_url,
    videoUrl: popup.video_url,
    enlace: popup.enlace,
    pages: popup.paginas.split(',').map(normalizePage).filter(Boolean),
    startDate: popup.fecha_inicio,
    endDate: popup.fecha_fin,
    montoDescuento: popup.monto_descuento,
    duracionTemporizador: popup.duracion_temporizador,
    textoSuperior: popup.texto_superior,
  }
}

function pickPopup(pathname: string, candidates: DisplayPopup[]): DisplayPopup | null {
  const today = new Date()
  return candidates.find((popup) => (
    popup.pages.includes(pathname) && isWithinRange(popup, today) && !wasDismissed(popup)
  )) ?? null
}

function getVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.slice(1)
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : null
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://www.youtube.com/embed/${id}?autoplay=1&mute=1` : null
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).at(-1)
      return id ? `https://player.vimeo.com/video/${id}?autoplay=1&muted=1` : null
    }
  } catch {
    return null
  }
  return null
}

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export default function AnnouncementModal() {
  const { pathname } = useLocation()
  const [popup, setPopup] = useState<DisplayPopup | null>(null)
  const [open, setOpen] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const prefersReducedMotion = useReducedMotion()
  /**
   * Popups cuya vista ya se contó.
   *
   * En desarrollo StrictMode ejecuta el efecto dos veces, y una vista contada doble
   * falsea justo la métrica para la que existe el registro.
   */
  const vistasContadas = useRef<Set<string>>(new Set())

  /** Registrar la interacción nunca puede romper el popup: si falla, se pierde el dato. */
  const registrar = useCallback(
    (id: string, tipo: 'vista' | 'clic') => {
      void registrarInteraccionPopup(id, tipo, pathname).catch(() => {})
    },
    [pathname],
  )

  useEffect(() => {
    let active = true
    listarPopupsPublicos()
      .then((items) => {
        if (!active) return
        const selected = pickPopup(pathname, items.map(popupToDisplay))
        if (selected?.tipo === 'descuento') {
          setRemainingSeconds(selected.duracionTemporizador ?? 600)
        }
        setPopup(selected)
        setOpen(Boolean(selected))
        if (selected && !vistasContadas.current.has(selected.id)) {
          vistasContadas.current.add(selected.id)
          registrar(selected.id, 'vista')
        }
      })
      .catch(() => {
        if (!active) return
        setPopup(null)
        setOpen(false)
      })
    return () => {
      active = false
    }
  }, [pathname, registrar])

  useEffect(() => {
    if (!open || popup?.tipo !== 'descuento') return
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          markDismissed(popup)
          setOpen(false)
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [open, popup])

  const handleClose = useCallback(() => {
    if (popup) markDismissed(popup)
    setOpen(false)
  }, [popup])

  useEffect(() => {
    if (!open) return
    previouslyFocused.current = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        handleClose()
        return
      }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', onKeyDown)
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 60)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      window.clearTimeout(focusTimer)
      previouslyFocused.current?.focus()
    }
  }, [handleClose, open])

  const titleId = useMemo(() => (popup ? `popup-${popup.id}` : ''), [popup])
  const embedUrl = popup?.videoUrl ? getVideoEmbedUrl(popup.videoUrl) : null

  return (
    <AnimatePresence>
      {open && popup && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button type="button" aria-label="Cerrar popup" onClick={handleClose} className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm" tabIndex={-1} />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 14 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97 }}
            transition={prefersReducedMotion ? { duration: 0.1 } : { type: 'spring', stiffness: 280, damping: 26 }}
            className={`relative z-10 w-full ${popup.tipo === 'descuento' ? 'max-w-3xl' : 'max-w-xl'}`}
          >
            <button ref={closeBtnRef} type="button" onClick={handleClose} aria-label="Cerrar popup" className="absolute -right-2 -top-2 z-20 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-900 shadow-lg transition hover:bg-[var(--color-cta)] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <FaTimes aria-hidden="true" />
            </button>

            {popup.tipo === 'anuncio' ? (
              <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-2xl ring-1 ring-white/10">
                {popup.videoUrl ? (
                  embedUrl ? (
                    <iframe src={embedUrl} title={popup.texto} className="aspect-video w-full" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  ) : (
                    <video src={popup.videoUrl} poster={popup.image} controls autoPlay muted className="max-h-[78dvh] w-full" />
                  )
                ) : (
                  <img src={popup.image} alt={popup.texto} className="max-h-[78dvh] w-full object-contain" fetchPriority="high" />
                )}
              </div>
            ) : (
              <div className="grid max-h-[90dvh] overflow-auto rounded-2xl bg-white shadow-2xl md:grid-cols-[1.05fr_0.95fr]">
                <img src={popup.image} alt={popup.texto} className="h-56 w-full object-cover md:h-full" />
                <div className="flex flex-col justify-center p-6 text-center sm:p-8">
                  <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--color-cta)]">{popup.textoSuperior}</p>
                  <h2 id={titleId} className="text-2xl font-bold text-slate-900 sm:text-3xl">{popup.texto}</h2>
                  {popup.montoDescuento !== null && (
                    <p className="mt-4 text-4xl font-black text-[var(--color-primary)]">S/ {popup.montoDescuento.toFixed(2)}</p>
                  )}
                  <div className="mx-auto mt-5 rounded-xl bg-slate-900 px-5 py-3 text-white">
                    <span className="block text-xs uppercase tracking-widest">La oferta termina en</span>
                    <strong className="font-mono text-3xl">{formatCountdown(remainingSeconds)}</strong>
                  </div>
                </div>
              </div>
            )}

            {popup.tipo === 'anuncio' && <h2 id={titleId} className="sr-only">{popup.texto}</h2>}
            {popup.enlace && (
              <a
                href={popup.enlace}
                target={/^https?:\/\//.test(popup.enlace) ? '_blank' : undefined}
                rel={/^https?:\/\//.test(popup.enlace) ? 'noopener noreferrer' : undefined}
                onClick={() => {
                  // Antes de cerrar y navegar. registrarInteraccionPopup usa keepalive
                  // para que la petición sobreviva al cambio de página.
                  registrar(popup.id, 'clic')
                  handleClose()
                }}
                className="mx-auto mt-4 flex min-h-11 w-fit items-center justify-center rounded-full bg-gradient-to-r from-[var(--color-cta)] to-[var(--color-accent)] px-7 py-3 font-semibold text-white shadow-lg transition hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Ver más
              </a>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
