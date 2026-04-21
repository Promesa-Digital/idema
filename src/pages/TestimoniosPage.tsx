import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'

interface Testimonial {
  id: string
  name: string
  career: string
  year: number
  quote: string
  rating: number
  initials: string
  color: string
}

const testimonials: Testimonial[] = [
  {
    id: '1',
    name: 'Beatriz Anco',
    career: 'Enfermería',
    year: 2024,
    quote: '¡100% recomendable!, estudiar en el Instituto Idema me ha servido bastante para mi desarrollo personal y me ha dado la oportunidad de elevar el puntaje de mi curriculum vitae.',
    rating: 5,
    initials: 'BA',
    color: 'from-primary to-primary/70'
  },
  {
    id: '2',
    name: 'Boris de la Cruz',
    career: 'Agropecuaria',
    year: 2024,
    quote: 'Estoy totalmente satisfecho de haber invertido en Idema, ahora tengo un título que me respalda.',
    rating: 5,
    initials: 'BC',
    color: 'from-dark to-accent'
  },
  {
    id: '3',
    name: 'Dorian Zegarra',
    career: 'Contabilidad',
    year: 2024,
    quote: 'Estoy muy agradecido con el Instituto Idema por haberme dado la oportunidad de obtener mi título.',
    rating: 5,
    initials: 'DZ',
    color: 'from-cta to-accent'
  },
]

export default function TestimoniosPage() {
  return (
    <>
      <Helmet>
        <title>Testimonios - Instituto IDEMA</title>
        <meta name="description" content="Lee los testimonios de nuestros egresados satisfechos que han transformado sus vidas a través de la educación en IDEMA." />
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
          <h1 className="text-5xl md:text-6xl font-bold mb-4">Testimonios</h1>
          <p className="text-lg md:text-xl text-primary max-w-2xl">Historias de éxito de nuestros egresados</p>
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
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Lo Que Dicen Nuestros Egresados</h2>
            <p className="text-lg text-deep/80 max-w-2xl mx-auto">
              Miles de profesionales han transformado sus vidas a través de nuestros programas educativos. Aquí puedes conocer sus historias de éxito.
            </p>
          </motion.div>

          {/* Testimonials Grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ translateY: -10 }}
                className="bg-gradient-to-br from-surface to-white rounded-xl p-8 border-2 border-deep/10 hover:border-primary/40 transition-all"
              >
                {/* Star Rating */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <FaStar key={i} className="text-cta text-lg" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-deep mb-6 italic leading-relaxed">{testimonial.quote}</p>

                {/* Divider */}
                <div className="h-1 bg-gradient-to-r from-primary/60 to-primary/40 rounded-full mb-6"></div>

                {/* Author Info */}
                <div className="flex items-center gap-4">
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className={`w-14 h-14 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                  >
                    {testimonial.initials}
                  </motion.div>

                  <div>
                    <h3 className="font-bold text-deep">{testimonial.name}</h3>
                    <p className="text-sm text-deep/80">{testimonial.career}</p>
                    <p className="text-xs text-deep/70">Egresado {testimonial.year}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-primary to-dark rounded-xl p-12 text-white text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">¿Quieres Ser el Próximo?</h2>
            <p className="text-lg mb-8 text-white/90 max-w-2xl mx-auto">
              Únete a nuestra comunidad de egresados exitosos. Inicia tu transformación profesional hoy mismo con IDEMA.
            </p>

            <a href="/#contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white text-primary font-bold rounded-full hover:shadow-lg transition-all duration-300"
              >
                Solicitar Información
              </motion.button>
            </a>
          </motion.div>
        </div>
      </div>
    </>
  )
}
