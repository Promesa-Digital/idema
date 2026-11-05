import { FiTool } from 'react-icons/fi'
import { Link } from 'react-router-dom'

export default function ModuleUnderDevelopmentPage() {
  return (
    <main className="grid min-h-[calc(100vh-5rem)] place-items-center px-4 py-12">
      <section className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <FiTool className="h-6 w-6" aria-hidden="true" />
        </span>
        <p className="mt-5 text-sm font-bold uppercase tracking-widest text-amber-700">
          En desarrollo
        </p>
        <h2 className="mt-2 text-3xl font-bold text-dark">Módulo no disponible</h2>
        <p className="mt-3 text-slate-600">
          Estamos terminando esta función. El acceso permanecerá bloqueado hasta que esté
          lista para su uso.
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-deep px-5 py-2 text-sm font-semibold text-white transition hover:bg-deep/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2"
        >
          Volver al panel
        </Link>
      </section>
    </main>
  )
}
