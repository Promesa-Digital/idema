import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { activarElectivo, desactivarElectivo, fetchMisElectivos } from '../api/electivosApi'
import { useToast } from '../hooks/useToast'

const ELECTIVOS_QUERY_KEY = ['portal', 'electivos'] as const

export default function MisElectivosPage() {
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const { data: resumen, isLoading, isError } = useQuery({
    queryKey: ELECTIVOS_QUERY_KEY,
    queryFn: fetchMisElectivos,
  })

  const activarMutation = useMutation({
    mutationFn: activarElectivo,
    onSuccess: (data) => {
      queryClient.setQueryData(ELECTIVOS_QUERY_KEY, data)
      addToast('success', 'Electivo activado', 'Se activó correctamente el curso electivo.')
    },
    onError: () => addToast('error', 'No se pudo activar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const desactivarMutation = useMutation({
    mutationFn: desactivarElectivo,
    onSuccess: (data) => {
      queryClient.setQueryData(ELECTIVOS_QUERY_KEY, data)
      addToast('success', 'Electivo desactivado', 'Se liberó un cupo de electivos.')
    },
    onError: () => addToast('error', 'No se pudo desactivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const isMutating = activarMutation.isPending || desactivarMutation.isPending
  const cuposUsados = resumen?.cuposUsados ?? 0
  const cuposTotal = resumen?.cuposTotal ?? 0
  const limiteAlcanzado = cuposTotal > 0 && cuposUsados >= cuposTotal
  const cuposPct = cuposTotal > 0 ? Math.min(100, Math.round((cuposUsados / cuposTotal) * 100)) : 0

  return (
    <>
      <Helmet>
        <title>Mis electivos - Portal - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-1">Mis electivos</h1>
          <p className="text-white/60 mb-8">Activa o desactiva tus cursos electivos según tu saldo de cupos disponibles.</p>

          {!isLoading && !isError && resumen && (
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold">Saldo de cupos</span>
                <span className={`font-bold ${limiteAlcanzado ? 'text-rose-300' : 'text-white'}`}>
                  {cuposUsados} / {cuposTotal}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    limiteAlcanzado ? 'bg-rose-400' : 'bg-gradient-to-r from-primary to-accent'
                  }`}
                  style={{ width: `${cuposPct}%` }}
                />
              </div>
              {limiteAlcanzado && (
                <p className="mt-3 text-xs text-rose-300">
                  Llegaste al límite de cupos. Desactiva un electivo para poder activar otro.
                </p>
              )}
            </div>
          )}

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando tus electivos...</p>}

            {isError && (
              <p className="text-rose-300 text-center py-16">
                No se pudieron cargar tus electivos. Intenta de nuevo.
              </p>
            )}

            {!isLoading && !isError && resumen && resumen.electivos.length === 0 && (
              <p className="text-white/60 text-center py-16">No tienes cursos electivos disponibles por el momento.</p>
            )}

            {!isLoading && !isError && resumen && resumen.electivos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Electivo</th>
                      <th className="px-5 py-3 font-semibold">Créditos</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.electivos.map((electivo) => {
                      const disableActivar = !electivo.activo && limiteAlcanzado
                      return (
                        <tr key={electivo.id} className="border-b border-white/5 last:border-0 text-white/90">
                          <td className="px-5 py-4">{electivo.nombre}</td>
                          <td className="px-5 py-4">{electivo.creditos}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${
                                electivo.activo
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40'
                                  : 'bg-white/10 text-white/50 border-white/20'
                              }`}
                            >
                              {electivo.activo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex justify-end">
                              {electivo.activo ? (
                                <button
                                  type="button"
                                  onClick={() => desactivarMutation.mutate(electivo.id)}
                                  disabled={isMutating}
                                  className="px-4 py-2 rounded-lg text-sm font-semibold border border-white/20 text-white/80 hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Desactivar
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => activarMutation.mutate(electivo.id)}
                                  disabled={isMutating || disableActivar}
                                  title={disableActivar ? 'Llegaste al límite de cupos' : undefined}
                                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cta to-accent text-white hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:shadow-none"
                                >
                                  Activar
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
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
