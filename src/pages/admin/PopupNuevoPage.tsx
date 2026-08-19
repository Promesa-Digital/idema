import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import PopupForm from '../../components/admin/PopupForm'
import { createPopup } from '../../api/adminPopupsApi'
import type { PopupFormValues } from '../../schemas/popup'
import { useToast } from '../../hooks/useToast'

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

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Nuevo popup</h1>
          <p className="text-white/80 mb-8">Se guarda como borrador; luego podrás enviarlo a aprobación.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
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
      </div>
    </>
  )
}
