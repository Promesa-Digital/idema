import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import ProgramaForm from '../../components/admin/ProgramaForm'
import { createPrograma } from '../../api/adminProgramasApi'
import type { CreateProgramaValues } from '../../schemas/programa'
import { useToast } from '../../hooks/useToast'

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

      <div className="min-h-screen bg-gradient-to-br from-dark via-deep to-dark px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Nuevo programa</h1>
          <p className="text-white/80 mb-8">Completa los datos para agregarlo al catálogo.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 sm:p-8">
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
      </div>
    </>
  )
}
