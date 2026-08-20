import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'

export default function AdminPage() {
  return (
    <>
      <Helmet>
        <title>Administración - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Panel de administración</h1>
          <p className="text-white/60 mb-8">Sección exclusiva para staff.</p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/admin/programas"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Gestionar programas
            </Link>
            <Link
              to="/admin/popups"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Gestionar popups
            </Link>
            <Link
              to="/admin/ordenes"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Gestionar órdenes
            </Link>
            <Link
              to="/admin/conceptos-cobro"
              className="inline-flex items-center gap-2 px-6 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300"
            >
              Gestionar conceptos de cobro
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
