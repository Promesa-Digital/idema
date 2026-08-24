import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PopupForm from '../../components/admin/PopupForm'
import { createPopup } from '../../api/adminPopupsApi'
import type { PopupFormValues } from '../../schemas/popup'
import { useToast } from '../../hooks/useToast'
import PageHeader from '../../components/ui/PageHeader'

export default function PopupNuevoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: PopupFormValues) => createPopup(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'popups'] })
      addToast('success', 'Popup creado', 'Se guardó como borrador. Envíalo a aprobación cuando esté listo.')
      navigate('/admin/popups')
    },
    onError: () => setSubmitError('No se pudo crear el popup. Intenta nuevamente.'),
  })

  return (
    <>
      <Helmet>
        <title>Nuevo popup - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Nuevo popup" subtitle="Se guarda como borrador; luego podrás enviarlo a aprobación." />

      <div className="max-w-2xl">
        <div
          className="rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)] sm:p-8"
          style={{ borderColor: 'var(--admin-color-border)' }}
        >
          <PopupForm
            submitLabel="Crear popup"
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
        </div>
      </div>
    </>
  )
}
