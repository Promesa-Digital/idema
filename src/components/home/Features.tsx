import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MdMobileScreenShare, MdLanguage, MdEmojiEvents, MdDateRange } from 'react-icons/md'

const features = [
  { icon: MdMobileScreenShare, text: 'Accesible desde cualquier dispositivo' },
  { icon: MdLanguage, text: 'Solo necesitas conexión a internet' },
  { icon: MdEmojiEvents, text: '+30 años de experiencia' },
  { icon: MdDateRange, text: 'Desde 1994' },
]

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

export default function Features() {
  const { ref, inView } = useInView({ triggerOnce: true })

  return (
    <section ref={ref} className="py-12 sm:py-16 lg:py-20 bg-white border-y border-deep/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Highlighted box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <div className="inline-block bg-gradient-to-r from-primary/15 to-accent/15 text-dark px-6 py-3 rounded-full font-bold text-lg">
            +300 Cursos en Línea
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8"
        >
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                className="flex flex-col items-center text-center group"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="bg-gradient-to-br from-primary/15 to-accent/15 p-4 rounded-full mb-4 group-hover:shadow-lg transition-shadow"
                >
                  <Icon className="text-3xl text-primary" />
                </motion.div>
                <p className="text-deep font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                  {feature.text}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
