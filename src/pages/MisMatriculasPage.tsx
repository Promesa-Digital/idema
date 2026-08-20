import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { fetchMisMatriculas } from '../api/matriculasApi'
import MatriculaEstadoBadge from '../components/portal/MatriculaEstadoBadge'

const MATRICULAS_QUERY_KEY = ['portal', 'matriculas'] as const

export default function MisMatriculasPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: MATRICULAS_QUERY_KEY,
    queryFn: fetchMisMatriculas,
  })
  const matriculas = data ?? []

  return (
    <>
      <Helmet>
        <title>Mis matrículas - Portal - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Mis matrículas</h1>
          <p className="text-white/60 mb-8">Consulta el estado de tus matrículas en IDEMA.</p>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando tus matrículas...</p>}

            {isError && (
              <p className="text-rose-300 text-center py-16">
                No se pudieron cargar tus matrículas. Intenta de nuevo.
              </p>
            )}

            {!isLoading && !isError && matriculas.length === 0 && (
              <p className="text-white/60 text-center py-16">Todavía no tienes matrículas registradas.</p>
            )}

            {!isLoading && !isError && matriculas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Programa</th>
                      <th className="px-5 py-3 font-semibold">Periodo</th>
                      <th className="px-5 py-3 font-semibold">Modalidad</th>
                      <th className="px-5 py-3 font-semibold">Inicio</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriculas.map((matricula) => (
                      <tr key={matricula.id} className="border-b border-white/5 last:border-0 text-white/90">
                        <td className="px-5 py-4">{matricula.programa}</td>
                        <td className="px-5 py-4">{matricula.periodo}</td>
                        <td className="px-5 py-4">{matricula.modalidad}</td>
                        <td className="px-5 py-4">{matricula.fechaInicio}</td>
                        <td className="px-5 py-4">
                          <MatriculaEstadoBadge estado={matricula.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
