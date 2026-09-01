import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaArrowUpRightFromSquare } from 'react-icons/fa6'

interface TransparenciaDocumento {
  number: number
  title: string
  href?: string
}

const documentos: TransparenciaDocumento[] = [
  {
    number: 1,
    title: 'Relación y número de becas',
    href: '/assets/files/transparencia/relacion-numero-becas-idema.pdf',
  },
  {
    number: 2,
    title: 'Relación de derechos, tasas y montos de pensiones u otros pagos',
    href: '/assets/files/transparencia/tarifario-ies-idema.pdf',
  },
  {
    number: 3,
    title: 'Conformación del cuerpo docente y las materias en las que se desempeña',
    href: '/assets/files/transparencia/cuerpo-docentes-ies-idema.pdf',
  },
  {
    number: 4,
    title: 'Número de ingresantes, matriculados y egresados por año y programa formativo',
    href: '/assets/files/transparencia/ingresantes-matriculados-egresados-ies.pdf',
  },
  {
    number: 5,
    title: 'Programas de estudio',
    href: '/assets/files/transparencia/programas-estudio-ies.pdf',
  },
  {
    number: 6,
    title: 'Resoluciones de licenciamiento',
  },
  {
    number: 7,
    title: 'Reglamento institucional',
    href: '/assets/files/transparencia/reglamento-institucional-ies.pdf',
  },
  {
    number: 8,
    title: 'Manual de Perfiles de Puestos (MPP)',
    href: '/assets/files/transparencia/mpp-idema.pdf',
  },
]

export default function TransparenciaPage() {
  return (
    <>
      <Helmet>
        <title>Portal de Transparencia - Instituto IDEMA</title>
        <meta name="description" content="Portal de Transparencia del Instituto de Educación Superior IDEMA: becas, tasas educativas, cuerpo docente, ingresantes, programas de estudio, resoluciones de licenciamiento, reglamento institucional y Manual de Perfiles de Puestos." />
      </Helmet>

      <div className="bg-gradient-to-b from-dark via-deep/80 to-dark">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 lg:pt-36">
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-xs text-white/45">
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-white/70">Portal de Transparencia</span>
          </nav>
        </div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16"
        >
          <h1 className="font-heading font-extrabold uppercase leading-[0.95] text-white">
            <span className="block text-2xl sm:text-3xl">Portal de</span>
            <span className="block text-5xl sm:text-6xl lg:text-7xl">Transparencia</span>
          </h1>
        </motion.div>

        {/* Documents Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-8">
            {documentos.map((doc, index) => (
              <motion.div
                key={doc.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
              >
                <div className="flex items-center justify-between gap-4 bg-white/5 rounded-xl border border-white/10 px-5 py-4 h-full">
                  <h2 className="text-sm text-white/90 font-semibold leading-snug">{doc.number}. {doc.title}</h2>
                  {doc.href ? (
                    <a
                      href={doc.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Ver ${doc.title}`}
                      className="flex-shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-white text-accent hover:scale-110 transition-transform"
                    >
                      <FaArrowUpRightFromSquare className="text-xs" />
                    </a>
                  ) : (
                    <span className="flex-shrink-0 text-xs text-white/40 italic whitespace-nowrap">Por publicar</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
