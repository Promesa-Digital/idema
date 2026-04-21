import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { MdCalendarToday, MdArrowForward } from 'react-icons/md'
import { useNoticias } from '../hooks/useNoticias'

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-PE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export default function NoticiasPage() {
  const { noticias, loading } = useNoticias()

  const sortedNoticias = [...noticias].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <>
      <Helmet>
        <title>Noticias - Instituto IDEMA</title>
        <meta
          name="description"
          content="Últimas noticias y novedades del Instituto IDEMA. Eventos, convenios, talleres y más."
        />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-dark to-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl font-bold text-white mb-4"
          >
            Noticias
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-white/80 text-lg max-w-2xl mx-auto"
          >
            Explora las últimas novedades del Instituto IDEMA
          </motion.p>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-6"></div>
        </div>
      </section>

      {/* News list */}
      <section className="py-16 sm:py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-lg animate-pulse">
                  <div className="h-48 sm:h-56 bg-gray-200" />
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              {sortedNoticias.map((noticia) => (
                <motion.a
                  key={noticia.slug}
                  href={noticia.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  variants={itemVariants}
                  whileHover={{ y: -8 }}
                  className="group block"
                >
                  <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                    {/* Image */}
                    <div className="relative h-48 sm:h-56 overflow-hidden">
                      <img
                        src={noticia.image}
                        alt={noticia.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>

                    {/* Content */}
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-2 text-primary text-sm mb-3">
                        <MdCalendarToday className="text-base" />
                        <span>{formatDate(noticia.date)}</span>
                      </div>

                      <h2 className="text-lg font-bold text-deep mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {noticia.title}
                      </h2>

                      <p className="text-deep/70 text-sm leading-relaxed line-clamp-4 flex-1">
                        {noticia.summary}
                      </p>

                      <div className="flex items-center gap-1 text-primary font-semibold text-sm mt-4 group-hover:gap-2 transition-all">
                        Leer más
                        <MdArrowForward className="text-base" />
                      </div>
                    </div>
                  </div>
                </motion.a>
              ))}
            </motion.div>
          )}

          {/* External link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <a
              href="https://website.instituto-idema.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-dark text-white font-semibold rounded-full hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:-translate-y-1"
            >
              Ver más noticias en nuestro portal
              <MdArrowForward className="text-lg" />
            </a>
          </motion.div>
        </div>
      </section>
    </>
  )
}
