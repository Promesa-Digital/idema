import { Helmet } from 'react-helmet-async'
import LoginForm from '../components/auth/LoginForm'

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
            <p className="text-white/80">Ingresa con tu cuenta de alumno o staff.</p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            <LoginForm />
          </div>
        </div>
      </div>
    </>
  )
}
