import { useEffect, useState } from 'react'
import { FiAlertCircle, FiCheckCircle, FiLoader } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import { verificarCorreo } from '@/services/authApi'
import { ApiError } from '@/services/apiClient'

type VerificationState = 'loading' | 'success' | 'error'

export default function VerificarCorreoPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [state, setState] = useState<VerificationState>(token ? 'loading' : 'error')
  const [message, setMessage] = useState(token ? 'Estamos verificando tu correo.' : 'El enlace de verificación está incompleto.')

  useEffect(() => {
    if (!token) return
    let active = true
    void verificarCorreo(token)
      .then((response) => {
        if (active) {
          setState('success')
          setMessage(response.mensaje)
        }
      })
      .catch((caughtError: unknown) => {
        if (active) {
          setState('error')
          setMessage(caughtError instanceof ApiError ? caughtError.message : 'No se pudo verificar el correo.')
        }
      })
    return () => {
      active = false
    }
  }, [token])

  const Icon = state === 'loading' ? FiLoader : state === 'success' ? FiCheckCircle : FiAlertCircle
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${state === 'success' ? 'bg-emerald-50 text-emerald-600' : state === 'error' ? 'bg-red-50 text-red-600' : 'bg-primary/10 text-primary'}`}><Icon className={`h-8 w-8 ${state === 'loading' ? 'animate-spin' : ''}`} /></div>
        <h1 className="mt-6 text-3xl font-bold text-dark">{state === 'success' ? 'Correo verificado' : state === 'error' ? 'No se pudo verificar' : 'Verificando correo'}</h1>
        <p className="mt-3 leading-7 text-slate-600">{message}</p>
        <div className="mt-7 flex justify-center gap-5"><Link to="/alumno/login" className="font-semibold text-primary hover:underline">Acceso alumno</Link><Link to="/admin/login" className="font-semibold text-slate-500 hover:text-dark">Acceso administrativo</Link></div>
      </section>
    </main>
  )
}
