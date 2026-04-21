import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'
import { especializaciones } from '../../data/programs/especializaciones'
import ProgramCard from '../ui/ProgramCard'

export default function EspecializacionesSection() {
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
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-deep mb-3 sm:mb-4">
            Especializaciones para Profesionales
          </h2>
          <p className="text-base sm:text-lg text-deep/80">
            10 meses de formación especializada
          </p>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mt-4"></div>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {especializaciones.map((especializacion, index) => (
            <ProgramCard key={especializacion.slug} program={especializacion} basePath="/especializaciones" index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
