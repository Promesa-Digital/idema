import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion, AnimatePresence } from 'framer-motion'
import { FaArrowRight, FaCheckCircle, FaLink } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { carreras } from '../data/programs/carreras'

interface Question {
  id: number
  text: string
  answers: {
    text: string
    careers: string[]
  }[]
}

const questions: Question[] = [
  {
    id: 1,
    text: '¿Cuál de estas áreas te atrae más?',
    answers: [
      { text: 'Naturaleza y animales', careers: ['agropecuaria', 'veterinaria', 'agronomia'] },
      { text: 'Salud y cuidado de personas', careers: ['enfermeria', 'farmacia'] },
      { text: 'Negocios y dinero', careers: ['administracion', 'contabilidad', 'administracion-bancaria'] },
      { text: 'Tecnología e innovación', careers: ['administracion', 'contabilidad'] }
    ]
  },
  {
    id: 2,
    text: '¿Prefieres trabajar principalmente con...?',
    answers: [
      { text: 'Personas', careers: ['enfermeria', 'farmacia', 'administracion', 'administracion-bancaria'] },
      { text: 'Números y datos', careers: ['contabilidad', 'administracion-bancaria', 'administracion'] },
      { text: 'Plantas y animales', careers: ['agropecuaria', 'veterinaria', 'agronomia'] },
      { text: 'Maquinaria y herramientas', careers: ['agropecuaria', 'administracion'] }
    ]
  },
  {
    id: 3,
    text: '¿Cuál es tu nivel de educación actual?',
    answers: [
      { text: 'Secundaria completa', careers: carreras.map(c => c.slug) },
      { text: 'Estudios técnicos previos', careers: carreras.map(c => c.slug) },
      { text: 'Experiencia laboral', careers: carreras.map(c => c.slug) },
      { text: 'En búsqueda de especialización', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 4,
    text: '¿Qué tipo de aprendizaje prefieres?',
    answers: [
      { text: 'Presencial con prácticas', careers: carreras.map(c => c.slug) },
      { text: 'Semipresencial flexible', careers: carreras.map(c => c.slug) },
      { text: 'Virtual desde casa', careers: carreras.map(c => c.slug) },
      { text: 'Mixta según necesidad', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 5,
    text: '¿Cuánto tiempo puedes dedicar a estudiar?',
    answers: [
      { text: 'Medio tiempo (3 años)', careers: ['agropecuaria', 'enfermeria', 'contabilidad', 'administracion', 'administracion-bancaria'] },
      { text: 'Tiempo completo', careers: carreras.map(c => c.slug) },
      { text: 'Solo fines de semana', careers: carreras.map(c => c.slug) },
      { text: 'Cursos cortos (4 semanas)', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 6,
    text: '¿Te interesa tener contacto directo con clientes o público?',
    answers: [
      { text: 'Sí, me encanta interactuar', careers: ['enfermeria', 'farmacia', 'administracion', 'administracion-bancaria'] },
      { text: 'A veces está bien', careers: carreras.map(c => c.slug) },
      { text: 'Prefiero trabajo más técnico', careers: ['agropecuaria', 'contabilidad', 'administracion'] },
      { text: 'No tengo preferencia', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 7,
    text: '¿Cuál es tu expectativa salarial?',
    answers: [
      { text: 'Moderada (para empezar)', careers: carreras.map(c => c.slug) },
      { text: 'Media a alta', careers: ['contabilidad', 'administracion', 'administracion-bancaria', 'enfermeria'] },
      { text: 'Alto potencial de crecimiento', careers: ['administracion', 'administracion-bancaria'] },
      { text: 'Vocacional (no es prioridad)', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 8,
    text: '¿Visualizas tu carrera en...',
    answers: [
      { text: 'Sector privado empresarial', careers: ['administracion', 'administracion-bancaria', 'contabilidad'] },
      { text: 'Sector salud', careers: ['enfermeria', 'farmacia'] },
      { text: 'Sector agrícola y ganadero', careers: ['agropecuaria', 'veterinaria', 'agronomia'] },
      { text: 'Emprendimiento propio', careers: ['administracion', 'agropecuaria', 'contabilidad'] }
    ]
  },
  {
    id: 9,
    text: '¿Te interesa la investigación y desarrollo?',
    answers: [
      { text: 'Mucho', careers: ['agropecuaria', 'farmacia', 'administracion'] },
      { text: 'Algo', careers: carreras.map(c => c.slug) },
      { text: 'Poco', careers: ['administracion-bancaria', 'enfermeria'] },
      { text: 'No me atrae', careers: carreras.map(c => c.slug) }
    ]
  },
  {
    id: 10,
    text: '¿Qué te motivaría más en tu carrera?',
    answers: [
      { text: 'Ayudar a otras personas', careers: ['enfermeria', 'farmacia', 'administracion'] },
      { text: 'Resolver problemas complejos', careers: ['contabilidad', 'administracion-bancaria', 'agropecuaria'] },
      { text: 'Generar ingresos y éxito económico', careers: ['administracion', 'administracion-bancaria', 'contabilidad'] },
      { text: 'Estar en contacto con la naturaleza', careers: ['agropecuaria', 'veterinaria', 'agronomia'] }
    ]
  }
]

export default function OrientacionVocacionalPage() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [scores, setScores] = useState<Record<string, number>>({})
  const [showResults, setShowResults] = useState(false)

  const getTopCareer = () => {
    if (Object.keys(scores).length === 0) return null
    return Object.entries(scores)
      .sort(([, a], [, b]) => b - a)[0][0]
  }

  const handleAnswer = (careerSlugs: string[]) => {
    const newScores = { ...scores }
    careerSlugs.forEach(slug => {
      newScores[slug] = (newScores[slug] || 0) + 1
    })
    setScores(newScores)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      setShowResults(true)
    }
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setScores({})
    setShowResults(false)
  }

  const topCareer = getTopCareer()
  const topCareerData = topCareer ? carreras.find(c => c.slug === topCareer) : null

  return (
    <>
      <Helmet>
        <title>Orientación Vocacional - Instituto IDEMA</title>
        <meta name="description" content="Prueba interactiva de orientación vocacional para descubrir tu carrera ideal en Instituto IDEMA." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-80 md:h-96 overflow-hidden bg-gradient-to-br from-dark to-deep">
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
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Orientación Vocacional</h1>
          <p className="text-sm md:text-base text-primary">Descubre tu carrera ideal</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <AnimatePresence mode="wait">
            {!showResults ? (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Progress Bar */}
                <div className="mb-12">
                  <div className="flex justify-between mb-4">
                    <span className="text-sm font-semibold text-deep">Pregunta {currentQuestion + 1} de {questions.length}</span>
                    <span className="text-sm font-semibold text-primary">{Math.round(((currentQuestion + 1) / questions.length) * 100)}%</span>
                  </div>
                  <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-gradient-to-r from-primary to-accent h-full rounded-full"
                    ></motion.div>
                  </div>
                </div>

                {/* Current Question */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className="mb-12"
                >
                  <h2 className="text-3xl font-bold text-deep mb-8 text-center">
                    {questions[currentQuestion].text}
                  </h2>

                  <div className="space-y-4">
                    {questions[currentQuestion].answers.map((answer, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02, x: 10 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleAnswer(answer.careers)}
                        className="w-full p-6 bg-gradient-to-r from-surface to-white border-2 border-deep/10 rounded-xl text-left font-semibold text-deep hover:border-primary hover:bg-primary/10 transition-all duration-300"
                      >
                        {answer.text}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {/* Results */}
                <div className="text-center mb-12">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white text-5xl font-bold mx-auto mb-6"
                  >
                    <FaCheckCircle />
                  </motion.div>

                  <h2 className="text-4xl font-bold text-deep mb-4">¡Listo!</h2>
                  <p className="text-lg text-deep mb-8">
                    Basado en tus respuestas, hemos identificado la carrera que mejor se ajusta a tus intereses y aptitudes.
                  </p>
                </div>

                {/* Recommended Career */}
                {topCareerData && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/40 rounded-xl p-12 mb-12 text-center"
                  >
                    <h3 className="text-3xl font-bold gradient-text mb-4">{topCareerData.title}</h3>
                    <p className="text-deep mb-6 text-lg">{topCareerData.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <p className="text-deep/80 font-semibold">Duración</p>
                        <p className="text-2xl text-primary font-bold">{topCareerData.duration}</p>
                      </div>
                      <div>
                        <p className="text-deep/80 font-semibold">Modalidad</p>
                        <p className="text-2xl text-primary font-bold">{topCareerData.modality}</p>
                      </div>
                    </div>

                    <Link to={`/carreras/${topCareerData.slug}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full flex items-center gap-2 justify-center hover:shadow-lg transition-all duration-300 mx-auto mb-4"
                      >
                        Ver Detalles de la Carrera
                        <FaArrowRight />
                      </motion.button>
                    </Link>
                  </motion.div>
                )}

                {/* Other Recommendations */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mb-12"
                >
                  <h4 className="text-2xl font-bold text-deep mb-6">También te podrían interesar:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(scores)
                      .sort(([, a], [, b]) => b - a)
                      .slice(1, 3)
                      .map(([slug]) => {
                        const career = carreras.find(c => c.slug === slug)
                        return career ? (
                          <Link key={slug} to={`/carreras/${slug}`}>
                            <motion.div
                              whileHover={{ translateY: -5 }}
                              className="bg-white border-2 border-deep/10 rounded-lg p-4 hover:border-primary/40 transition-all cursor-pointer"
                            >
                              <h5 className="font-bold text-deep mb-2">{career.title}</h5>
                              <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                                Explorar <FaLink />
                              </div>
                            </motion.div>
                          </Link>
                        ) : null
                      })}
                  </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-gradient-to-r from-primary to-dark rounded-xl p-8 text-white text-center mb-8"
                >
                  <h4 className="text-2xl font-bold mb-3">¿Listo para comenzar?</h4>
                  <p className="mb-6">Contáctanos para más información sobre tu carrera recomendada</p>
                  <a href="/#contacto">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-white text-primary font-bold rounded-full hover:shadow-lg transition-all duration-300"
                    >
                      Solicitar Información
                    </motion.button>
                  </a>
                </motion.div>

                {/* Reset Button */}
                <div className="text-center">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={resetQuiz}
                    className="px-8 py-3 border-2 border-deep/30 text-deep font-bold rounded-full hover:border-deep/50 transition-all duration-300"
                  >
                    Hacer la Prueba de Nuevo
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
