import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { MdVolunteerActivism, MdVerifiedUser, MdGavel, MdLightbulb, MdBalance } from 'react-icons/md'

const values = [
  {
    icon: MdVolunteerActivism,
    title: 'Respeto',
    description: 'Reconocimiento de la dignidad de cada persona, promoviendo un trato inclusivo y sin discriminación.',
    color: 'from-primary to-dark',
  },
  {
    icon: MdVerifiedUser,
    title: 'Responsabilidad',
    description: 'Actuación comprometida y ética, asumiendo las consecuencias de las decisiones académicas y profesionales.',
    color: 'from-dark to-deep',
  },
  {
    icon: MdGavel,
    title: 'Disciplina',
    description: 'Cumplimiento de las normas y reglamentos institucionales para garantizar orden y excelencia.',
    color: 'from-accent to-deep',
  },
  {
    icon: MdLightbulb,
    title: 'Innovación',
    description: 'Generación de ideas y soluciones que fortalezcan la mejora continua institucional.',
    color: 'from-cta to-accent',
  },
  {
    icon: MdBalance,
    title: 'Ética',
    description: 'Orientación permanente del comportamiento responsable y transparente de la comunidad educativa.',
    color: 'from-primary to-accent',
  },
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
    transition: { duration: 0.6 },
  },
}

export default function ValuesSection() {
  const { ref, inView } = useInView({ triggerOnce: true })

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-deep mb-4">
            Nuestros Valores
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"></div>
        </motion.div>

        {/* Values grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={inView ? 'visible' : 'hidden'}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 sm:gap-8"
        >
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10 }}
                className="group relative"
              >
                {/* Glassmorphism card */}
                <div className="backdrop-blur-md bg-white/40 border border-white/30 rounded-2xl p-6 sm:p-8 h-full hover:bg-white/60 hover:border-white/60 transition-all duration-300 shadow-lg hover:shadow-xl">
                  {/* Gradient accent */}
                  <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${value.color} rounded-bl-3xl opacity-10 group-hover:opacity-20 transition-opacity`}></div>

                  {/* Icon */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${value.color} mb-4 relative z-10`}
                  >
                    <Icon className="text-white text-2xl" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-lg sm:text-xl font-bold text-deep mb-3 relative z-10">
                    {value.title}
                  </h3>

                  {/* Description */}
                  <p className="text-deep text-sm relative z-10 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
