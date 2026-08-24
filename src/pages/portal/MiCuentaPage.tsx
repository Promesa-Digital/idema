import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { FiLock } from 'react-icons/fi'
import { fetchMiPerfil, actualizarDatosContacto } from '../../api/alumnoApi'
import { darDeBajaCuenta } from '../../api/cuentasAlumno'
import { datosContactoSchema, type DatosContactoValues } from '../../schemas/miCuenta'
import type { AlumnoPerfil } from '../../types/alumno'
import { useAuth } from '../../context/AuthContext'
import PageHeader from '../../components/ui/PageHeader'
import ConfirmModal from '../../components/ui/ConfirmModal'
import FieldError from '../../components/ui/FieldError'
import { useToast } from '../../hooks/useToast'

const PERFIL_QUERY_KEY = ['alumno', 'perfil'] as const

const cardClass =
  'rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)]'
const cardBorder = { borderColor: 'var(--admin-color-border)' }

const readOnlyClassName =
  'w-full rounded-lg border px-4 py-3 text-sm cursor-not-allowed bg-[var(--admin-color-bg-alt)]'
const editableClassName =
  'w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)] transition disabled:opacity-60'

interface ContactoFormProps {
  perfil: AlumnoPerfil
}

function ContactoForm({ perfil }: ContactoFormProps) {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState(perfil.email)
  const [telefono, setTelefono] = useState(perfil.telefono ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: DatosContactoValues) => actualizarDatosContacto(values),
    onSuccess: (data) => {
      queryClient.setQueryData(PERFIL_QUERY_KEY, data)
      setEmail(data.email)
      setTelefono(data.telefono ?? '')
      setFieldErrors({})
      setFormError(null)
      addToast('success', 'Datos actualizados', 'Tus datos de contacto se guardaron correctamente.')
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        setFieldErrors({ email: 'Este correo ya está registrado. Usa otro.' })
      } else {
        setFormError('No se pudieron guardar tus datos. Intenta nuevamente en unos segundos.')
      }
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = datosContactoSchema.safeParse({ email, telefono })
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0]
        if (typeof field === 'string' && !errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFormError(null)
    try {
      await mutation.mutateAsync(result.data)
    } catch {
      // el mensaje ya se fija en onError
    }
  }

  const handleChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value)
    const field = e.target.name
    setFieldErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setFormError(null)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {formError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {formError}
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="mb-1 flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
          <FiLock aria-hidden /> Datos de identidad
        </legend>

        <div>
          <label htmlFor="mi-cuenta-dni" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>DNI</label>
          <input
            id="mi-cuenta-dni" name="dni" value={perfil.dni}
            disabled readOnly aria-readonly className={readOnlyClassName}
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
          />
          <p className="mt-1.5 ml-1 text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>Este campo no se puede modificar.</p>
        </div>

        <div>
          <label htmlFor="mi-cuenta-nombres" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Nombres</label>
          <input
            id="mi-cuenta-nombres" name="nombres" value={perfil.nombres}
            disabled readOnly aria-readonly className={readOnlyClassName}
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
          />
        </div>

        <div>
          <label htmlFor="mi-cuenta-apellidos" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Apellidos</label>
          <input
            id="mi-cuenta-apellidos" name="apellidos" value={perfil.apellidos}
            disabled readOnly aria-readonly className={readOnlyClassName}
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
          />
          <p className="mt-1.5 ml-1 text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>Si necesitas corregir tu nombre o DNI, contáctanos.</p>
        </div>
      </fieldset>

      <div className="space-y-5 border-t pt-6" style={cardBorder}>
        <div>
          <label htmlFor="mi-cuenta-email" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Correo electrónico</label>
          <input
            id="mi-cuenta-email" type="email" name="email" value={email}
            onChange={handleChange(setEmail)} placeholder="tu@email.com" autoComplete="email"
            disabled={mutation.isPending}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'mi-cuenta-err-email' : undefined}
            className={editableClassName}
            style={{ borderColor: fieldErrors.email ? '#EF4444' : 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
          />
          <FieldError id="mi-cuenta-err-email" message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="mi-cuenta-telefono" className="mb-2 block text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>Celular</label>
          <input
            id="mi-cuenta-telefono" type="tel" name="telefono" value={telefono}
            onChange={handleChange(setTelefono)} placeholder="987654321" inputMode="numeric"
            disabled={mutation.isPending}
            aria-invalid={!!fieldErrors.telefono}
            aria-describedby={fieldErrors.telefono ? 'mi-cuenta-err-telefono' : undefined}
            className={editableClassName}
            style={{ borderColor: fieldErrors.telefono ? '#EF4444' : 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }}
          />
          <FieldError id="mi-cuenta-err-telefono" message={fieldErrors.telefono} />
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] disabled:opacity-70"
      >
        {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}

function ZonaDePeligro({ alumnoId }: { alumnoId: string }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const mutation = useMutation({
    mutationFn: () => darDeBajaCuenta(alumnoId),
    onSuccess: () => {
      addToast('success', 'Cuenta dada de baja', 'Tu cuenta fue dada de baja. Cerraremos tu sesión.')
      logout()
      navigate('/login', { replace: true })
    },
    onError: () => {
      addToast('error', 'No se pudo procesar la baja', 'Intenta nuevamente en unos segundos.')
      setIsConfirmOpen(false)
    },
  })

  return (
    <div className={`${cardClass} mt-6 border-red-200`}>
      <h2 className="text-base font-bold text-red-700">Zona de peligro</h2>
      <p className="mt-1 text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>
        Solicitar la baja de tu cuenta es un proceso irreversible: eliminará tu acceso a la plataforma académica.
      </p>
      <button
        type="button"
        onClick={() => setIsConfirmOpen(true)}
        className="mt-4 rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
      >
        Dar de baja mi cuenta
      </button>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Dar de baja tu cuenta"
        message="Esta acción es irreversible. Perderás el acceso a la plataforma académica y se cerrará tu sesión automáticamente. Si tienes historial académico o financiero, tus datos se conservarán de forma segura según la normativa vigente."
        variant="destructive"
        confirmLabel="Sí, dar de baja mi cuenta"
        isConfirming={mutation.isPending}
        onCancel={() => setIsConfirmOpen(false)}
        onConfirm={() => mutation.mutate()}
      />
    </div>
  )
}

export default function MiCuentaPage() {
  const { user } = useAuth()
  const { data: perfil, isLoading, isError } = useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: fetchMiPerfil,
  })

  return (
    <>
      <Helmet>
        <title>Mi cuenta - Portal - IDEMA</title>
      </Helmet>

      <PageHeader title="Mi Perfil" subtitle="Consulta tus datos y edita tu información de contacto." />

      <div className="max-w-2xl">
        <div className={cardClass} style={cardBorder}>
          {isLoading && <p className="py-16 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando tus datos...</p>}

          {isError && (
            <p className="py-16 text-center text-sm text-red-600">No se pudieron cargar tus datos. Intenta nuevamente.</p>
          )}

          {!isLoading && !isError && perfil && <ContactoForm key={perfil.id} perfil={perfil} />}
        </div>

        {user && <ZonaDePeligro alumnoId={user.id} />}
      </div>
    </>
  )
}
