import { useState, type ReactNode } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { FiLock, FiMail, FiShield, FiAlertTriangle, FiArrowRight } from 'react-icons/fi'
import { fetchMiPerfil, actualizarDatosContacto, actualizarPassword, PERFIL_QUERY_KEY } from '../../api/alumnoApi'
import { darDeBajaCuenta } from '../../api/cuentasAlumno'
import { datosContactoSchema, passwordSchema, type DatosContactoValues, type PasswordValues } from '../../schemas/miCuenta'
import type { AlumnoPerfil } from '../../types/alumno'
import { useAuth } from '../../context/AuthContext'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import FormInput from '../../components/ui/FormInput'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../hooks/useToast'

const cardClass = 'rounded-[var(--radius-md)] bg-[var(--color-bg-card)] p-6'

function initials(nombres: string, apellidos: string): string {
  return `${nombres.trim().charAt(0)}${apellidos.trim().charAt(0)}`.toUpperCase()
}

function ReadonlyField({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" aria-hidden>
            {icon}
          </span>
        )}
        <input
          value={value}
          readOnly
          className={`w-full cursor-default rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-page)] py-[10px] text-sm text-[var(--color-text-main)] outline-none ${icon ? 'pl-9 pr-[14px]' : 'px-[14px]'}`}
          style={{ fontFamily: 'var(--font-body)' }}
        />
      </div>
    </div>
  )
}

function CardTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-base font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
      <span className="text-[var(--color-primary)]" aria-hidden>{icon}</span>
      {children}
    </h2>
  )
}

// ---------------------------------------------------------------------------
// Columna izquierda: perfil
// ---------------------------------------------------------------------------
function PerfilCard({ perfil }: { perfil: AlumnoPerfil }) {
  return (
    <div className={cardClass}>
      <div className="flex flex-col items-center text-center">
        <span
          className="flex h-20 w-20 items-center justify-center rounded-full text-[28px] font-bold text-white"
          style={{ backgroundColor: 'var(--color-primary)', fontFamily: 'var(--font-headline)' }}
          aria-hidden
        >
          {initials(perfil.nombres, perfil.apellidos)}
        </span>
        <p className="mt-3 text-xl font-bold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
          {perfil.nombres} {perfil.apellidos}
        </p>
        <div className="mt-2">
          <Badge value={perfil.estado} label={perfil.estado === 'activa' ? 'Estudiante Activo' : 'Estudiante Inactivo'} />
        </div>
      </div>

      <hr className="my-6 border-[var(--color-border)]" />

      <div className="space-y-4">
        <ReadonlyField label="DNI" value={perfil.dni} icon={<FiLock className="h-4 w-4" />} />
        <ReadonlyField label="Nombres" value={perfil.nombres} />
        <ReadonlyField label="Apellidos" value={perfil.apellidos} />
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Los datos de identidad provienen de los registros oficiales y no son editables.
        </p>
      </div>

      <hr className="my-6 border-[var(--color-border)]" />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-main)]" style={{ fontFamily: 'var(--font-headline)' }}>
          Privacidad y Consentimiento
        </h3>
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Al utilizar esta plataforma, usted consiente el tratamiento de sus datos personales según nuestra política institucional de privacidad.
        </p>
        <a
          href="/politica-privacidad"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          Ver Política de Privacidad <FiArrowRight className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Columna derecha: datos de contacto
