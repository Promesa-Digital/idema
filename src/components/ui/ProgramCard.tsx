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
          <div className="relative h-48 overflow-hidden bg-surface">
            <img
              src={program.image}
              alt={program.title}
              className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <span className="absolute bottom-3 left-3 bg-white/90 text-deep text-xs font-bold px-3 py-1 rounded-full backdrop-blur-sm">
              {program.duration}
            </span>
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
              {program.category === 'curso' && (
                <div className="bg-primary/90 backdrop-blur-sm rounded-full px-2 h-6 flex items-center">
                  <span className="text-[10px] font-bold text-white leading-none">Curso Virtual</span>
                </div>
              )}
              {program.convenio && (
                <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                  <img src={program.convenio.logo} alt={program.convenio.name} className="h-4 w-auto object-contain" />
                </div>
              )}
            </div>
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
