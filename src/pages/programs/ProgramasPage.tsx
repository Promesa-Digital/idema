import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaGraduationCap, FaBook, FaCertificate, FaLaptop } from 'react-icons/fa'
import { carreras } from '../../data/programs/carreras'
import { auxiliares } from '../../data/programs/auxiliares'
import { especializaciones } from '../../data/programs/especializaciones'
import { cursos } from '../../data/programs/cursos'
import ProgramCard from '../../components/ui/ProgramCard'
import type { Carrera } from '../../types'

const categories = [
  { key: 'todos', label: 'Todos' },
  { key: 'carrera', label: 'Carreras Técnicas' },
  { key: 'auxiliar', label: 'Programas Auxiliares' },
  { key: 'especializacion', label: 'Especializaciones' },
  { key: 'curso', label: 'Cursos Cortos' },
] as const

const categoryBasePath: Record<string, string> = {
  carrera: '/carreras',
  auxiliar: '/auxiliares',
  especializacion: '/especializaciones',
  curso: '/cursos',
}

const allPrograms: Carrera[] = [
  ...carreras,
  ...auxiliares,
  ...especializaciones,
  ...cursos,
]

const learningPath = [
  {
    icon: FaGraduationCap,
    color: 'bg-accent',
    title: 'Formación Técnica Base',
    description: 'Carreras técnicas de 3 años con título a nombre de la nación',
  },
  {
    icon: FaCertificate,
    color: 'bg-accent',
    title: 'Programas Auxiliares',
    description: 'Formación rápida de 10 meses con certificado MINEDU',
  },
  {
    icon: FaBook,
    color: 'bg-cta',
    title: 'Especializaciones',
    description: 'Diplomados de 10 meses para profesionales con experiencia',
  },
  {
    icon: FaLaptop,
    color: 'bg-primary',
    title: 'Cursos Cortos',
    description: 'Capacitaciones de 4 semanas 100% virtuales',
  },
]

export default function ProgramasPage() {
  const [activeFilter, setActiveFilter] = useState<string>('todos')
  const [search, setSearch] = useState('')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const categoria = searchParams.get('categoria')

    if (categoria && categories.some(c => c.key === categoria)) {
      setActiveFilter(categoria)
    }
  }, [searchParams])

  const filtered = useMemo(() => {
    return allPrograms.filter((p) => {
      const matchesCategory = activeFilter === 'todos' || p.category === activeFilter
      const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [activeFilter, search])

  return (
    <>
      <Helmet>
        <title>Oferta Educativa - Instituto IDEMA</title>
        <meta name="description" content="Explora todas las carreras técnicas, programas auxiliares, especializaciones y cursos cortos del Instituto IDEMA." />
      </Helmet>

      {/* Header */}
      <section className="bg-gradient-to-r from-dark to-deep pt-32 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4"
          >
            Oferta Educativa
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Encuentra el programa ideal para tu desarrollo profesional
          </motion.p>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4" />
        </div>
      </section>

      {/* Filters & Content */}
      <section className="py-12 sm:py-16 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 items-center justify-between">
            <input
              type="text"
              placeholder="Buscar programa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-80 px-4 py-3 rounded-full border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
            />
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => {
                    setActiveFilter(cat.key)
                    navigate(`/programas?categoria=${cat.key}`)
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    activeFilter === cat.key
                      ? 'bg-primary text-white shadow-md shadow-primary/30'
                      : 'bg-white text-deep/70 hover:bg-primary/10 border border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Results count */}
          <p className="text-sm text-deep/60 mb-6">
            {filtered.length} programa{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </p>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filtered.map((program, index) => (
                <ProgramCard
                  key={`${program.category}-${program.slug}`}
                  program={program}
                  basePath={categoryBasePath[program.category]}
                  index={index}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-deep/60 text-lg">No se encontraron programas con esos criterios.</p>
              <button
                onClick={() => { setActiveFilter('todos'); setSearch('') }}
                className="mt-4 text-primary font-semibold hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Ruta de Aprendizaje */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-br from-primary/10 to-accent/10 p-8 sm:p-12 rounded-2xl border border-primary/20"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-deep mb-2 text-center">Ruta de Aprendizaje IDEMA</h2>
            <p className="text-deep/60 text-center mb-10 text-sm">
              Desde formación técnica base hasta especialización avanzada
            </p>

            <div className="space-y-6">
              {learningPath.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={`w-12 h-12 ${step.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 shadow-lg`}>
                    <step.icon className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-deep">{step.title}</h3>
                    <p className="text-deep/70 text-sm">{step.description}</p>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full hidden sm:block">
                    Nivel {i + 1}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA Orientación Vocacional */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-12 bg-gradient-to-r from-primary to-dark rounded-xl p-8 sm:p-12 text-white text-center"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">¿No sabes cuál elegir?</h2>
            <p className="text-white/80 mb-6 max-w-xl mx-auto">
              Realiza nuestra prueba de orientación vocacional y descubre el programa que mejor se ajusta a tus intereses.
            </p>
            <Link to="/orientacion-vocacional">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white text-primary font-bold rounded-full hover:shadow-lg transition-all duration-300"
              >
                Realizar Prueba de Orientación
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  )
}
