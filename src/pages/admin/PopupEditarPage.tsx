import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import PopupForm from '../../components/admin/PopupForm'
import { fetchPopup, updatePopup } from '../../api/adminPopupsApi'
import type { Popup } from '../../types/admin'
import type { PopupFormValues } from '../../schemas/popup'
import { useToast } from '../../hooks/useToast'
import PageHeader from '../../components/ui/PageHeader'

function toFormFields(popup: Popup) {
  return {
    tipo: popup.tipo,
    texto: popup.texto,
    imagen_url: popup.imagen_url,
    video_url: popup.video_url ?? '',
    enlace: popup.enlace ?? '',
    paginas: popup.paginas,
    fecha_inicio: popup.fecha_inicio,
    fecha_fin: popup.fecha_fin,
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

      <PageHeader
        title="Editar popup"
        subtitle={
          popup?.estado === 'aprobado'
            ? 'Este popup ya está aprobado; si lo modificas deberá volver a enviarse a aprobación.'
            : 'Actualiza la información del popup.'
        }
      />

      <div className="max-w-2xl">
        <div
          className="rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)] sm:p-8"
          style={{ borderColor: 'var(--admin-color-border)' }}
        >
          {isLoading && <p className="py-10 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando popup...</p>}

          {isError && (
            <div className="py-10 text-center">
              <p className="mb-4 text-sm text-red-600">No se pudo cargar el popup.</p>
              <Link to="/admin/popups" className="font-semibold hover:underline" style={{ color: 'var(--admin-color-primary)' }}>Volver al listado</Link>
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
    </>
  )
}
