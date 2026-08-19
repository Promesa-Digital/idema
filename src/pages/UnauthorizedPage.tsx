import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function UnauthorizedPage() {
  return (
    <>
      <Helmet>
        <title>Acceso no autorizado - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Acceso no autorizado</h1>
          <p className="text-white/60 mb-8">
            Tu cuenta no tiene permisos para ver esta sección.
          </p>
          <Link to="/" className="text-primary font-semibold hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    </>
  )
}
