import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FieldError from '../ui/FieldError'
import { useAuth } from '../../context/AuthContext'
import { login as loginRequest } from '../../api/authApi'
import { loginSchema } from '../../schemas/login'
import type { UserRole } from '../../types/auth'

const DASHBOARD_BY_ROLE: Record<UserRole, string> = {
  alumno: '/portal',
  staff: '/admin',
  academico: '/admin/programas',
  director_marketing: '/admin/popups',
}

interface LoginFormData {
  email: string
  password: string
}

const emptyForm: LoginFormData = { email: '', password: '' }

export default function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [formData, setFormData] = useState<LoginFormData>(emptyForm)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
    if (formError) setFormError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const result = loginSchema.safeParse(formData)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !fieldErrors[field]) fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const { accessToken, refreshToken } = await loginRequest(result.data)
      const user = login(accessToken, refreshToken)
      navigate(user ? DASHBOARD_BY_ROLE[user.role] : '/', { replace: true })
    } catch {
      setFormError('Correo o contraseña incorrectos.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {formError && (
        <div className="bg-rose-500/15 border border-rose-400/40 text-rose-50 px-4 py-3 rounded-lg text-sm" role="alert">
          {formError}
        </div>
      )}

      <div>
        <label htmlFor="login-email" className="block text-white text-sm font-semibold mb-2">Correo electrónico</label>
        <input
          id="login-email" type="email" name="email" value={formData.email}
          onChange={handleChange} placeholder="tu@email.com" autoComplete="email" disabled={isSubmitting}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'login-err-email' : undefined}
          className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.email ? 'ring-2 ring-rose-400' : ''}`}
        />
        <FieldError id="login-err-email" message={errors.email} />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-white text-sm font-semibold mb-2">Contraseña</label>
        <input
          id="login-password" type="password" name="password" value={formData.password}
          onChange={handleChange} placeholder="Tu contraseña" autoComplete="current-password" disabled={isSubmitting}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'login-err-password' : undefined}
          className={`w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60 ${errors.password ? 'ring-2 ring-rose-400' : ''}`}
        />
        <FieldError id="login-err-password" message={errors.password} />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSubmitting && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        {isSubmitting ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  )
}
