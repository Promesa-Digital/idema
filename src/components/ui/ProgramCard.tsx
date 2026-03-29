import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Carrera } from '../../types'

interface Props {
  program: Carrera
  basePath: string
  index?: number
}

export default function ProgramCard({ program, basePath, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group"
    >
      <Link to={`${basePath}/${program.slug}`} className="block no-underline">
        <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 group-hover:-translate-y-2">
          <div className="relative h-48 overflow-hidden">
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute bottom-3 left-3 bg-primary/90 text-white text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              {program.duration}
            </span>
          </div>
          <div className="p-5">
            <h3 className="font-bold text-lg text-deep mb-2 group-hover:text-primary transition-colors">
              {program.title}
            </h3>
            <p className="text-deep/80 text-sm line-clamp-2 mb-3">
              {program.description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-deep/70">{program.modality}</span>
              <span className="text-primary font-semibold text-sm group-hover:translate-x-1 transition-transform">
                Ver más →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
