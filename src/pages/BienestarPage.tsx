import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaStethoscope, FaHandsHelping, FaBrain } from 'react-icons/fa'
import ContactLink from '../components/ui/ContactLink'
import SectionTitle from '../components/ui/SectionTitle'

const servicios = [
  {
    id: 'servicio-medico',
    icon: FaStethoscope,
    title: 'Servicio Médico (Tópico)',
    description:
      'Atención de primeros auxilios y orientación en salud básica para toda la comunidad estudiantil, brindando un espacio seguro dentro del campus.',
    items: [
      'Atención de emergencias y primeros auxilios',
      'Orientación en salud preventiva',
      'Derivación oportuna a centros de salud',
      'Seguimiento de casos de salud del estudiante',
    ],
  },
  {
    id: 'servicio-social',
    icon: FaHandsHelping,
    title: 'Servicio Social',
    description:
      'Acompañamiento a estudiantes y sus familias para identificar necesidades sociales y facilitar el acceso a recursos de apoyo.',
    items: [
      'Evaluación y seguimiento socioeconómico',
      'Orientación sobre becas y beneficios',
      'Mediación en situaciones familiares o personales',
      'Articulación con redes de apoyo comunitario',
    ],
  },
  {
    id: 'servicio-psicopedagogico',
    icon: FaBrain,
    title: 'Servicio Psicopedagógico',
    description:
      'Soporte emocional y académico para fortalecer el bienestar psicológico y el desempeño de los estudiantes durante su formación.',
    items: [
      'Orientación y consejería psicológica',
      'Estrategias de aprendizaje y hábitos de estudio',
      'Prevención de la deserción académica',
      'Talleres de habilidades socioemocionales',
    ],
  },
]

export default function BienestarPage() {
  return (
    <>
      <Helmet>
        <title>Bienestar Estudiantil - Instituto IDEMA</title>
        <meta
          name="description"
          content="Servicios complementarios de bienestar estudiantil de Instituto IDEMA: servicio médico, servicio social y servicio psicopedagógico."
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
          <div className="space-y-16 sm:space-y-20">
            {servicios.map((servicio, index) => (
              <motion.div
                key={servicio.id}
                id={servicio.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="scroll-mt-28 bg-gradient-to-br from-surface to-white p-8 sm:p-10 rounded-2xl border border-deep/10 hover:border-primary/30 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-dark flex items-center justify-center">
                      <servicio.icon className="text-3xl text-white" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl sm:text-3xl font-bold text-deep mb-3">{servicio.title}</h3>
                    <p className="text-deep/90 mb-5">{servicio.description}</p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      {servicio.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-deep/80">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 sm:mt-20 bg-gradient-to-r from-primary to-dark rounded-2xl p-12 text-white text-center"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">¿Necesitas apoyo?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Nuestro equipo de bienestar estudiantil está para acompañarte. Contáctanos y te orientaremos con el
              servicio que necesites.
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
