import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ProgramaForm from '../../components/admin/ProgramaForm'
import { fetchPrograma, updatePrograma } from '../../api/adminProgramasApi'
import type { UpdateProgramaValues } from '../../schemas/programa'
import { useToast } from '../../hooks/useToast'

export default function ProgramaEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const { data: programa, isLoading, isError } = useQuery({
    queryKey: ['admin', 'programas', id],
    queryFn: () => fetchPrograma(id!),
    enabled: !!id,
  })

  const mutation = useMutation({
    mutationFn: (values: UpdateProgramaValues) => updatePrograma(id!, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programas'] })
      addToast('success', 'Programa actualizado', 'Los cambios se guardaron correctamente.')
      navigate('/admin/programas')
    },
    onError: () => setSubmitError('No se pudo guardar los cambios. Intenta nuevamente.'),
  })

  return (
    <>
      <Helmet>
        <title>Editar programa - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Editar programa</h1>
          <p className="text-white/80 mb-8">Actualiza la información del programa. El código no se puede modificar.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
            {isLoading && <p className="text-white/60 text-center py-10">Cargando programa...</p>}

            {isError && (
              <div className="text-center py-10">
                <p className="text-rose-300 mb-4">No se pudo cargar el programa.</p>
                <Link to="/admin/programas" className="text-primary font-semibold hover:underline">Volver al listado</Link>
              </div>
            )}

            {programa && (
              <ProgramaForm
                mode="edit"
                initialValues={programa}
                submitLabel="Guardar cambios"
                submitError={submitError}
                onSubmit={async (values) => {
                  setSubmitError(null)
                  try {
                    await mutation.mutateAsync(values as UpdateProgramaValues)
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
