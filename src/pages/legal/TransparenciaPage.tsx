import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaMoneyBillWave, FaUserGraduate, FaCertificate } from 'react-icons/fa'

interface StatItem {
  icon: typeof FaMoneyBillWave
  title: string
  value: string
  pending: boolean
}

const stats: StatItem[] = [
  {
    icon: FaMoneyBillWave,
    title: 'Costo de las Pensiones',
    value: 'S/ 150.00 mensual',
    pending: false,
  },
  {
    icon: FaUserGraduate,
    title: 'Cantidad de Matriculados en el Semestre Anterior',
    value: 'Por publicar.',
    pending: true,
  },
  {
    icon: FaCertificate,
    title: 'Periodo de Vigencia del Licenciamiento',
    value: '2026 - 2032',
    pending: false,
  },
]

const tarifario: { documento: string; precio: string }[] = [
  { documento: 'Matrícula', precio: 'S/ 100.00' },
  { documento: 'Certificado de estudios por semestre', precio: 'S/ 80.00' },
  { documento: 'Constancia de egresado', precio: 'S/ 0.00' },
  { documento: 'Constancia de estudios', precio: 'S/ 40.00' },
  { documento: 'Inscripción de curso', precio: 'S/ 50.00' },
  { documento: 'Costo del curso', precio: 'S/ 150.00' },
  { documento: 'Traslados', precio: 'S/ 500.00' },
  { documento: 'Convalidación', precio: 'S/ 500.00' },
  { documento: 'Titulación', precio: 'S/ 3,500.00' },
  { documento: 'Recuperación de cursos', precio: 'S/ 50.00' },
  { documento: 'Recuperación de curso (egresado)', precio: 'S/ 80.00' },
  { documento: 'Tesis / Proyecto de implementación', precio: 'S/ 1,000.00' },
  { documento: 'Certificado de taller', precio: 'S/ 55.00' },
  { documento: 'Certificado de seminario', precio: 'S/ 50.00' },
  { documento: 'Constancia de vacante', precio: 'S/ 0.00' },
  { documento: 'Constancia de matrícula', precio: 'S/ 40.00' },
  { documento: 'Constancia de no adeudo', precio: 'S/ 40.00' },
  { documento: 'Certificado modular', precio: 'S/ 150.00' },
  { documento: 'Curso de inglés', precio: 'S/ 150.00' },
  { documento: 'Curso de cómputo', precio: 'S/ 150.00' },
  { documento: 'Diploma de egresado', precio: 'S/ 40.00' },
  { documento: 'Duplicado de diploma de egresado', precio: 'S/ 150.00' },
  { documento: 'Duplicado de título antes del 2017', precio: 'S/ 2,000.00' },
  { documento: 'Duplicado de título después del 2017', precio: 'S/ 40.00' },
  { documento: 'Formato Único de Trámite (FUT)', precio: 'S/ 1.00' },
  { documento: 'Kit de titulación', precio: 'S/ 110.00' },
  { documento: 'Certificado físico de carreras de 1 año', precio: 'S/ 50.00' },
]

export default function TransparenciaPage() {
  return (
    <>
      <Helmet>
        <title>Transparencia - Instituto IDEMA</title>
        <meta name="description" content="Información institucional de transparencia de IES Idema: tasas educativas, pensiones, matriculados y vigencia del licenciamiento." />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-72 md:h-80 overflow-hidden bg-gradient-to-br from-dark to-deep">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">Transparencia</h1>
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl">Información institucional al servicio de nuestra comunidad educativa</p>
        </motion.div>
      </div>

      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-16">
            {stats.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-surface rounded-2xl p-6 sm:p-8 border border-deep/10"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent mb-4">
                    <Icon className="text-white text-xl" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-deep mb-2">{item.title}</h2>
                  <p className={item.pending ? 'text-deep/50 text-sm italic' : 'text-2xl font-bold gradient-text'}>
                    {item.value}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Tarifario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-deep mb-2">Montos de Derechos de Tasas Educativas</h2>
            <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mb-8" />

            <div className="overflow-x-auto rounded-2xl border border-deep/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-primary to-dark text-white">
                    <th className="text-left px-4 sm:px-6 py-3 font-semibold">Documento / Servicio</th>
                    <th className="text-right px-4 sm:px-6 py-3 font-semibold">Precio Actual</th>
                  </tr>
                </thead>
                <tbody>
                  {tarifario.map((row, index) => (
                    <tr
                      key={row.documento}
                      className={index % 2 === 0 ? 'bg-surface' : 'bg-white'}
                    >
                      <td className="px-4 sm:px-6 py-3 text-deep">{row.documento}</td>
                      <td className="px-4 sm:px-6 py-3 text-right font-semibold text-deep">{row.precio}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
