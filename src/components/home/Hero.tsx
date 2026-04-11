import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi'
import { theme } from '@/theme'

const slides = [
  {
    desktop: '/assets/img/hero/desktop/PRINCIPAL_1.webp',
    mobile:  '/assets/img/hero/mobile/PRINCIPAL_2.webp',
    titulo:    'Instituto IDEMA',
    subtitulo: 'Más de 30 años transformando la educación técnica en el Perú',
    cta:       'Conoce nuestros programas',
    ctaLink:   '/programas',
  },
  {
    desktop: '/assets/img/hero/desktop/ADMI_EMPRESAS_1.webp',
    mobile:  '/assets/img/hero/mobile/ADMI_EMPRESAS_2.webp',
    titulo:    'Administración de Empresas',
    subtitulo: 'Lidera el mundo empresarial con formación de calidad',
    cta:       'Ver carrera',
    ctaLink:   '/carreras/administracion',
  },
  {
    desktop: '/assets/img/hero/desktop/AGROPECUARIA_1.webp',
    mobile:  '/assets/img/hero/mobile/AGROPECUARIA_2.webp',
    titulo:    'Agropecuaria',
    subtitulo: 'Impulsa el desarrollo agrícola con tecnología moderna',
    cta:       'Ver carrera',
    ctaLink:   '/carreras/agropecuaria',
  },
  {
    desktop: '/assets/img/hero/desktop/CONTABILIDAD_1.webp',
    mobile:  '/assets/img/hero/mobile/CONTABILIDAD_2.webp',
    titulo:    'Contabilidad',
    subtitulo: 'Domina las finanzas y la gestión contable profesional',
    cta:       'Ver carrera',
    ctaLink:   '/carreras/contabilidad',
  },
  {
    desktop: '/assets/img/hero/desktop/ENFERMERIA_1.webp',
    mobile:  '/assets/img/hero/mobile/ENFERMERIA_2.webp',
    titulo:    'Enfermería Técnica',
    subtitulo: 'Forma parte del equipo de salud que el Perú necesita',
    cta:       'Ver carrera',
    ctaLink:   '/carreras/enfermeria',
  },
]

const INTERVAL = 5000
const PAUSE_AFTER_MANUAL = 3000

export default function Hero() {
  const [current, setCurrent] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pauseRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    setIsMobile(mq.matches)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const startAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length)
    }, INTERVAL)
  }, [])

  useEffect(() => {
    startAutoplay()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (pauseRef.current) clearTimeout(pauseRef.current)
    }
  }, [startAutoplay])

  const goTo = useCallback((index: number) => {
    setCurrent(index)
    if (timerRef.current) clearInterval(timerRef.current)
    if (pauseRef.current) clearTimeout(pauseRef.current)
    pauseRef.current = setTimeout(startAutoplay, PAUSE_AFTER_MANUAL)
  }, [startAutoplay])

  const prev = () => goTo((current - 1 + slides.length) % slides.length)
  const next = () => goTo((current + 1) % slides.length)

  const scrollDown = () => {
    const hero = document.getElementById('hero')
    if (hero) {
      const nextSection = hero.nextElementSibling as HTMLElement | null
      nextSection?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const slide = slides[current]
  const images = isMobile
    ? slides.map((s) => s.mobile)
    : slides.map((s) => s.desktop)

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background slider */}
      <AnimatePresence mode="popLayout">
        <motion.img
          key={current}
          src={images[current]}
          alt={slide.titulo}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full object-cover"
          loading={current === 0 ? 'eager' : 'lazy'}
        />
      </AnimatePresence>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-dark/85 via-dark/60 to-transparent" />

      {/* Content panel */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Left panel - slide content */}
          <div className="w-full md:w-1/2 flex flex-col bg-primary/25 p-6 rounded-2xl justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              >
                <h1
                  className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
                  style={{ textShadow: `0 2px 20px ${theme.colors.dark}` }}
                >
                  {slide.titulo}
                </h1>
                <p className="font-body text-lg sm:text-xl text-white/80 mb-8 max-w-lg">
                  {slide.subtitulo}
                </p>
                <a
                  href={slide.ctaLink}
                  className="inline-block bg-primary hover:bg-primary/90 text-white font-subheading font-bold px-8 py-4 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/30 text-lg"
                >
                  {slide.cta}
                </a>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        aria-label="Slide anterior"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-primary transition-colors duration-300"
      >
        <FiChevronLeft className="text-2xl" />
      </button>
      <button
        onClick={next}
        aria-label="Siguiente slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-black/30 text-white flex items-center justify-center hover:bg-primary transition-colors duration-300"
      >
        <FiChevronRight className="text-2xl" />
      </button>

      {/* Dots indicator */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goTo(index)}
            aria-label={`Ir a slide ${index + 1}`}
            className={`rounded-full transition-all duration-300 ${
              index === current
                ? 'w-8 h-3 bg-primary'
                : 'w-3 h-3 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* Scroll down arrow */}
      <button
        onClick={scrollDown}
        aria-label="Ir a la siguiente sección"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-primary animate-bounce"
      >
        <FiChevronDown className="text-4xl" />
      </button>
    </section>
  )
}
