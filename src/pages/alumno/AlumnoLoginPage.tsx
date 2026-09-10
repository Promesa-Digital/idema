import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SystemStatusBadge from '@/components/ui/SystemStatusBadge'
import { useAlumnoAuth } from '@/context/AlumnoAuthContextType'
import { ApiError } from '@/services/apiClient'

interface LoginLocationState {
  from?: string
  registered?: boolean
}

export default function AlumnoLoginPage() {
  const { alumno, isLoading, login } = useAlumnoAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LoginLocationState | null
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && alumno) navigate('/alumno/mi-cuenta', { replace: true })
  }, [alumno, isLoading, navigate])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(correo.trim(), password)
      navigate(state?.from ?? '/alumno/mi-cuenta', { replace: true })
    } catch (caughtError) {
      setError(
        caughtError instanceof ApiError
          ? caughtError.message
          : 'No se pudo iniciar sesión. Inténtalo nuevamente.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !isSubmitting) return <LoadingSpinner />

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-dark px-4 py-12">
      <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cta/15 blur-3xl" />
      <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-7 text-center">
          <Link to="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            IDEMA
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-dark">Mi cuenta de alumno</h1>
          <p className="mt-2 text-slate-600">Consulta tus pagos, matrículas y electivos.</p>
          <div className="mt-4 flex justify-center"><SystemStatusBadge /></div>
        </div>

        {state?.registered && (
          <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Tu cuenta fue creada. Revisa tu correo para verificarla y luego inicia sesión.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input label="Correo electrónico" type="email" autoComplete="username" value={correo} onChange={(event) => setCorreo(event.target.value)} required disabled={isSubmitting} />
          <Input label="Contraseña" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting} />
          <div className="-mt-2 text-right"><Link to="/recuperar-password" className="text-sm font-semibold text-primary hover:underline">¿Olvidaste tu contraseña?</Link></div>
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>Iniciar sesión</Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          ¿Aún no tienes cuenta?{' '}
          <Link to="/alumno/registro" className="font-semibold text-primary hover:underline">Regístrate</Link>
        </p>
        <p className="mt-3 text-center text-sm"><Link to="/" className="text-slate-500 hover:text-dark">Volver al sitio web</Link></p>
      </section>
    </main>
  )
}
