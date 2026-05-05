import { motion, AnimatePresence } from 'framer-motion'

interface FieldErrorProps {
  id?: string
  message?: string
}

/**
 * Mensaje de error inline para campos de formulario, sobre fondos oscuros
 * (gradients accent/deep). Animado con AnimatePresence — desaparece suave
 * cuando el error se limpia.
 */
export default function FieldError({ id, message }: FieldErrorProps) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="mt-1.5 ml-1 text-[11px] font-medium text-rose-200 flex items-start gap-1.5"
        >
          <span aria-hidden className="inline-block w-1 h-1 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
          <span>{message}</span>
        </motion.p>
      )}
    </AnimatePresence>
  )
}
