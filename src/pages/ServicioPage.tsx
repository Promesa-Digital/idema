import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaArrowRight, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import ContactLink from '../components/ui/ContactLink'

interface Service {
  title: string
  description: string
  fullDescription: string
  benefits: string[]
  features: string[]
}

const services: Record<string, Service> = {
  'certificacion-modular': {
    title: 'Certificación Modular',
    description: 'Reconocimiento de competencias específicas por módulo de aprendizaje',
    fullDescription: 'Nuestro sistema de certificación modular permite a los estudiantes obtener reconocimiento oficial por cada módulo completado. Esto proporciona validación progresiva de competencias y facilita la inserción laboral a medida que avanzan en su formación.',
    benefits: [
      'Reconocimiento oficial de competencias por módulo',
      'Validación laboral progresiva',
      'Flexibilidad en la ruta de aprendizaje',
      'Certificados acumulables hacia diploma final'
    ],
    features: [
      'Evaluación integral por módulo',
      'Certificados digitales y físicos',
      'Validez en el mercado laboral',
      'Reconocimiento nacional e internacional'
    ]
  },
  'certificacion-tecnica': {
    title: 'Certificación Técnica',
    description: 'Diplomas técnicos reconocidos por el MINEDU',
    fullDescription: 'Certificación técnica oficial del Ministerio de Educación que valida la formación completa en carreras técnicas. Nuestros egresados reciben diplomas autorizados que les permiten ejercer profesionalmente en todo el Perú.',
    benefits: [
      'Diploma oficial del MINEDU',
      'Validez legal para ejercer profesión',
      'Reconocimiento en mercado laboral',
      'Oportunidades de especialización'
    ],
    features: [
      'Currículo alineado a estándares nacionales',
      'Evaluación por competencias',
      'Validación de aprendizajes previos',
      'Certificado de especialidad técnica'
    ]
  },
  'chatbot': {
    title: 'Chatbot IDEMA',
    description: 'Asistente virtual inteligente disponible 24/7',
    fullDescription: 'Sistema de inteligencia artificial que proporciona atención al cliente inmediata y personalizada. Resuelve consultas frecuentes, brinda información sobre programas y facilita el proceso de inscripción en cualquier momento.',
    benefits: [
      'Atención disponible 24/7',
      'Respuestas inmediatas a consultas',
      'Información actualizada en tiempo real',
      'Inicio de proceso de inscripción'
    ],
    features: [
      'Procesamiento de lenguaje natural',
      'Integración con base de datos IDEMA',
      'Múltiples idiomas',
      'Escalado a personal cuando sea necesario'
    ]
  },
  'diploma-especializacion': {
    title: 'Diploma de Especialización',
    description: 'Formación avanzada para profesionales en áreas específicas',
    fullDescription: 'Programas de especialización para profesionales que desean profundizar en áreas específicas de su formación. Dirigido a egresados de carreras técnicas y profesionales con experiencia laboral.',
    benefits: [
      'Actualización de competencias profesionales',
      'Enfoque en áreas especializadas',
      'Docentes expertos en la materia',
      'Diploma de especialización reconocido'
    ],
    features: [
      'Modalidad presencial y virtual',
      'Duración de 10 meses',
      'Evaluación por competencias',
      'Prácticas en empresas del sector'
    ]
  },
  'medios-pago': {
    title: 'Medios de Pago',
    description: 'Múltiples opciones de pago seguras y flexibles',
    fullDescription: 'Ofrecemos diversas opciones de pago para facilitar el acceso a nuestra educación de calidad. Desde transferencias bancarias hasta planes de financiamiento sin intereses.',
    benefits: [
      'Múltiples opciones de pago',
      'Planes de financiamiento flexible',
      'Descuentos por pago anticipado',
      'Transacciones seguras y certificadas'
    ],
    features: [
      'Transferencias bancarias',
      'Tarjetas de crédito y débito',
      'Depósitos en caja',
      'Sistema de cuotas sin interés'
    ]
  },
  'orientacion-vocacional': {
    title: 'Orientación Vocacional',
    description: 'Herramienta interactiva para descubrir tu carrera ideal',
    fullDescription: 'Prueba interactiva que ayuda a identificar tus intereses, aptitudes y preferencias profesionales. El sistema recomendará las carreras más adecuadas según tus resultados.',
    benefits: [
      'Descubrimiento de aptitudes personales',
      'Recomendaciones de carrera personalizadas',
      'Información detallada de programas',
      'Asesoría de expertos disponible'
    ],
    features: [
      'Cuestionario de 10 preguntas',
      'Análisis de intereses y aptitudes',
      'Recomendaciones basadas en resultados',
      'Enlaces a información de carreras'
    ]
  }
}

export default function ServicioPage() {
  const { slug } = useParams<{ slug: string }>()
  const service = slug ? services[slug] : null

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark to-deep">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-5xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-deep/50 mb-8">Servicio no encontrado</p>
          <Link to="/">
            <button className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1">
              Volver al Inicio
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <Helmet>
        <title>{service.title} - Instituto IDEMA</title>
        <meta name="description" content={service.description} />
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">{service.title}</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">{service.description}</p>
        </motion.div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-surface py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm text-deep/80">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span>/</span>
          <span className="text-deep font-semibold">{service.title}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Description */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Acerca de Este Servicio</h2>
              <p className="text-lg text-deep/70 max-w-2xl mx-auto">{service.fullDescription}</p>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-16 sm:mb-20">
            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-8 gradient-text">Beneficios</h3>
              <div className="space-y-4">
                {service.benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                  >
                    <FaCheckCircle className="text-primary text-xl mt-1 flex-shrink-0" />
                    <p className="text-deep">{benefit}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Features */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3 className="text-2xl font-bold mb-8 gradient-text">Características</h3>
              <div className="space-y-4">
                {service.features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="flex items-start gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary"
                  >
                    <FaArrowRight className="text-primary text-xl mt-1 flex-shrink-0" />
                    <p className="text-deep">{feature}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary to-dark rounded-2xl p-12 text-white text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Interesado en Este Servicio?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Contáctanos para obtener más información y conocer cómo este servicio puede ayudarte a alcanzar tus objetivos profesionales.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="https://wa.me/?text=Hola,%20me%20interesa%20obtener%20más%20información%20sobre%20el%20servicio%20de%20" target="_blank" rel="noopener noreferrer">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <FaWhatsapp className="text-xl" />
                  Contactar por WhatsApp
                </motion.button>
              </a>

              <ContactLink>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-white/20 border-2 border-white text-white font-bold rounded-full flex items-center gap-2 justify-center hover:bg-white/30 transition-all duration-300"
                >
                  <FaEnvelope className="text-xl" />
                  Solicitar Información
                </motion.button>
              </ContactLink>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
