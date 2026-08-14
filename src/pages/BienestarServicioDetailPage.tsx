import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaLaptopHouse } from 'react-icons/fa'
import Accordion from '../components/bienestar/Accordion'
import CitaForm from '../components/bienestar/CitaForm'
import { getServicioBienestar, UBICACION_BIENESTAR, HORARIO_BIENESTAR } from '../data/bienestar'

export default function BienestarServicioDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const location = useLocation()
  const servicio = getServicioBienestar(slug)

  useEffect(() => {
    if (location.hash === '#formulario') {
      const t = window.setTimeout(() => {
        document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => window.clearTimeout(t)
    }
  }, [location.hash])

  if (!servicio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark to-deep">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-white/50 mb-8">Servicio no encontrado</p>
          <Link to="/bienestar">
            <button className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
              Ver Bienestar Estudiantil
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{servicio.title} - Bienestar Estudiantil - Instituto IDEMA</title>
        <meta name="description" content={servicio.resumen} />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <div className="hidden md:block absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/img/bienestar/desktop/BIENESTAR_1.webp')" }} />
        <div className="block md:hidden absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/assets/img/bienestar/mobile/BIENESTAR_2.webp')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/70 via-dark/40 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <Link to="/bienestar" className="text-white/70 hover:text-white text-sm font-semibold mb-4 transition-colors">
            ← Bienestar Estudiantil
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
            <servicio.icon className="text-3xl text-white" aria-hidden="true" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">{servicio.title}</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">{servicio.resumen}</p>

          <a
            href="#formulario"
            className="mt-6 inline-flex items-center justify-center gap-2 px-7 py-3 min-h-[44px] bg-white text-primary font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
          >
            Solicitar cita
          </a>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Intro + ubicación/horario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12 sm:mb-16"
          >
            <p className="text-lg text-deep leading-relaxed mb-8">{servicio.intro}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-deep/10">
                <FaMapMarkerAlt className="text-primary text-lg mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-deep/60 uppercase tracking-wide">Ubicación</p>
                  <p className="text-sm text-deep">{UBICACION_BIENESTAR}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-surface border border-deep/10">
                <FaClock className="text-primary text-lg mt-0.5 flex-shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold text-deep/60 uppercase tracking-wide">Horario</p>
                  <p className="text-sm text-deep">{HORARIO_BIENESTAR}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Áreas de acción (accordion) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-12 sm:mb-16"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-deep mb-2">Áreas de acción</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mb-8" />
            <Accordion areas={servicio.areas} />
          </motion.div>

          {/* Nota modalidad Distancia */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12 sm:mb-16 flex items-start gap-2 justify-center text-center text-sm text-deep/70 max-w-2xl mx-auto"
          >
            <FaLaptopHouse className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              Si estudias en modalidad Distancia, también puedes solicitar esta cita de forma remota completando el
              formulario: coordinaremos la atención por videollamada o teléfono.
            </span>
          </motion.p>

          {/* Formulario de cita */}
          <motion.div
            id="formulario"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="scroll-mt-28 rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-deep p-6 sm:p-10"
          >
            <CitaForm servicios={[{ slug: servicio.slug, title: servicio.title }]} />
          </motion.div>

          {/* Acceso staff */}
          <p className="mt-6 text-center text-sm text-deep/60">
            ¿Sos parte del equipo de Bienestar Estudiantil?{' '}
            <a
              href="https://bienestar.idema.edu.pe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Accedé al panel de solicitudes
            </a>
          </p>
        </div>
      </div>
    </>
  )
}
