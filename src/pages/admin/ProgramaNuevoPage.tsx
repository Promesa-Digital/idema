import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import ProgramaForm from '../../components/admin/ProgramaForm'
import { createPrograma } from '../../api/adminProgramasApi'
import type { CreateProgramaValues } from '../../schemas/programa'
import { useToast } from '../../hooks/useToast'
import PageHeader from '../../components/ui/PageHeader'

export default function ProgramaNuevoPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { addToast } = useToast()
  const [submitError, setSubmitError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (values: CreateProgramaValues) => createPrograma(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'programas'] })
      addToast('success', 'Programa creado', 'El programa se agregó correctamente.')
      navigate('/admin/programas')
    },
    onError: (error) => {
      const message = isAxiosError(error) && error.response?.status === 409
        ? 'Ya existe un programa con ese código.'
        : 'No se pudo crear el programa. Intenta nuevamente.'
      setSubmitError(message)
    },
  })

  return (
    <>
      <Helmet>
        <title>Nuevo programa - Panel admin - IDEMA</title>
      </Helmet>

      <PageHeader title="Nuevo programa" subtitle="Completa los datos para agregarlo al catálogo." />

      <div className="max-w-2xl">
        <div
          className="rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)] sm:p-8"
          style={{ borderColor: 'var(--admin-color-border)' }}
        >
          <ProgramaForm
            mode="create"
            submitLabel="Crear programa"
            submitError={submitError}
            onSubmit={async (values) => {
              setSubmitError(null)
              try {
                await mutation.mutateAsync(values as CreateProgramaValues)
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
