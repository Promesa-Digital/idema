import { Helmet } from 'react-helmet-async'
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
          <p className="text-white/60">
            Bienvenido, {user?.role === 'staff' ? 'colaborador' : 'alumno'}.
          </p>
        </div>
      </div>
    </>
  )
}
