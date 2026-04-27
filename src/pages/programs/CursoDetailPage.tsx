import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaCheck, FaClock, FaBook, FaCertificate, FaCalendar, FaWhatsapp, FaEnvelope, FaCreditCard, FaShieldAlt, FaShoppingCart } from 'react-icons/fa'
import { cursos } from '../../data/programs/cursos'
import { useCulqi } from '../../hooks/useCulqi'
import { useCart } from '../../context/CartContext'

export default function CursoDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const curso = cursos.find(c => c.slug === slug)
  const { openCheckout } = useCulqi()
  const { addItem } = useCart()

  if (!curso) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-dark to-deep">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">404</h1>
          <p className="text-xl text-white/50 mb-8">Curso no encontrado</p>
          <Link to="/programas?categoria=curso">
            <button className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full hover:shadow-lg hover:shadow-primary/50 transition-all duration-300 hover:scale-105">
              Ver Cursos
            </button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const priceNumber = curso.price ? parseInt(curso.price.replace(/[^0-9]/g, ''), 10) : 0
  const priceCents = priceNumber * 100

  const handlePayment = () => {
    if (!priceCents) return
    openCheckout({
      title: curso.title,
      amount: priceCents,
      description: `Curso: ${curso.title} - ${curso.duration}`,
      onSuccess: (token) => {
        console.log('Payment token received:', token.id)
      },
    })
  }

  return (
    <>
      <Helmet>
        <title>{curso.title} - Instituto IDEMA</title>
        <meta name="description" content={curso.description} />
      </Helmet>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${curso.image}')` }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-end p-6 md:p-12 text-white"
        >
          {curso.convenio && (
            <div className="flex items-center gap-2 mb-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 w-fit">
              <img src={curso.convenio.logo} alt={curso.convenio.name} className="h-6 w-auto object-contain" />
              <span className="text-white/90 text-sm font-medium">En convenio con {curso.convenio.name}</span>
            </div>
          )}
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{curso.title}</h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl">{curso.duration}</p>
        </motion.div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-surface py-4 px-6 md:px-12">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-deep/80">
          <Link to="/" className="hover:text-primary">Inicio</Link>
          <span>/</span>
          <Link to="/programas?categoria=curso" className="hover:text-primary">Cursos</Link>
          <span>/</span>
          <span className="text-deep font-semibold">{curso.title}</span>
        </div>
      </div>

      {/* Main Content — 2 column layout */}
      <div className="bg-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left: Course content */}
            <div className="lg:col-span-2">
              {/* Description */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
                <h2 className="text-3xl font-bold mb-6 gradient-text">Descripción del Curso</h2>
                <p className="text-lg text-deep leading-relaxed">{curso.description}</p>
              </motion.div>

              {/* Features / Contenidos */}
              {curso.features && curso.features.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
                  <h2 className="text-3xl font-bold mb-8 gradient-text">Contenidos del Curso</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {curso.features.map((feature, index) => (
                      <motion.div key={index} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="flex items-start gap-4 p-4 rounded-lg bg-surface hover:bg-surface transition-colors">
                        <FaCheck className="text-primary text-xl mt-1 flex-shrink-0" />
                        <p className="text-deep">{feature}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Info Cards */}
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="mb-16">
                <h2 className="text-3xl font-bold mb-8 gradient-text">Información del Curso</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/30">
                    <FaClock className="text-primary text-3xl mb-4" />
                    <h3 className="font-bold text-deep mb-2">Duración</h3>
                    <p className="text-deep">{curso.duration}</p>
                  </motion.div>
                  <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-primary/10 to-accent/10 p-6 rounded-xl border border-primary/20">
                    <FaBook className="text-accent text-3xl mb-4" />
                    <h3 className="font-bold text-deep mb-2">Modalidad</h3>
                    <p className="text-deep">{curso.modality}</p>
                  </motion.div>
                  <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-accent/10 to-cta/10 p-6 rounded-xl border border-accent/20">
                    <FaCertificate className="text-accent text-3xl mb-4" />
                    <h3 className="font-bold text-deep mb-2">Certificación</h3>
                    {curso.certification ? (
                      <ul className="text-deep text-sm space-y-1">
                        {curso.certification.map((cert, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <FaCheck className="text-accent text-xs mt-1 flex-shrink-0" />
                            {cert}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-deep">Certificado oficial</p>
                    )}
                  </motion.div>
                  <motion.div whileHover={{ translateY: -10 }} className="bg-gradient-to-br from-cta/10 to-cta/10 p-6 rounded-xl border border-cta/20">
                    <FaCalendar className="text-cta text-3xl mb-4" />
                    <h3 className="font-bold text-deep mb-2">Requisitos</h3>
                    {curso.requirements ? (
                      <ul className="text-deep text-sm space-y-1">
                        {curso.requirements.map((req, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <FaCheck className="text-cta text-xs mt-1 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-deep">Flexibles y accesibles</p>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* Right: Payment sidebar */}
            <div className="lg:col-span-1">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 }} className="sticky top-28">
                <div className="bg-white rounded-2xl shadow-xl border border-deep/10 overflow-hidden">
                  {/* Price header */}
                  <div className="bg-gradient-to-r from-dark to-deep p-6 text-center">
                    {curso.matricula ? (
                      <>
                        <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">Inversión</p>
                        <div className="flex justify-center gap-6 text-white">
                          <div>
                            <p className="text-xs text-white/60 mb-1">Matrícula</p>
                            <p className="text-2xl font-bold">{curso.matricula}</p>
                          </div>
                          <div className="w-px bg-white/20" />
                          <div>
                            <p className="text-xs text-white/60 mb-1">Pensión</p>
                            <p className="text-2xl font-bold">{curso.price || 'Consultar'}</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-primary text-sm font-semibold uppercase tracking-wider mb-2">Precio del Curso</p>
                        <p className="text-4xl font-bold text-white">{curso.price || 'Consultar'}</p>
                        <p className="text-white/60 text-sm mt-1">Pago único</p>
                      </>
                    )}
                  </div>

                  {/* Payment actions */}
                  <div className="p-6 space-y-4">
                    {priceCents > 0 && (
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handlePayment}
                        className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300">
                        <FaCreditCard className="text-lg" /> Comprar Ahora
                      </motion.button>
                    )}

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => addItem(curso, priceNumber)}
                      className="w-full py-3 border-2 border-primary/50 text-primary font-bold rounded-xl flex items-center justify-center gap-3 hover:bg-primary/10 transition-all duration-300">
                      <FaShoppingCart className="text-lg" /> Agregar al Carrito
                    </motion.button>

                    <a href={`https://wa.me/?text=${encodeURIComponent(curso.whatsappMessage || 'Hola, me interesa este curso')}`}
                      target="_blank" rel="noopener noreferrer" className="block">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-4 bg-whatsapp text-white font-bold rounded-xl flex items-center justify-center gap-3 hover:shadow-lg hover:shadow-whatsapp/30 transition-all duration-300">
                        <FaWhatsapp className="text-lg" /> Consultar por WhatsApp
                      </motion.button>
                    </a>

                    <a href="mailto:info@idema.edu.pe?subject=Consulta sobre curso" className="block">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        className="w-full py-3 border-2 border-deep/10 text-deep font-semibold rounded-xl flex items-center justify-center gap-3 hover:border-primary/40 hover:text-primary transition-all duration-300">
                        <FaEnvelope className="text-lg" /> Solicitar Información
                      </motion.button>
                    </a>

                    <div className="flex items-center gap-2 text-xs text-deep/50 justify-center pt-2">
                      <FaShieldAlt />
                      <span>Pago seguro con Culqi</span>
                    </div>

                    <div className="border-t border-deep/10 pt-4 mt-4">
                      <p className="text-sm font-bold text-deep mb-3">Este curso incluye:</p>
                      <ul className="space-y-2">
                        {['Acceso a plataforma virtual', 'Material didáctico digital', 'Certificado virtual incluido', 'Certificación ISO 21001', 'Soporte por WhatsApp'].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-deep/80">
                            <FaCheck className="text-primary flex-shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
