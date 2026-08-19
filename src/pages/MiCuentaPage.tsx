import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { FiLock } from 'react-icons/fi'
import { fetchMiPerfil, actualizarDatosContacto } from '../api/alumnoApi'
import { datosContactoSchema, type DatosContactoValues } from '../schemas/miCuenta'
import type { AlumnoPerfil } from '../types/alumno'
import FieldError from '../components/ui/FieldError'
import { useToast } from '../hooks/useToast'

const PERFIL_QUERY_KEY = ['alumno', 'perfil'] as const

const readOnlyClassName =
  'w-full px-4 py-3 rounded-lg bg-white/5 text-white/40 placeholder-deep/50 cursor-not-allowed transition'
const editableClassName =
  'w-full px-4 py-3 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition disabled:opacity-60'

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
        <div className="bg-rose-500/15 border border-rose-400/40 text-rose-50 px-4 py-3 rounded-lg text-sm" role="alert">
          {formError}
        </div>
      )}

      <fieldset className="space-y-5">
        <legend className="text-white text-sm font-semibold mb-1 flex items-center gap-2">
          <FiLock aria-hidden /> Datos de identidad
        </legend>

        <div>
          <label htmlFor="mi-cuenta-dni" className="block text-white text-sm font-semibold mb-2">DNI</label>
          <input
            id="mi-cuenta-dni" name="dni" value={perfil.dni}
            disabled readOnly aria-readonly className={readOnlyClassName}
          />
          <p className="mt-1.5 ml-1 text-[11px] text-white/40">Este campo no se puede modificar.</p>
        </div>

        <div>
          <label htmlFor="mi-cuenta-nombres" className="block text-white text-sm font-semibold mb-2">Nombres</label>
          <input
            id="mi-cuenta-nombres" name="nombres" value={perfil.nombres}
            disabled readOnly aria-readonly className={readOnlyClassName}
          />
        </div>

        <div>
          <label htmlFor="mi-cuenta-apellidos" className="block text-white text-sm font-semibold mb-2">Apellidos</label>
          <input
            id="mi-cuenta-apellidos" name="apellidos" value={perfil.apellidos}
            disabled readOnly aria-readonly className={readOnlyClassName}
          />
          <p className="mt-1.5 ml-1 text-[11px] text-white/40">Si necesitas corregir tu nombre o DNI, contáctanos.</p>
        </div>
      </fieldset>

      <div className="border-t border-white/10 pt-6 space-y-5">
        <div>
          <label htmlFor="mi-cuenta-email" className="block text-white text-sm font-semibold mb-2">Correo electrónico</label>
          <input
            id="mi-cuenta-email" type="email" name="email" value={email}
            onChange={handleChange(setEmail)} placeholder="tu@email.com" autoComplete="email"
            disabled={mutation.isPending}
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'mi-cuenta-err-email' : undefined}
            className={`${editableClassName} ${fieldErrors.email ? 'ring-2 ring-rose-400' : ''}`}
          />
          <FieldError id="mi-cuenta-err-email" message={fieldErrors.email} />
        </div>

        <div>
          <label htmlFor="mi-cuenta-telefono" className="block text-white text-sm font-semibold mb-2">Celular</label>
          <input
            id="mi-cuenta-telefono" type="tel" name="telefono" value={telefono}
            onChange={handleChange(setTelefono)} placeholder="987654321" inputMode="numeric"
            disabled={mutation.isPending}
            aria-invalid={!!fieldErrors.telefono}
            aria-describedby={fieldErrors.telefono ? 'mi-cuenta-err-telefono' : undefined}
            className={`${editableClassName} ${fieldErrors.telefono ? 'ring-2 ring-rose-400' : ''}`}
          />
          <FieldError id="mi-cuenta-err-telefono" message={fieldErrors.telefono} />
        </div>
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full px-6 py-3 sm:py-4 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {mutation.isPending && (
          <span className="inline-block w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" aria-hidden />
        )}
        {mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </form>
  )
}

export default function MiCuentaPage() {
  const { data: perfil, isLoading, isError } = useQuery({
    queryKey: PERFIL_QUERY_KEY,
    queryFn: fetchMiPerfil,
  })

  return (
    <>
      <Helmet>
        <title>Mi cuenta - Portal - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Mi cuenta</h1>
          <p className="text-white/80 mb-8">Consulta tus datos y edita tu información de contacto.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando tus datos...</p>}

            {isError && (
              <p className="text-rose-300 text-center py-16">
                No se pudieron cargar tus datos. Intenta nuevamente.
              </p>
            )}

            {!isLoading && !isError && perfil && (
              <ContactoForm key={perfil.id} perfil={perfil} />
            )}
          </div>
        </div>
      </div>
    </>
  )
}