// ---------------------------------------------------------------------------
function DatosContactoCard({ perfil }: { perfil: AlumnoPerfil }) {
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

  const handleSubmit = (e: React.FormEvent) => {
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
    mutation.mutate(result.data)
  }

  return (
    <div className={cardClass}>
      <CardTitle icon={<FiMail className="h-5 w-5" />}>Datos de Contacto</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{formError}</p>}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            label="Correo Electrónico Personal"
            type="email"
            value={email}
            onChange={(v) => { setEmail(v); setFieldErrors((p) => { const n = { ...p }; delete n.email; return n }) }}
            error={fieldErrors.email}
            disabled={mutation.isPending}
          />
          <ReadonlyField label="Correo Institucional" value={email} icon={<FiLock className="h-4 w-4" />} />
          <div className="sm:col-span-2">
            <FormInput
              label="Teléfono Móvil"
              type="tel"
              value={telefono}
              onChange={(v) => { setTelefono(v); setFieldErrors((p) => { const n = { ...p }; delete n.telefono; return n }) }}
              error={fieldErrors.telefono}
              disabled={mutation.isPending}
              hint="9 dígitos, empieza con 9."
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Columna derecha: seguridad
// ---------------------------------------------------------------------------
const emptyPasswordForm = { passwordActual: '', passwordNueva: '', passwordConfirmar: '' }

function SeguridadCard() {
  const { addToast } = useToast()
  const [values, setValues] = useState(emptyPasswordForm)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: PasswordValues) => actualizarPassword(values),
    onSuccess: () => {
      setValues(emptyPasswordForm)
      setFieldErrors({})
      setFormError(null)
      addToast('success', 'Contraseña actualizada', 'Tu contraseña se actualizó correctamente.')
    },
    onError: (error) => {
      if (isAxiosError(error) && error.response?.status === 401) {
        setFieldErrors({ passwordActual: 'La contraseña actual no es correcta.' })
      } else {
        setFormError('No se pudo actualizar tu contraseña. Intenta nuevamente en unos segundos.')
      }
    },
  })

  const change = (field: keyof typeof values, val: string) => {
    setValues((v) => ({ ...v, [field]: val }))
    setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const result = passwordSchema.safeParse(values)
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
    mutation.mutate(result.data)
  }

  return (
    <div className={cardClass}>
      <CardTitle icon={<FiShield className="h-5 w-5" />}>Seguridad</CardTitle>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && <p className="rounded-[var(--radius-sm)] bg-[#FEE2E2] p-3 text-sm text-[var(--color-error)]">{formError}</p>}

        <FormInput
          label="Contraseña Actual"
          type="password"
          value={values.passwordActual}
          onChange={(v) => change('passwordActual', v)}
          error={fieldErrors.passwordActual}
          disabled={mutation.isPending}
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormInput
            label="Nueva Contraseña"
            type="password"
            value={values.passwordNueva}
            onChange={(v) => change('passwordNueva', v)}
            error={fieldErrors.passwordNueva}
            disabled={mutation.isPending}
          />
          <FormInput
            label="Confirmar Contraseña"
            type="password"
            value={values.passwordConfirmar}
            onChange={(v) => change('passwordConfirmar', v)}
            error={fieldErrors.passwordConfirmar}
            disabled={mutation.isPending}
          />
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)]">
          La contraseña debe tener al menos 8 caracteres, incluir un número y un símbolo.
        </p>

        <div className="flex justify-end">
          <Button type="submit" variant="outlined" disabled={mutation.isPending}>
            {mutation.isPending ? 'Actualizando...' : 'Actualizar Contraseña'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Columna derecha: zona de peligro
// ---------------------------------------------------------------------------
function ZonaDePeligroCard({ alumnoId }: { alumnoId: string }) {
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
    <div className="rounded-[var(--radius-md)] border border-[#FECACA] bg-[#FFF1F1] p-6">
      <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-[var(--color-error)]" style={{ fontFamily: 'var(--font-headline)' }}>
        <FiAlertTriangle className="h-5 w-5" aria-hidden /> Zona de Peligro
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)]">
        Solicitar la baja de la cuenta es un proceso irreversible que eliminará el acceso a la plataforma académica. Se requerirá confirmación administrativa.
      </p>
      <div className="mt-4 flex justify-end">
        <Button variant="destructive" onClick={() => setIsConfirmOpen(true)}>
          Solicitar Baja de Cuenta
        </Button>
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        title="Dar de baja tu cuenta"
        message="Esta acción es irreversible. Perderás el acceso a la plataforma académica y se cerrará tu sesión automáticamente. Si tienes historial académico o financiero, tus datos se conservarán de forma segura según la normativa vigente."
        variant="destructive"
        confirmText="Sí, dar de baja mi cuenta"
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

      {isLoading && <p className="py-16 text-center text-sm text-[var(--color-text-secondary)]">Cargando tus datos...</p>}

      {isError && <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar tus datos. Intenta nuevamente.</p>}

      {!isLoading && !isError && perfil && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-10">
          <div className="lg:col-span-3">
            <PerfilCard perfil={perfil} />
          </div>
          <div className="space-y-6 lg:col-span-7">
            <DatosContactoCard key={perfil.id} perfil={perfil} />
            <SeguridadCard />
            {user && <ZonaDePeligroCard alumnoId={user.id} />}
          </div>
        </div>
      )}
    </>
  )
}
