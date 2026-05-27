import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaMicroscope, FaBook, FaLightbulb, FaUsers, FaFileAlt, FaAward } from 'react-icons/fa'
import ContactLink from '../components/ui/ContactLink'

export default function InvestigacionPage() {
  const researchLines = [
    {
      icon: FaMicroscope,
      title: 'Tecnología Educativa',
      description: 'Investigación sobre innovación en metodologías de enseñanza y aprendizaje digital.'
    },
    {
      icon: FaLightbulb,
      title: 'Educación Técnica Aplicada',
      description: 'Estudios sobre la aplicación práctica de conocimientos técnicos en la industria.'
    },
    {
      icon: FaUsers,
      title: 'Desarrollo Profesional',
      description: 'Análisis de competencias laborales y desarrollo integral del profesional técnico.'
    },
    {
      icon: FaBook,
      title: 'Currículum Educativo',
      description: 'Diseño y mejora continua de programas académicos alineados con demanda laboral.'
    },
    {
      icon: FaAward,
      title: 'Calidad y Acreditación',
      description: 'Garantía de calidad educativa mediante investigación de estándares internacionales.'
    },
    {
      icon: FaMicroscope,
      title: 'Sostenibilidad',
      description: 'Investigación en educación para el desarrollo sostenible y responsabilidad social.'
    }
  ]

  const publications = [
    { year: 2024, title: 'El Rol de la Educación Técnica en la Transformación Digital', type: 'Artículo Científico' },
    { year: 2023, title: 'Metodologías Activas en la Formación Técnica Profesional', type: 'Estudio de Caso' },
    { year: 2023, title: 'Impacto de la Educación Semipresencial en el Aprendizaje Técnico', type: 'Investigación' },
    { year: 2022, title: 'Competencias Laborales Requeridas en el Sector Tecnológico Actual', type: 'Diagnóstico' },
  ]

  return (
    <>
      <Helmet>
        <title>Investigación e Innovación - Instituto IDEMA</title>
        <meta name="description" content="Centro de investigación e innovación en educación técnica de Instituto IDEMA." />
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Investigación e Innovación</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">Avanzando en la educación técnica a través de la investigación</p>
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
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Nuestro Compromiso con la Investigación</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <p className="text-lg text-deep max-w-3xl mx-auto">
              En IDEMA, la investigación e innovación son fundamentales para mantener nuestros programas actualizados y relevantes. Desarrollamos estudios que contribuyen al avance de la educación técnica superior en Perú y la región.
            </p>
          </motion.div>

          {/* Research Lines */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Líneas de Investigación</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {researchLines.map((line, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ translateY: -10 }}
                  className="bg-gradient-to-br from-surface to-white p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <line.icon className="text-4xl text-primary mb-4" />
                  <h3 className="text-xl font-bold text-deep mb-3">{line.title}</h3>
                  <p className="text-deep">{line.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Recent Publications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Publicaciones Recientes</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="space-y-4">
              {publications.map((pub, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ translateX: 10 }}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 p-6 cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <FaFileAlt className="text-primary text-2xl mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="inline-block px-3 py-1 bg-accent/15 text-deep text-xs font-semibold rounded-full">
                          {pub.year}
                        </span>
                        <span className="inline-block px-3 py-1 bg-primary/15 text-dark text-xs font-semibold rounded-full">
                          {pub.type}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-deep">{pub.title}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Innovation Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20 bg-gradient-to-br from-accent/10 to-cta/10 p-12 rounded-2xl border border-accent/20"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Proyectos de Innovación</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mt-4 mb-8 sm:mb-12" />
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-deep mb-3">Plataforma de Aprendizaje Virtual Avanzada</h3>
                <p className="text-deep mb-3">Desarrollo de una plataforma educativa integrada con inteligencia artificial para personalizar la experiencia de aprendizaje de cada estudiante.</p>
                <div className="w-full bg-deep/15 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
                <p className="text-sm text-deep/80 mt-2">75% completado</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-deep mb-3">Laboratorios Virtuales 3D</h3>
                <p className="text-deep mb-3">Creación de laboratorios virtuales inmersivos para prácticas técnicas seguras y accesibles desde cualquier ubicación.</p>
                <div className="w-full bg-deep/15 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
                <p className="text-sm text-deep/80 mt-2">50% completado</p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-deep mb-3">Sistema de Colocación Laboral Asistido</h3>
                <p className="text-deep mb-3">Herramienta que conecta egresados con oportunidades laborales utilizando análisis de competencias y preferencias.</p>
                <div className="w-full bg-deep/15 rounded-full h-2">
                  <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" style={{ width: '60%' }}></div>
                </div>
                <p className="text-sm text-deep/80 mt-2">60% completado</p>
              </div>
            </div>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary to-dark rounded-2xl p-12 text-white text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Interesado en Nuestras Investigaciones?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Puedes acceder a publicaciones, reportes y datos de investigación. Contáctanos para conocer más sobre nuestro trabajo académico.
            </p>

            <ContactLink>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
              >
                Solicitar Información
              </motion.button>
            </ContactLink>
          </motion.div>
        </div>
      </div>
    </>
  )
}
