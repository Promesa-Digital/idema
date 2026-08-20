import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ConceptoCobroForm from '../../components/admin/ConceptoCobroForm'
import { fetchConceptoCobro, updateConceptoCobro } from '../../api/adminConceptosCobroApi'
import type { ConceptoCobro } from '../../types/admin'
import type { ConceptoCobroFormValues } from '../../schemas/conceptoCobro'
import { useToast } from '../../hooks/useToast'

function toFormFields(concepto: ConceptoCobro) {
  return {
    nombre: concepto.nombre,
    monto: String(concepto.monto),
    tipo: concepto.tipo,
  }
}

export default function ConceptoCobroEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: concepto, isLoading, isError } = useQuery({
    queryKey: ['admin', 'conceptos-cobro', id],
    queryFn: () => fetchConceptoCobro(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: ConceptoCobroFormValues) => updateConceptoCobro(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'conceptos-cobro'] })
      addToast('success', 'Concepto actualizado', 'Los cambios se guardaron correctamente.')
      navigate('/admin/conceptos-cobro')
    },
    onError: () => setSubmitError('No se pudo guardar los cambios. Intenta nuevamente.'),
  })

  return (
    <>
      <Helmet>
        <title>Editar concepto de cobro - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Editar concepto de cobro</h1>
          <p className="text-white/80 mb-8">Actualiza el nombre, el monto o el tipo del concepto.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            {isLoading && <p className="text-white/60 text-center py-10">Cargando concepto...</p>}

            {isError && (
              <div className="text-center py-10">
                <p className="text-rose-300 mb-4">No se pudo cargar el concepto.</p>
                <Link to="/admin/conceptos-cobro" className="text-primary font-semibold hover:underline">Volver al listado</Link>
              </div>
            )}

            {concepto && (
              <ConceptoCobroForm
                initialValues={toFormFields(concepto)}
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
