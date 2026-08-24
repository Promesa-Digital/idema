import { Helmet } from 'react-helmet-async'
import LoginForm from '../components/auth/LoginForm'
import { Link } from 'react-router-dom'

export default function LoginPage() {
  return (
    <>
      <Helmet>
        <title>Iniciar sesión - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark flex items-center justify-center px-6 py-24">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Iniciar sesión</h1>
            <p className="text-white/80">Ingresa con tus credenciales.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            <LoginForm />
            <p className="mt-6 text-center text-sm text-white/70">
              ¿Aún no tienes cuenta?{' '}
              <Link to="/registro" className="font-semibold text-primary hover:underline">
                Regístrate como alumno
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
