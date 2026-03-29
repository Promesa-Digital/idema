import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaTrash, FaExclamationTriangle } from 'react-icons/fa'
import { useToast } from '../hooks/useToast'

export default function EliminarCuentaPage() {
  const [email, setEmail] = useState('')
  const [motivo, setMotivo] = useState('')
  const [confirmacion, setConfirmacion] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { addToast } = useToast()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !confirmacion) {
      addToast('error', 'Error', 'Complete todos los campos requeridos')
      return
    }
    console.log('Solicitud de eliminación:', { email, motivo })
    addToast('success', 'Solicitud enviada', 'Tu solicitud ha sido recibida. Procesaremos la eliminación en un plazo de 15 días hábiles.')
    setSubmitted(true)
  }

  return (
    <>
      <Helmet>
        <title>Eliminar Cuenta - Instituto IDEMA</title>
        <meta name="description" content="Solicitar la eliminación de tu cuenta y datos personales en IDEMA" />
      </Helmet>

      <div className="relative h-72 overflow-hidden bg-gradient-to-br from-dark to-deep">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <FaTrash className="text-4xl text-cta mb-4" />
          <h1 className="text-4xl font-bold mb-2">Eliminar Cuenta</h1>
          <p className="text-primary text-sm">Solicitud de eliminación de datos personales</p>
        </motion.div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-2xl mx-auto px-6">
          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <h2 className="text-2xl font-bold text-deep mb-4">Solicitud Recibida</h2>
              <p className="text-deep/80">Procesaremos tu solicitud dentro de los 15 días hábiles. Recibirás una confirmación a tu correo electrónico.</p>
            </motion.div>
          ) : (
            <>
              <div className="mb-8 p-4 bg-accent/10 border border-accent/30 rounded-xl flex items-start gap-3">
                <FaExclamationTriangle className="text-accent mt-1 flex-shrink-0" />
                <div className="text-sm text-deep">
                  <strong>Advertencia:</strong> La eliminación de tu cuenta es irreversible. Se eliminarán todos tus datos personales, historial académico y acceso a plataformas virtuales. Conforme a la Ley N.° 29733, tienes derecho a solicitar la eliminación de tus datos personales.
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-deep mb-1">Correo Electrónico registrado *</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={100}
                    className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none"
                    placeholder="tu-email@ejemplo.com" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-deep mb-1">Motivo (opcional)</label>
                  <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} maxLength={500}
                    className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none resize-none"
                    placeholder="¿Por qué deseas eliminar tu cuenta?" />
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={confirmacion} onChange={e => setConfirmacion(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded" />
                  <span className="text-sm text-deep">Confirmo que deseo eliminar permanentemente mi cuenta y todos mis datos asociados.</span>
                </label>

                <button type="submit"
                  className="w-full py-4 bg-cta text-white font-bold rounded-xl hover:bg-cta/90 transition-colors">
                  Solicitar Eliminación de Cuenta
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
