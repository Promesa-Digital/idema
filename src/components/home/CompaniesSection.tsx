import { motion } from 'framer-motion'
import { useInView } from 'react-intersection-observer'

const companies = [
  { name: 'Hospital Regional', logo: '/assets/img/logos/hospital.png' },
  { name: 'Clínica San Isidro', logo: '/assets/img/logos/clinica.png' },
  { name: 'Banco del Perú', logo: '/assets/img/logos/banco.png' },
  { name: 'Agroquímica', logo: '/assets/img/logos/agrochemical.png' },
  { name: 'Tech Solutions', logo: '/assets/img/logos/tech.png' },
  { name: 'Transportes Andino', logo: '/assets/img/logos/transport.png' },
  { name: 'Farmacia Central', logo: '/assets/img/logos/pharmacy.png' },
  { name: 'Estancia Agrícola', logo: '/assets/img/logos/farm.png' },
]

export default function CompaniesSection() {
  const { ref, inView } = useInView({ triggerOnce: true })

  return (
    <section ref={ref} className="py-16 sm:py-20 lg:py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 lg:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-deep mb-4">
            Empresas que confían en nosotros
          </h2>
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-accent rounded-full mx-auto"></div>
        </motion.div>

        {/* Infinite scroll carousel */}
        <div className="relative overflow-hidden">
          <motion.div
            initial={{ x: 0 }}
            animate={{ x: -1920 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="flex gap-8 sm:gap-12 lg:gap-16 whitespace-nowrap"
          >
            {/* First set */}
            {companies.map((company, index) => (
              <div
                key={`first-${index}`}
                className="flex-shrink-0 w-40 sm:w-48 lg:w-56 h-24 flex items-center justify-center"
              >
                <div className="bg-surface rounded-xl p-4 w-full h-full flex items-center justify-center hover:bg-surface transition-colors group">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="max-h-full max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.innerHTML = `<span class="text-center text-deep/50 text-xs font-semibold px-2">${company.name}</span>`
                      }
                    }}
                  />
                </div>
              </div>
            ))}
            {/* Second set (for infinite scroll) */}
            {companies.map((company, index) => (
              <div
                key={`second-${index}`}
                className="flex-shrink-0 w-40 sm:w-48 lg:w-56 h-24 flex items-center justify-center"
              >
                <div className="bg-surface rounded-xl p-4 w-full h-full flex items-center justify-center hover:bg-surface transition-colors group">
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="max-h-full max-w-full object-contain opacity-60 group-hover:opacity-100 transition-opacity"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).style.display = 'none'
                      const parent = (e.target as HTMLImageElement).parentElement
                      if (parent) {
                        parent.innerHTML = `<span class="text-center text-deep/50 text-xs font-semibold px-2">${company.name}</span>`
                      }
                    }}
                  />
                </div>
              </div>
            ))}
          </motion.div>

          {/* Gradient masks */}
          <div className="absolute left-0 top-0 w-12 sm:w-20 lg:w-32 h-full bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
          <div className="absolute right-0 top-0 w-12 sm:w-20 lg:w-32 h-full bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
        </div>
      </div>
    </section>
  )
}
