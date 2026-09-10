import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaExclamationTriangle, FaTrash } from 'react-icons/fa'

export default function EliminarCuentaPage() {
  return (
    <>
      <Helmet>
        <title>Dar de baja mi cuenta - Instituto IDEMA</title>
        <meta name="description" content="Gestiona la baja de tu cuenta de alumno y tus datos personales en IDEMA" />
      </Helmet>

      <div className="relative h-72 overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-top" style={{ backgroundImage: "url('/assets/img/hero/desktop/PRINCIPAL_1.jpeg')" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-dark/85 via-dark/60 to-transparent" />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative flex h-full flex-col items-center justify-center p-6 text-center text-white">
          <FaTrash className="mb-4 text-4xl text-cta" />
          <h1 className="mb-4 text-4xl font-bold sm:text-5xl lg:text-6xl">Dar de baja mi cuenta</h1>
          <p className="text-lg text-white/80 sm:text-xl">Gestiona tu cuenta y tus datos personales</p>
        </motion.div>
      </div>

      <div className="bg-white py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm sm:p-9">
            <h2 className="text-2xl font-bold text-deep">Realiza la solicitud desde tu cuenta</h2>
            <p className="mt-3 leading-relaxed text-deep/80">
              Inicia sesión, entra a <strong>Perfil y seguridad</strong> y selecciona <strong>Dar de baja mi cuenta</strong>. La sesión se cerrará inmediatamente y ya no podrás volver a ingresar.
            </p>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-deep">
              <FaExclamationTriangle className="mt-1 shrink-0 text-accent" />
              <p>Si existen pagos, comprobantes o historial académico, IDEMA conservará la información necesaria para cumplir obligaciones legales y educativas. Si no existe historial, los datos personales serán anonimizados.</p>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link to="/alumno/login" className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 font-semibold text-white transition hover:bg-primary/90">Ir a mi cuenta</Link>
              <Link to="/politica-privacidad" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-deep/20 px-6 font-semibold text-deep transition hover:bg-deep/5">Revisar política de privacidad</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
