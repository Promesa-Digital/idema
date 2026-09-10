import { useState } from 'react'
import type { FormEvent } from 'react'
import { FiArrowLeft, FiMail } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import SystemStatusBadge from '@/components/ui/SystemStatusBadge'
import { solicitarRecuperacionPassword } from '@/services/authApi'
import { ApiError } from '@/services/apiClient'

export default function RecuperarPasswordPage() {
  const [correo, setCorreo] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const response = await solicitarRecuperacionPassword(correo.trim().toLowerCase())
      setMessage(response.mensaje)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo procesar la solicitud.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-dark px-4 py-12">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cta/15 blur-3xl" />
      <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><FiMail className="h-6 w-6" /></div>
          <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em] text-primary">IDEMA</p>
          <h1 className="mt-2 text-3xl font-bold text-dark">Recupera tu contraseña</h1>
          <p className="mt-2 text-slate-600">Te enviaremos un enlace seguro que vencerá en 30 minutos.</p>
          <div className="mt-4"><SystemStatusBadge /></div>
        </div>

        {message ? (
          <div className="mt-7 space-y-5">
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">{message}</div>
            <p className="text-center text-sm text-slate-500">Revisa también tu carpeta de correo no deseado.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Input label="Correo electrónico" type="email" autoComplete="email" value={correo} onChange={(event) => setCorreo(event.target.value)} required disabled={isSubmitting} />
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>Enviar instrucciones</Button>
          </form>
        )}

        <div className="mt-7 flex justify-center gap-5 text-sm">
          <Link to="/alumno/login" className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"><FiArrowLeft /> Acceso alumno</Link>
          <Link to="/admin/login" className="font-semibold text-slate-500 hover:text-dark">Acceso administrativo</Link>
        </div>
      </section>
    </main>
  )
}
