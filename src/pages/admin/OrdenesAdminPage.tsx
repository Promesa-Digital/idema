import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiXCircle } from 'react-icons/fi'
import { fetchOrdenes, anularOrden } from '../../api/adminOrdenesApi'
import { ORDEN_ESTADO_LABELS, type Orden, type OrdenEstado } from '../../types/admin'
import OrdenEstadoBadge from '../../components/admin/OrdenEstadoBadge'
import AnularOrdenModal from '../../components/admin/AnularOrdenModal'
import { useToast } from '../../hooks/useToast'

const ORDENES_QUERY_KEY = ['admin', 'ordenes'] as const

export default function OrdenesAdminPage() {
  const [estado, setEstado] = useState<OrdenEstado | ''>('')
  const [ordenAAnular, setOrdenAAnular] = useState<Orden | null>(null)
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const filters = estado ? { estado } : {}

  const { data, isLoading, isError } = useQuery({
    queryKey: [...ORDENES_QUERY_KEY, filters],
    queryFn: () => fetchOrdenes(filters),
  })
  const ordenes = Array.isArray(data) ? data : []

  const anularMutation = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => anularOrden(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDENES_QUERY_KEY })
      addToast('success', 'Orden anulada', 'La orden fue anulada. Recuerda que no se generó ningún reembolso automático.')
      setOrdenAAnular(null)
    },
    onError: () => addToast('error', 'No se pudo anular', 'Inténtalo nuevamente en unos segundos.'),
  })

  return (
    <>
      <Helmet>
        <title>Órdenes - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-1">Órdenes</h1>
            <p className="text-white/60">Consulta todas las órdenes de pago y anula las que correspondan.</p>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as OrdenEstado | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todos los estados</option>
              {(Object.keys(ORDEN_ESTADO_LABELS) as OrdenEstado[]).map((key) => (
                <option key={key} value={key}>{ORDEN_ESTADO_LABELS[key]}</option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando órdenes...</p>}

            {isError && <p className="text-rose-300 text-center py-16">No se pudieron cargar las órdenes. Intenta de nuevo.</p>}

            {!isLoading && !isError && ordenes.length === 0 && (
              <p className="text-white/60 text-center py-16">No hay órdenes que coincidan con los filtros.</p>
            )}

            {!isLoading && !isError && ordenes.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Alumno</th>
                      <th className="px-5 py-3 font-semibold">Concepto</th>
                      <th className="px-5 py-3 font-semibold">Monto</th>
                      <th className="px-5 py-3 font-semibold">Método</th>
                      <th className="px-5 py-3 font-semibold">Fecha</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ordenes.map((orden) => (
                      <tr key={orden.id} className="border-b border-white/5 last:border-0 text-white/90">
                        <td className="px-5 py-4">{orden.alumno}</td>
                        <td className="px-5 py-4">{orden.concepto}</td>
                        <td className="px-5 py-4 font-semibold">S/. {orden.monto.toFixed(2)}</td>
                        <td className="px-5 py-4 text-white/70">{orden.metodoPago}</td>
                        <td className="px-5 py-4 text-white/70 whitespace-nowrap">{orden.createdAt}</td>
                        <td className="px-5 py-4"><OrdenEstadoBadge estado={orden.estado} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end">
                            {orden.estado !== 'anulada' && (
                              <button
                                type="button"
                                onClick={() => setOrdenAAnular(orden)}
                                className="p-2 rounded-lg text-white/70 hover:text-rose-300 hover:bg-white/10 transition"
                                title="Anular"
                              >
                                <FiXCircle />
                              </button>
                            )}
                          </div>
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

      <AnularOrdenModal
        orden={ordenAAnular}
        isSubmitting={anularMutation.isPending}
        onCancel={() => setOrdenAAnular(null)}
        onConfirm={(motivo) => {
          if (!ordenAAnular) return
          anularMutation.mutate({ id: ordenAAnular.id, motivo })
        }}
      />
    </>
  )
}
