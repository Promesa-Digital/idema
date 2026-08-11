import { useEffect } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaMapMarkerAlt, FaClock, FaLaptopHouse } from 'react-icons/fa'
import { MdArrowForward } from 'react-icons/md'
import SectionTitle from '../components/ui/SectionTitle'
import CitaForm from '../components/bienestar/CitaForm'
import { serviciosBienestar, UBICACION_BIENESTAR, HORARIO_BIENESTAR } from '../data/bienestar'

export default function BienestarPage() {
  const location = useLocation()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (location.hash === '#formulario') {
      const t = window.setTimeout(() => {
        document.getElementById('formulario')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
      return () => window.clearTimeout(t)
    }
  }, [location.hash])

  return (
    <>
      <Helmet>
        <title>Bienestar Estudiantil - Instituto IDEMA</title>
        <meta
          name="description"
          content="Servicios complementarios de bienestar estudiantil de Instituto IDEMA: servicio médico, servicio social y servicio psicopedagógico. Solicita tu cita."
        />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: "url('/assets/img/hero/desktop/PRINCIPAL_1.jpeg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/85 via-dark/60 to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Bienestar Estudiantil</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">Servicios complementarios para acompañar tu formación</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20 text-center"
          >
            <SectionTitle title="Servicios Complementarios" />
            <p className="text-lg text-deep max-w-3xl mx-auto -mt-6">
              En IDEMA acompañamos a nuestros estudiantes más allá del aula. A través de nuestra área de Bienestar
              Estudiantil ofrecemos servicios de salud, apoyo social y acompañamiento psicopedagógico para que puedas
              formarte en un ambiente seguro e integral.
            </p>
          </motion.div>

          {/* Servicios */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {serviciosBienestar.map((servicio, index) => (
              <motion.div
                key={servicio.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ translateY: -6 }}
                className="flex flex-col bg-gradient-to-br from-surface to-white p-7 sm:p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-dark flex items-center justify-center mb-5">
                  <servicio.icon className="text-2xl text-white" aria-hidden="true" />
                </div>

                <h3 className="text-xl sm:text-2xl font-bold text-deep mb-3">{servicio.title}</h3>
                <p className="text-sm text-deep/90 mb-6 leading-relaxed flex-1">{servicio.resumen}</p>

                <div className="space-y-2 mb-6 pt-4 border-t border-deep/10">
                  <div className="flex items-start gap-2 text-xs text-deep/70">
                    <FaMapMarkerAlt className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{UBICACION_BIENESTAR}</span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-deep/70">
                    <FaClock className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>{HORARIO_BIENESTAR}</span>
                  </div>
                </div>

                <div className="mt-auto flex flex-col gap-2">
                  <Link
                    to={`/bienestar?servicio=${servicio.slug}#formulario`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 min-h-[44px] bg-primary text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
                  >
                    Solicitar cita
                  </Link>
                  <Link
                    to={`/bienestar/${servicio.slug}`}
                    className="group inline-flex items-center justify-center gap-1 px-5 py-2 text-sm font-semibold text-primary hover:gap-2 transition-all"
                  >
                    Ver detalle del servicio
                    <MdArrowForward className="text-base" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Nota modalidad Distancia */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-8 flex items-start gap-2 justify-center text-center text-sm text-deep/70 max-w-2xl mx-auto"
          >
            <FaLaptopHouse className="text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
            <span>
              Si estudias en modalidad Distancia, también puedes solicitar tu cita de forma remota completando el
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
            className="scroll-mt-28 mt-16 sm:mt-20 rounded-2xl overflow-hidden bg-gradient-to-br from-accent to-deep p-6 sm:p-10"
          >
            <CitaForm
              servicios={serviciosBienestar.map(s => ({ slug: s.slug, title: s.title }))}
              defaultServicioSlug={searchParams.get('servicio') ?? undefined}
            />
          </motion.div>
        </div>
      </div>
    </>
  )
}
