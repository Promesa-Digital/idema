import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PopupForm from '../../components/admin/PopupForm'
import { fetchPopup, updatePopup } from '../../api/adminPopupsApi'
import type { Popup } from '../../types/admin'
import type { PopupFormValues } from '../../schemas/popup'
import { useToast } from '../../hooks/useToast'

function toFormFields(popup: Popup) {
  return {
    image: popup.image,
    alt: popup.alt,
    startDate: popup.startDate ?? '',
    endDate: popup.endDate ?? '',
    frequency: popup.frequency,
    pages: popup.pages.join(', '),
    ctaLabel: popup.cta?.label ?? '',
    ctaHref: popup.cta?.href ?? '',
    ctaExternal: popup.cta?.external ?? false,
  }
}

export default function PopupEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: popup, isLoading, isError } = useQuery({
    queryKey: ['admin', 'popups', id],
    queryFn: () => fetchPopup(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: PopupFormValues) => updatePopup(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'popups'] })
      addToast('success', 'Popup actualizado', 'Los cambios se guardaron correctamente.')
      navigate('/admin/popups')
    },
    onError: () => setSubmitError('No se pudo guardar los cambios. Intenta nuevamente.'),
  })

  return (
    <>
      <Helmet>
        <title>Editar popup - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Editar popup</h1>
          <p className="text-white/80 mb-8">
            {popup?.estado === 'aprobado'
              ? 'Este popup ya está aprobado; si lo modificas deberá volver a enviarse a aprobación.'
              : 'Actualiza la información del popup.'}
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            {isLoading && <p className="text-white/60 text-center py-10">Cargando popup...</p>}

            {isError && (
              <div className="text-center py-10">
                <p className="text-rose-300 mb-4">No se pudo cargar el popup.</p>
                <Link to="/admin/popups" className="text-primary font-semibold hover:underline">Volver al listado</Link>
              </div>
            )}

            {popup && (
              <PopupForm
                initialValues={toFormFields(popup)}
                submitLabel="Guardar cambios"
                submitError={submitError}
                onSubmit={async (values) => {
                  setSubmitError(null)
                  try {
                    await mutation.mutateAsync(values)
                  } catch {
                    // el mensaje ya se fija en onError
                  }
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}
