import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaBook, FaExclamationTriangle } from 'react-icons/fa'
import { useToast } from '../hooks/useToast'

interface ReclamacionForm {
  tipoDocumento: string
  numDocumento: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  direccion: string
  tipoReclamo: string
  descripcionBien: string
  detalleReclamo: string
  pedido: string
  aceptaPoliticas: boolean
}

const initialForm: ReclamacionForm = {
  tipoDocumento: 'DNI',
  numDocumento: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion: '',
  tipoReclamo: 'reclamo',
  descripcionBien: '',
  detalleReclamo: '',
  pedido: '',
  aceptaPoliticas: false,
}

export default function LibroReclamacionesPage() {
  const [formData, setFormData] = useState<ReclamacionForm>(initialForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const { addToast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = (): boolean => {
    const errs: Record<string, string> = {}
    if (!formData.numDocumento.trim()) errs.numDocumento = 'Requerido'
    if (!formData.nombre.trim()) errs.nombre = 'Requerido'
    if (!formData.apellido.trim()) errs.apellido = 'Requerido'
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Email inválido'
    if (!formData.telefono.trim()) errs.telefono = 'Requerido'
    if (!formData.detalleReclamo.trim()) errs.detalleReclamo = 'Requerido'
    if (!formData.aceptaPoliticas) errs.aceptaPoliticas = 'Debe aceptar las políticas'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    // In production, this should POST to your backend
    console.log('Reclamación enviada:', formData)
    addToast('success', '¡Reclamación enviada!', 'Hemos recibido tu reclamación. Te responderemos en un máximo de 30 días calendario.')
    setSubmitted(true)
    setFormData(initialForm)
  }

  return (
    <>
      <Helmet>
        <title>Libro de Reclamaciones - Instituto IDEMA</title>
        <meta name="description" content="Libro de Reclamaciones virtual del Instituto de Educación Superior IDEMA - Arequipa, Perú" />
      </Helmet>

      {/* Hero */}
      <div className="relative h-72 md:h-80 overflow-hidden bg-gradient-to-br from-dark to-deep">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl opacity-20 animate-pulse"></div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative h-full flex flex-col justify-center items-center text-white text-center p-6"
        >
          <FaBook className="text-5xl text-primary mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-2">Libro de Reclamaciones</h1>
          <p className="text-sm md:text-base text-primary">Conforme al Código de Protección y Defensa del Consumidor - Ley N° 29571</p>
        </motion.div>
      </div>

      <div className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 bg-primary/15 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBook className="text-primary text-3xl" />
              </div>
              <h2 className="text-3xl font-bold text-deep mb-4">¡Reclamación Enviada!</h2>
              <p className="text-deep/80 mb-8">Hemos recibido tu reclamación. Nos comprometemos a responder dentro de los 30 días calendario establecidos por ley.</p>
              <button onClick={() => setSubmitted(false)} className="px-8 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full hover:shadow-lg transition-all">
                Enviar otra reclamación
              </button>
            </motion.div>
          ) : (
            <>
              {/* Legal notice */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 bg-accent/10 border border-accent/30 rounded-xl flex items-start gap-3"
              >
                <FaExclamationTriangle className="text-accent mt-1 flex-shrink-0" />
                <div className="text-sm text-deep">
                  <strong>Información importante:</strong> Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, este establecimiento cuenta con un Libro de Reclamaciones a disposición del consumidor. La formulación de la queja o reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
                </div>
              </motion.div>

              {/* Institution info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10 p-6 bg-surface rounded-xl"
              >
                <h3 className="font-bold text-deep mb-3">Datos del Proveedor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-deep">
                  <p><strong>Razón Social:</strong> Instituto de Educación Superior IDEMA E.I.R.L.</p>
                  <p><strong>RUC:</strong> 20601522876</p>
                  <p><strong>Dirección:</strong> Urb. Las Malvinas U-1 Pedregal - Majes, Arequipa</p>
                  <p><strong>Teléfono:</strong> 054-209978 / +51 951 361 224</p>
                </div>
              </motion.div>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Consumer data */}
                <div>
                  <h3 className="text-xl font-bold text-deep mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary/15 text-primary rounded-full flex items-center justify-center text-sm font-bold">1</span>
                    Datos del Consumidor
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Tipo de Documento</label>
                      <select name="tipoDocumento" value={formData.tipoDocumento} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm">
                        <option value="DNI">DNI</option>
                        <option value="CE">Carné de Extranjería</option>
                        <option value="Pasaporte">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Número de Documento *</label>
                      <input type="text" name="numDocumento" value={formData.numDocumento} onChange={handleChange} maxLength={12}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.numDocumento ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Nombres *</label>
                      <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} maxLength={50}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.nombre ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Apellidos *</label>
                      <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} maxLength={50}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.apellido ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Correo Electrónico *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} maxLength={100}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm`} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Teléfono *</label>
                      <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} maxLength={15}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.telefono ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm`} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-deep mb-1">Dirección</label>
                      <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} maxLength={200}
                        className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm" />
                    </div>
                  </div>
                </div>

                {/* Complaint details */}
                <div>
                  <h3 className="text-xl font-bold text-deep mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 bg-primary/15 text-primary rounded-full flex items-center justify-center text-sm font-bold">2</span>
                    Detalle de la Reclamación
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-deep mb-2">Tipo</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="tipoReclamo" value="reclamo" checked={formData.tipoReclamo === 'reclamo'} onChange={handleChange}
                            className="w-4 h-4 text-primary" />
                          <span className="text-sm text-deep"><strong>Reclamo:</strong> disconformidad con los servicios</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="tipoReclamo" value="queja" checked={formData.tipoReclamo === 'queja'} onChange={handleChange}
                            className="w-4 h-4 text-primary" />
                          <span className="text-sm text-deep"><strong>Queja:</strong> malestar o descontento con la atención</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Descripción del bien o servicio contratado</label>
                      <textarea name="descripcionBien" value={formData.descripcionBien} onChange={handleChange} rows={2} maxLength={500}
                        className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm resize-none"
                        placeholder="Ej: Curso de Clasificación de Medicamentos" />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Detalle de la reclamación *</label>
                      <textarea name="detalleReclamo" value={formData.detalleReclamo} onChange={handleChange} rows={4} maxLength={1000}
                        className={`w-full px-4 py-3 rounded-xl border ${errors.detalleReclamo ? 'border-cta' : 'border-deep/10'} focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm resize-none`}
                        placeholder="Describa con detalle su reclamo o queja..." />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-deep mb-1">Pedido del consumidor</label>
                      <textarea name="pedido" value={formData.pedido} onChange={handleChange} rows={2} maxLength={500}
                        className="w-full px-4 py-3 rounded-xl border border-deep/10 focus:border-primary/50 focus:ring-2 focus:ring-primary/15 outline-none text-sm resize-none"
                        placeholder="¿Qué solución espera?" />
                    </div>
                  </div>
                </div>

                {/* Accept and submit */}
                <div className="space-y-4">
                  <label className={`flex items-start gap-3 cursor-pointer ${errors.aceptaPoliticas ? 'text-cta' : 'text-deep'}`}>
                    <input type="checkbox" name="aceptaPoliticas" checked={formData.aceptaPoliticas} onChange={handleChange}
                      className="w-5 h-5 mt-0.5 rounded" />
                    <span className="text-sm">
                      Declaro que la información proporcionada es veraz y acepto las{' '}
                      <a href="/politica-privacidad" target="_blank" className="text-primary underline">Políticas de Privacidad</a>{' '}
                      y los{' '}
                      <a href="/terminos-y-condiciones" target="_blank" className="text-primary underline">Términos y Condiciones</a>.
                    </span>
                  </label>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 text-lg"
                  >
                    Enviar Reclamación
                  </motion.button>

                  <p className="text-xs text-deep/50 text-center">
                    La Institución se compromete a dar respuesta a su reclamo en un plazo máximo de 30 días calendario, conforme a lo establecido por el Código de Protección y Defensa del Consumidor.
                  </p>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
