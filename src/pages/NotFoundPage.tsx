import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaHome, FaSearch, FaArrowRight } from 'react-icons/fa'

export default function NotFoundPage() {
  const suggestedLinks = [
    { label: 'Inicio', href: '/', icon: FaHome },
    { label: 'Carreras', href: '/#carreras', icon: FaSearch },
    { label: 'Sobre Nosotros', href: '/nosotros', icon: FaSearch },
    { label: 'Contacto', href: '/#contacto', icon: FaSearch },
  ]

  return (
    <>
      <Helmet>
        <title>404 - Página no encontrada</title>
        <meta name="description" content="La página que buscas no existe en Instituto IDEMA." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark flex items-center justify-center px-6 overflow-hidden relative">
        {/* Background Animation Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 max-w-2xl w-full text-center"
        >
          {/* 404 Number */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="text-9xl md:text-[150px] font-black bg-gradient-to-r from-primary via-accent to-deep bg-clip-text text-transparent drop-shadow-lg">
              404
            </div>
          </motion.div>

          {/* Animated SVG-like decorative element */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl text-primary"
              >
                📍
              </motion.div>
            </div>
          </motion.div>

          {/* Main Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Página No Encontrada
            </h1>
            <p className="text-lg md:text-xl text-white/60 mb-4">
              Parece que la página que buscas no existe o ha sido movida.
            </p>
            <p className="text-white/50">
              No te preocupes, aquí hay algunos enlaces útiles para ayudarte a encontrar lo que necesitas.
            </p>
          </motion.div>

          {/* Suggested Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          >
            {suggestedLinks.map((link, index) => (
              <Link key={index} to={link.href}>
                <motion.div
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-br from-dark to-dark/80 p-4 rounded-lg border border-white/20 hover:border-primary transition-all cursor-pointer group"
                >
                  <link.icon className="text-2xl text-primary mx-auto mb-2 group-hover:text-primary transition-colors" />
                  <p className="text-white font-semibold text-sm">{link.label}</p>
                </motion.div>
              </Link>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-gradient-to-r from-primary to-dark text-white font-bold rounded-full flex items-center gap-2 justify-center hover:shadow-2xl hover:shadow-primary/50 transition-all duration-300"
              >
                Volver al Inicio
                <FaArrowRight />
              </motion.button>
            </Link>

            <a href="/#contacto">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 backdrop-blur-md bg-white/10 border border-white/30 text-white font-bold rounded-full hover:bg-white/20 transition-all duration-300"
              >
                Contactar Soporte
              </motion.button>
            </a>
          </motion.div>

          {/* Additional Help Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="mt-12 pt-8 border-t border-white/15"
          >
            <p className="text-deep/70 text-sm">
              ¿Aún necesitas ayuda?
              <a href="/#contacto" className="text-primary hover:text-primary font-semibold ml-1">
                Contacta con nuestro equipo
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </>
  )
}
