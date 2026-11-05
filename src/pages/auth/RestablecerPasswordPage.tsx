import { useState } from 'react'
import type { FormEvent } from 'react'
import { FiCheckCircle, FiLock } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { restablecerPassword } from '@/services/authApi'
import { ApiError } from '@/services/apiClient'

export default function RestablecerPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(token ? '' : 'El enlace de recuperación está incompleto.')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await restablecerPassword(token, password)
      setMessage(response.mensaje)
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo actualizar la contraseña.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-surface px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl sm:p-9">
        <div className="text-center">
          <div className={`mx-auto grid h-14 w-14 place-items-center rounded-2xl ${message ? 'bg-emerald-50 text-emerald-600' : 'bg-primary/10 text-primary'}`}>{message ? <FiCheckCircle className="h-7 w-7" /> : <FiLock className="h-6 w-6" />}</div>
          <h1 className="mt-5 text-3xl font-bold text-dark">{message ? 'Contraseña actualizada' : 'Crea una nueva contraseña'}</h1>
          <p className="mt-2 text-slate-600">{message || 'Debe tener al menos ocho caracteres, un número y un símbolo.'}</p>
        </div>

        {!message && (
          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <Input label="Nueva contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={100} value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting || !token} />
            <Input label="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={100} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required disabled={isSubmitting || !token} />
            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
            <Button type="submit" size="lg" fullWidth isLoading={isSubmitting} disabled={!token}>Actualizar contraseña</Button>
          </form>
        )}

        <div className="mt-7 flex justify-center gap-5 text-sm"><Link to="/alumno/login" className="font-semibold text-primary hover:underline">Ingresar como alumno</Link><Link to="/admin/login" className="font-semibold text-slate-500 hover:text-dark">Ingresar como personal</Link></div>
      </section>
    </main>
  )
}
