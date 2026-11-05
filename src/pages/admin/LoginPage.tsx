import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import SystemStatusBadge from '@/components/ui/SystemStatusBadge'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'

interface LoginLocationState {
  from?: string
}

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const destination = (location.state as LoginLocationState | null)?.from ?? '/admin'

  useEffect(() => {
    if (!isLoading && user) navigate('/admin', { replace: true })
  }, [isLoading, navigate, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(correo.trim(), password)
      navigate(destination, { replace: true })
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
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-cta/15 blur-3xl" />

      <section className="relative z-10 w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mb-8 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.2em] text-primary">IDEMA</p>
          <h1 className="text-3xl font-bold text-dark">Panel administrativo</h1>
          <p className="mt-2 text-slate-600">Ingresa con tu cuenta institucional.</p>
          <div className="mt-4 flex justify-center"><SystemStatusBadge /></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Correo electrónico"
            type="email"
            name="correo"
            autoComplete="username"
            value={correo}
            onChange={(event) => setCorreo(event.target.value)}
            placeholder="nombre@idema.edu.pe"
            required
            disabled={isSubmitting}
          />
          <Input
            label="Contraseña"
            type="password"
            name="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={isSubmitting}
          />
          <div className="-mt-2 text-right"><Link to="/recuperar-password" className="text-sm font-semibold text-primary hover:underline">¿Olvidaste tu contraseña?</Link></div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>
            Iniciar sesión
          </Button>
        </form>
      </section>
    </main>
  )
}
