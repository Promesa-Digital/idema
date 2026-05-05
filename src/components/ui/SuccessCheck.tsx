import { motion } from 'framer-motion'

interface SuccessCheckProps {
  size?: number
  /** Color del trazo del check. Default: primary cyan */
  color?: string
}

/**
 * Animated check icon: SVG stroke-draw del círculo y la marca,
 * con un glow radial suave detrás. Pensado para confirmaciones de
 * formulario sobre fondos oscuros (gradient-contact accent→deep).
 */
export default function SuccessCheck({ size = 72, color = '#00AFF0' }: SuccessCheckProps) {
  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow radial detrás del check */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1.4 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at center, ${color}40 0%, ${color}00 70%)`,
        }}
      />

      <svg
        viewBox="0 0 52 52"
        width={size}
        height={size}
        className="relative"
        aria-hidden
      >
        {/* Círculo */}
        <motion.circle
          cx="26"
          cy="26"
          r="23"
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
        {/* Check */}
        <motion.path
          d="M14 27 L23 36 L39 18"
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut', delay: 0.45 }}
        />
      </svg>
    </div>
  )
}
