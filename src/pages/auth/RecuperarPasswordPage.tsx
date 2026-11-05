import { FiArrowLeft, FiExternalLink, FiHelpCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'

const JIRA_TICKETS_URL = 'https://idemaoficial.atlassian.net/jira/software/projects/TICKET/boards/34?filter=&groupBy=none'

export default function RecuperarPasswordPage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-dark px-4 py-12">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cta/15 blur-3xl" />
      <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FiHelpCircle className="h-6 w-6" /></div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-primary">IDEMA</p>
          <h1 className="mt-2 text-3xl font-bold text-dark">Recupera tu acceso</h1>
          <p className="mt-2 text-slate-600">
            Solicita al equipo de soporte que habilite tu cuenta mediante un ticket en Jira.
          </p>
        </div>

        <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-semibold text-dark">Información para el ticket</p>
          <p className="mt-1 leading-6 text-slate-600">
            Indica tu nombre, correo registrado y si accedes como alumno o personal administrativo.
            Nunca incluyas tu contraseña.
          </p>
          <a
            href={JIRA_TICKETS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-deep px-4 py-2 text-center font-semibold text-white transition-colors hover:bg-deep/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-deep focus-visible:ring-offset-2"
          >
            Abrir Jira para crear un ticket
            <FiExternalLink aria-hidden="true" />
          </a>
          <p className="mt-2 text-xs text-slate-500">Necesitas una cuenta con acceso al proyecto TICKET.</p>
        </div>

        <div className="mt-7 flex justify-center text-sm">
          <Link to="/admin/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><FiArrowLeft /> Acceso administrativo</Link>
        </div>
      </section>
    </main>
  )
}
