import { Helmet } from 'react-helmet-async'

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Iniciar sesión - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Iniciar sesión</h1>
          <p className="text-white/60">
            El formulario de inicio de sesión estará disponible próximamente.
          </p>
        </div>
      </div>
    </>
  )
}
