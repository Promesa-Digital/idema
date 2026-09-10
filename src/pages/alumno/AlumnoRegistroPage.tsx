import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { ApiError } from '@/services/apiClient'
import { registrarAlumno } from '@/services/alumnoApi'
import type { AlumnoRegistro } from '@/types/backend'

const INITIAL_FORM: AlumnoRegistro = {
  nombres: '',
  apellido_paterno: '',
  apellido_materno: '',
  dni: '',
  correo: '',
  telefono: '',
  password: '',
  consentimiento: false,
}

export default function AlumnoRegistroPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(INITIAL_FORM)
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const setField = <K extends keyof AlumnoRegistro>(field: K, value: AlumnoRegistro[K]) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (form.password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setIsSubmitting(true)
    try {
      await registrarAlumno({ ...form, correo: form.correo.trim().toLowerCase() })
      navigate('/alumno/login', { replace: true, state: { registered: true } })
    } catch (caughtError) {
      setError(caughtError instanceof ApiError ? caughtError.message : 'No se pudo crear la cuenta.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-10 sm:py-14">
      <section className="mx-auto w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl sm:p-9">
        <div className="mb-7 text-center">
          <Link to="/" className="text-sm font-bold uppercase tracking-[0.2em] text-primary">IDEMA</Link>
          <h1 className="mt-2 text-3xl font-bold text-dark">Crea tu cuenta de alumno</h1>
          <p className="mt-2 text-slate-600">Usa tus datos reales para vincular correctamente tus pagos y matrículas.</p>
        </div>
        <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          <Input label="Nombres" value={form.nombres} onChange={(event) => setField('nombres', event.target.value)} minLength={2} maxLength={255} required disabled={isSubmitting} />
          <Input label="Apellido paterno" value={form.apellido_paterno} onChange={(event) => setField('apellido_paterno', event.target.value)} maxLength={100} required disabled={isSubmitting} />
          <Input label="Apellido materno" value={form.apellido_materno} onChange={(event) => setField('apellido_materno', event.target.value)} maxLength={100} disabled={isSubmitting} />
          <Input label="DNI" inputMode="numeric" pattern="[0-9]{8}" maxLength={8} value={form.dni} onChange={(event) => setField('dni', event.target.value.replace(/\D/g, ''))} hint="8 dígitos" required disabled={isSubmitting} />
          <Input label="Correo electrónico" type="email" autoComplete="email" value={form.correo} onChange={(event) => setField('correo', event.target.value)} required disabled={isSubmitting} />
          <Input label="Teléfono" type="tel" autoComplete="tel" minLength={6} maxLength={20} value={form.telefono} onChange={(event) => setField('telefono', event.target.value)} required disabled={isSubmitting} />
          <Input label="Contraseña" type="password" autoComplete="new-password" minLength={8} maxLength={100} value={form.password} onChange={(event) => setField('password', event.target.value)} hint="Mínimo 8 caracteres, un número y un símbolo" required disabled={isSubmitting} />
          <Input label="Confirmar contraseña" type="password" autoComplete="new-password" minLength={8} value={confirmacion} onChange={(event) => setConfirmacion(event.target.value)} required disabled={isSubmitting} />
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 sm:col-span-2">
            <input type="checkbox" className="mt-1 h-4 w-4 accent-primary" checked={form.consentimiento} onChange={(event) => setField('consentimiento', event.target.checked)} required disabled={isSubmitting} />
            <span>Acepto el tratamiento de mis datos personales conforme a la <Link to="/politica-privacidad" target="_blank" className="font-semibold text-primary hover:underline">Política de privacidad</Link> y la Ley N.° 29733.</span>
          </label>
          {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">{error}</div>}
          <div className="sm:col-span-2"><Button type="submit" size="lg" fullWidth isLoading={isSubmitting}>Crear cuenta</Button></div>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">¿Ya tienes cuenta? <Link to="/alumno/login" className="font-semibold text-primary hover:underline">Inicia sesión</Link></p>
      </section>
    </main>
  )
}
