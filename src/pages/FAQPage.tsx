import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { FaChevronDown, FaSearch } from 'react-icons/fa'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: 'General' | 'Admisión' | 'Académico' | 'Pagos'
}

const faqItems: FAQItem[] = [
  {
    id: '1',
    category: 'General',
    question: '¿El Instituto cuenta con resoluciones de autorización?',
    answer: 'Sí, desde 1990 contamos con las siguientes resoluciones ministeriales: Nro: 693-91 ED, R.M. 810-94 ED y R.D. Nro. 0765.ED. Así mismo estamos renovando el licenciamiento institucional de acuerdo a las últimas normas legales del Ministerio de Educación.'
  },
  {
    id: '2',
    category: 'General',
    question: '¿Qué otras certificaciones posee?',
    answer: 'El Instituto cuenta con la Certificación Internacional ISO 21001:2018 otorgada por una entidad autorizada.'
  },
  {
    id: '3',
    category: 'Admisión',
    question: '¿Cuáles son los requisitos para estudiar?',
    answer: 'Se requiere: Copia de DNI, Partida de Nacimiento, Certificado de Estudios secundarios, una fotografía y un correo electrónico. También es requisito contar con una computadora o laptop con acceso a internet.'
  },
  {
    id: '4',
    category: 'Admisión',
    question: '¿Cómo me matriculo?',
    answer: 'Completando el Formulario de Inscripción disponible en nuestro sitio web o a través del enlace de inscripción en aprende.instituto-idema.org.'
  },
  {
    id: '5',
    category: 'Pagos',
    question: '¿Dónde realizo los pagos?',
    answer: 'Se realizan en Agentes BCP o a través de la banca móvil de dicho banco, Yape o Plin, o a las cuentas bancarias del Instituto.'
  },
  {
    id: '6',
    category: 'Académico',
    question: '¿Cuándo inician las clases?',
    answer: 'En la modalidad virtual el inicio es inmediato porque no es grupal. En la modalidad Presencial y Semi presencial generalmente es en el mes de Marzo.'
  },
  {
    id: '7',
    category: 'Académico',
    question: '¿Cómo empiezo a estudiar?',
    answer: 'Debes acceder al campus virtual en aprende.instituto-idema.org, identificarte con tu usuario (correo electrónico) y tu contraseña (tu DNI), allí encontrarás tu primer curso. Te recomendamos leer la Guía de Uso.'
  },
  {
    id: '8',
    category: 'Académico',
    question: '¿Cómo se desarrollan las clases?',
    answer: 'En el Campus Virtual encontrarás tus cursos, cada curso contiene varias lecciones en formato PDF, también recursos digitales como libros, videos, tareas y exámenes. Deberás estudiar estos contenidos en la hora que prefieras, el sistema está abierto las 24 horas. También dispones como apoyo nuestra Biblioteca Digital.'
  },
  {
    id: '9',
    category: 'Académico',
    question: '¿En qué momento doy mi examen?',
    answer: 'Tu examen lo debes dar cuando te sientas preparado, pero no debe exceder las 4 semanas, pasado ese tiempo el curso se consideraría como desaprobado.'
  },
  {
    id: '10',
    category: 'Académico',
    question: '¿Cómo se realizan las prácticas?',
    answer: 'Las prácticas se deben hacer en empresas o instituciones públicas o privadas. El Instituto puede asignarte un centro de prácticas, pero también puedes hacer prácticas en el lugar de tu preferencia. Se recomienda desde el primer semestre y debes acumular 1000 horas en los tres años de estudio.'
  },
  {
    id: '11',
    category: 'General',
    question: '¿Cómo protegen mis datos personales?',
    answer: 'En el Instituto IDEMA nos comprometemos a proteger tu información personal. Para conocer en detalle cómo recopilamos, utilizamos y protegemos tus datos, te invitamos a revisar nuestra Política de Privacidad.'
  },
  {
    id: '12',
    category: 'General',
    question: '¿Dónde puedo consultar los términos y condiciones?',
    answer: 'Puedes consultar todos nuestros términos y condiciones de servicio, así como las políticas institucionales en las secciones de Política de Privacidad y Términos y Condiciones de nuestro sitio web.'
  }
]

export default function FAQPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos')
  const [searchTerm, setSearchTerm] = useState('')

  const categories = ['Todos', 'General', 'Admisión', 'Académico', 'Pagos']

  const filteredFAQs = useMemo(() => {
    return faqItems.filter(item => {
      const matchesCategory = selectedCategory === 'Todos' || item.category === selectedCategory
      const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.answer.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [selectedCategory, searchTerm])

  return (
    <>
      <Helmet>
        <title>Preguntas Frecuentes - Instituto IDEMA</title>
        <meta name="description" content="Respuestas a las preguntas más frecuentes sobre admisión, programas, pagos y más en Instituto IDEMA." />
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Preguntas Frecuentes</h1>
          <p className="text-lg md:text-xl text-primary max-w-2xl">Encuentra respuestas a todas tus dudas</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-deep/50 text-lg" />
              <input
                type="text"
                placeholder="Busca una pregunta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-6 py-4 border-2 border-deep/15 rounded-lg focus:outline-none focus:border-primary transition-colors text-lg"
              />
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12 flex flex-wrap gap-3 justify-center"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 rounded-full font-semibold transition-all ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                    : 'bg-surface text-deep hover:bg-surface'
                }`}
              >
                {category}
              </motion.button>
            ))}
          </motion.div>

          {/* FAQ Items */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4"
          >
            <AnimatePresence mode="wait">
              {filteredFAQs.length > 0 ? (
                filteredFAQs.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="border-2 border-deep/10 rounded-lg overflow-hidden hover:border-primary/40 transition-colors"
                  >
                    <motion.button
                      onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-surface hover:bg-surface transition-colors text-left"
                    >
                      <div>
                        <span className="inline-block px-3 py-1 bg-primary/15 text-dark text-xs font-semibold rounded-full mr-4 mb-2">
                          {item.category}
                        </span>
                        <h3 className="text-lg font-semibold text-deep">{item.question}</h3>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedId === item.id ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <FaChevronDown className="text-primary text-xl flex-shrink-0 ml-4" />
                      </motion.div>
                    </motion.button>

                    <AnimatePresence>
                      {expandedId === item.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 py-4 bg-white border-t-2 border-deep/10">
                            <p className="text-deep leading-relaxed">{item.answer}</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <p className="text-xl text-deep/80">No encontramos respuestas para tu búsqueda.</p>
                  <p className="text-deep/70 mt-2">Intenta con otros términos o contacta con nosotros.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-16 bg-gradient-to-r from-primary to-dark rounded-xl p-12 text-white text-center"
          >
            <h2 className="text-3xl font-bold mb-4">¿No encontraste tu respuesta?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Contáctanos directamente. Nuestro equipo está listo para ayudarte con cualquier pregunta.
            </p>

            <a href="/#contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:shadow-lg transition-all duration-300"
              >
                Contactar Ahora
              </motion.button>
            </a>
          </motion.div>
        </div>
      </div>
    </>
  )
}
