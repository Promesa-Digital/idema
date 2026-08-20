import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import ConceptoCobroForm from '../../components/admin/ConceptoCobroForm'
import { createConceptoCobro } from '../../api/adminConceptosCobroApi'
import type { ConceptoCobroFormValues } from '../../schemas/conceptoCobro'
import { useToast } from '../../hooks/useToast'

export default function ConceptoCobroNuevoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: ConceptoCobroFormValues) => createConceptoCobro(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'conceptos-cobro'] })
      addToast('success', 'Concepto creado', 'El concepto ya está disponible para generar órdenes.')
      navigate('/admin/conceptos-cobro')
    },
    onError: () => setSubmitError('No se pudo crear el concepto. Intenta nuevamente.'),
  })

  return (
    <>
      <Helmet>
        <title>Nuevo concepto de cobro - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Nuevo concepto de cobro</h1>
          <p className="text-white/80 mb-8">Define el nombre, el monto y el tipo del concepto.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            <ConceptoCobroForm
              submitLabel="Crear concepto"
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
