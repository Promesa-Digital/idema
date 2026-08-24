import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import ProgramaForm from '../../components/admin/ProgramaForm'
import { fetchPrograma, updatePrograma } from '../../api/adminProgramasApi'
import type { UpdateProgramaValues } from '../../schemas/programa'
import { useToast } from '../../hooks/useToast'
import PageHeader from '../../components/ui/PageHeader'

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

      <PageHeader title="Editar programa" subtitle="Actualiza la información del programa. El código no se puede modificar." />

      <div className="max-w-2xl">
        <div
          className="rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)] sm:p-8"
          style={{ borderColor: 'var(--admin-color-border)' }}
        >
          {isLoading && <p className="py-10 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando programa...</p>}

          {isError && (
            <div className="py-10 text-center">
              <p className="mb-4 text-sm text-red-600">No se pudo cargar el programa.</p>
              <Link to="/admin/programas" className="font-semibold hover:underline" style={{ color: 'var(--admin-color-primary)' }}>Volver al listado</Link>
            </div>
          )}

          {programa && (
            <ProgramaForm
              mode="edit"
              initialValues={{ ...programa, anio: String(programa.anio), num_lecciones: String(programa.num_lecciones ?? 0), tutor: programa.tutor ?? '', publicacion_programada: programa.publicacion_programada ?? '' }}
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
    </>
  )
}
