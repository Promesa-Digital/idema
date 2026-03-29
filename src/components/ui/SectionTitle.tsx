import { motion } from 'framer-motion'

interface Props {
  title: string
  subtitle?: string
  light?: boolean
  className?: string
}

export default function SectionTitle({ title, subtitle, light, className = '' }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`text-center mb-12 ${className}`}
    >
      <h2 className={`text-3xl md:text-4xl font-bold mb-4 ${light ? 'text-white' : 'gradient-text'}`}>
        {title}
      </h2>
      {subtitle && (
        <p className={`text-lg max-w-2xl mx-auto ${light ? 'text-white/80' : 'text-deep/80'}`}>
          {subtitle}
        </p>
      )}
      <div className={`w-24 h-1 mx-auto mt-4 rounded-full ${light ? 'bg-white/50' : 'bg-gradient-to-r from-primary to-dark'}`} />
    </motion.div>
  )
}
