import { Helmet } from 'react-helmet-async'

export default function AdminPage() {
  return (
    <>
      <Helmet>
        <title>Administración - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Panel de administración</h1>
          <p className="text-white/60">Sección exclusiva para staff.</p>
        </div>
      </div>
    </>
  )
}
