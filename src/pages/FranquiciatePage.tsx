import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaLightbulb, FaUsers, FaChartBar, FaHandshake, FaPhone } from 'react-icons/fa'
import ContactLink from '../components/ui/ContactLink'

export default function FranquiciatePage() {
  const benefits = [
    { icon: FaLightbulb, title: 'Modelo Probado', description: 'Sistema educativo validado con 30 años de experiencia exitosa.' },
    { icon: FaUsers, title: 'Reconocimiento de Marca', description: 'Aprovechar la reputación establecida de IDEMA en la región.' },
    { icon: FaChartBar, title: 'Crecimiento Sostenible', description: 'Modelo de negocio rentable y escalable para el largo plazo.' },
    { icon: FaHandshake, title: 'Soporte Continuo', description: 'Capacitación, asesoría y soporte administrativo permanente.' },
  ]

  const requirements = [
    'Capital inicial para infraestructura y equipamiento educativo',
    'Experiencia en gestión empresarial o educativa',
    'Compromiso con la calidad educativa',
    'Ubicación estratégica en zona con demanda educativa',
    'Equipo administrativo y docente capacitado',
    'Cumplimiento de estándares de calidad IDEMA'
  ]

  const steps = [
    { number: '1', title: 'Consulta Inicial', description: 'Conversación para evaluar tu perfil y disponibilidad' },
    { number: '2', title: 'Análisis de Mercado', description: 'Estudio de viabilidad en tu zona geográfica' },
    { number: '3', title: 'Propuesta Comercial', description: 'Presentación de términos y condiciones' },
    { number: '4', title: 'Capacitación', description: 'Programa de entrenamiento integral' },
    { number: '5', title: 'Implementación', description: 'Lanzamiento de tu franquicia IDEMA' },
    { number: '6', title: 'Operación', description: 'Soporte continuo y seguimiento' }
  ]

  return (
    <>
      <Helmet>
        <title>Franquicia IDEMA - Oportunidad de Negocio</title>
        <meta name="description" content="Únete como franquicia de IDEMA. Modelo educativo probado con 30 años de experiencia. Soporte completo para tu éxito." />
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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Franquíciate con IDEMA</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">Oportunidad de crecimiento empresarial con modelo educativo probado</p>
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
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">¿Por Qué Invertir en una Franquicia IDEMA?</h2>
              <p className="text-lg text-deep/70 max-w-2xl mx-auto">
                IDEMA te ofrece la oportunidad de ser parte de una institución educativa reconocida, con un modelo de negocio comprobado y el respaldo de tres décadas de experiencia en educación técnica de calidad.
              </p>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
          </motion.div>

          {/* Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Beneficios de una Franquicia IDEMA</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ translateY: -10 }}
                  className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
                >
                  <benefit.icon className="text-4xl text-primary mb-4" />
                  <h3 className="text-xl font-bold text-deep mb-3">{benefit.title}</h3>
                  <p className="text-deep">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Requirements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20 bg-gradient-to-br from-primary/10 to-accent/10 p-12 rounded-2xl border-2 border-primary/30"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Requisitos para Ser Franquiciante</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mt-4 mb-8 sm:mb-12" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              {requirements.map((requirement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <FaCheckCircle className="text-primary text-2xl mt-1 flex-shrink-0" />
                  <p className="text-deep">{requirement}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Process Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 sm:mb-20"
          >
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 gradient-text">Proceso de Franquicia</h2>
              <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="relative"
                >
                  <div className="bg-white/80 backdrop-blur-sm border border-deep/10 hover:border-primary/30 hover:shadow-xl rounded-2xl p-8 h-full transition-all duration-300">
                    <div className="absolute -top-5 -left-5 w-14 h-14 bg-gradient-to-br from-primary to-accent text-white font-bold text-2xl rounded-full flex items-center justify-center shadow-lg">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-bold text-deep mb-3 mt-2">{step.title}</h3>
                    <p className="text-deep">{step.description}</p>
                  </div>
                </motion.div>
              ))}
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
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Interesado en la Franquicia?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Contáctanos para conocer más detalles sobre esta oportunidad de negocio y cómo puedes ser parte del crecimiento de IDEMA.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="tel:+51951361224" className="inline-block">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white text-primary font-bold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <FaPhone className="text-xl" />
                  Llamar Ahora
                </motion.button>
              </a>

              <ContactLink>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-white/20 border-2 border-white text-white font-bold rounded-full hover:bg-white/30 transition-all duration-300"
                >
                  Solicitar Propuesta
                </motion.button>
              </ContactLink>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
