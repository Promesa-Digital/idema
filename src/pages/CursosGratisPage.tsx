import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaVideo, FaBook, FaUsers, FaCertificate, FaArrowRight } from 'react-icons/fa'

interface FreeCourse {
  id: string
  title: string
  description: string
  duration: string
  level: string
  instructor: string
  students: number
  icon: React.ComponentType<any>
}

const freeCourses: FreeCourse[] = [
  {
    id: '1',
    title: 'Introducción a la Contabilidad',
    description: 'Conceptos básicos de contabilidad, registro de transacciones y elaboración de reportes financieros.',
    duration: '4 semanas',
    level: 'Principiante',
    instructor: 'Lic. Carlos Mendoza',
    students: 1250,
    icon: FaBook
  },
  {
    id: '2',
    title: 'Primeros Auxilios Básicos',
    description: 'Técnicas esenciales de primeros auxilios para situaciones de emergencia. Certificado oficial incluido.',
    duration: '3 semanas',
    level: 'Principiante',
    instructor: 'Dra. María García',
    students: 980,
    icon: FaUsers
  },
  {
    id: '3',
    title: 'Excel Nivel Básico',
    description: 'Funciones básicas de Excel, fórmulas y creación de gráficos para análisis de datos.',
    duration: '4 semanas',
    level: 'Principiante',
    instructor: 'Ing. Juan López',
    students: 2100,
    icon: FaBook
  },
  {
    id: '4',
    title: 'Comunicación Efectiva',
    description: 'Herramientas para mejorar tu comunicación verbal y escrita en ambiente profesional.',
    duration: '3 semanas',
    level: 'Principiante',
    instructor: 'Lic. Patricia Flores',
    students: 750,
    icon: FaUsers
  },
  {
    id: '5',
    title: 'Introducción a la Agricultura',
    description: 'Conceptos básicos de cultivos, riego y manejo de plagas de forma ecológica.',
    duration: '5 semanas',
    level: 'Principiante',
    instructor: 'Ing. Agr. Luis Ramírez',
    students: 620,
    icon: FaBook
  },
  {
    id: '6',
    title: 'Seguridad e Higiene Laboral',
    description: 'Normas de seguridad, prevención de accidentes y protección en el trabajo.',
    duration: '3 semanas',
    level: 'Principiante',
    instructor: 'Ing. Sgs. Carlos Velásquez',
    students: 890,
    icon: FaBook
  }
]

export default function CursosGratisPage() {
  return (
    <>
      <Helmet>
        <title>Cursos Gratuitos - Instituto IDEMA</title>
        <meta name="description" content="Accede a cursos gratuitos en línea ofrecidos por Instituto IDEMA. Formación de calidad sin costo." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden bg-gradient-to-br from-dark to-deep">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Cursos Gratuitos</h1>
          <p className="text-lg md:text-xl text-primary max-w-2xl">Acceso libre a educación de calidad en diversas áreas</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          {/* Introduction */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-16 text-center"
          >
            <h2 className="text-4xl font-bold mb-6 gradient-text">Educación Accesible para Todos</h2>
            <p className="text-lg text-deep max-w-3xl mx-auto">
              En IDEMA creemos que la educación de calidad debe ser accesible. Por eso ofrecemos una variedad de cursos completamente gratuitos en línea para que puedas adquirir nuevas habilidades sin costo alguno.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              whileHover={{ translateY: -10 }}
              className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 rounded-xl border-2 border-primary/30"
            >
              <FaVideo className="text-4xl text-primary mb-4" />
              <h3 className="text-xl font-bold text-deep mb-3">100% En Línea</h3>
              <p className="text-deep">Accede desde cualquier dispositivo en tu horario disponible.</p>
            </motion.div>

            <motion.div
              whileHover={{ translateY: -10 }}
              className="bg-gradient-to-br from-accent/10 to-cta/10 p-8 rounded-xl border-2 border-accent/20"
            >
              <FaCertificate className="text-4xl text-accent mb-4" />
              <h3 className="text-xl font-bold text-deep mb-3">Certificado Incluido</h3>
              <p className="text-deep">Recibe un certificado al completar el curso exitosamente.</p>
            </motion.div>

            <motion.div
              whileHover={{ translateY: -10 }}
              className="bg-gradient-to-br from-cta/10 to-accent/10 p-8 rounded-xl border-2 border-cta/20"
            >
              <FaUsers className="text-4xl text-cta mb-4" />
              <h3 className="text-xl font-bold text-deep mb-3">Comunidad Activa</h3>
              <p className="text-deep">Interactúa con instructores y compañeros de aprendizaje.</p>
            </motion.div>
          </motion.div>

          {/* Courses Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-12 text-center gradient-text">Cursos Disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {freeCourses.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ translateY: -10 }}
                  className="bg-white border-2 border-deep/10 rounded-xl overflow-hidden hover:border-primary/40 transition-all shadow-lg hover:shadow-xl"
                >
                  <div className="bg-gradient-to-br from-primary to-accent p-6 text-white h-32 flex items-center justify-center">
                    <course.icon className="text-5xl opacity-80" />
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-bold text-deep mb-2">{course.title}</h3>
                    <p className="text-deep text-sm mb-4">{course.description}</p>

                    <div className="space-y-2 mb-6 text-sm text-deep/80">
                      <div className="flex justify-between">
                        <span>Duración:</span>
                        <span className="font-semibold">{course.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Nivel:</span>
                        <span className="font-semibold text-primary">{course.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Instructor:</span>
                        <span className="font-semibold">{course.instructor}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Estudiantes:</span>
                        <span className="font-semibold">{course.students.toLocaleString()}</span>
                      </div>
                    </div>

                    <a href="https://aprende.instituto-idema.org/" target="_blank" rel="noopener noreferrer">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full px-4 py-2 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-lg flex items-center justify-center gap-2 hover:shadow-lg transition-all duration-300"
                      >
                        Ver Curso
                        <FaArrowRight className="text-sm" />
                      </motion.button>
                    </a>
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
            className="bg-gradient-to-r from-primary to-dark rounded-xl p-12 text-white text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Listo para Aprender?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Accede ahora al Campus Virtual de IDEMA y comienza tu aprendizaje sin costo alguno. Cientos de estudiantes ya se están beneficiando de nuestros cursos gratuitos.
            </p>

            <a href="https://aprende.instituto-idema.org/" target="_blank" rel="noopener noreferrer">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:shadow-lg transition-all duration-300"
              >
                Acceder al Campus Virtual
              </motion.button>
            </a>
          </motion.div>
        </div>
      </div>
    </>
  )
}
