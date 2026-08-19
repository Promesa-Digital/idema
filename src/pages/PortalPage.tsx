import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiUser } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'

export default function PortalPage() {
  const { user } = useAuth()

  return (
    <>
      <Helmet>
        <title>Portal - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Portal del estudiante</h1>
          <p className="text-white/60 mb-8">
            Bienvenido, {user?.role === 'staff' ? 'colaborador' : 'alumno'}.
          </p>

          <Link
            to="/portal/mi-cuenta"
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
          >
            <FiUser aria-hidden /> Mi cuenta
          </Link>
        </div>
      </div>
    </>
  )
}
