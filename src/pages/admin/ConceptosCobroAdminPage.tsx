import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiArchive, FiRotateCcw } from 'react-icons/fi'
import { fetchConceptosCobro, archivarConceptoCobro, restaurarConceptoCobro } from '../../api/adminConceptosCobroApi'
import {
  CONCEPTO_COBRO_TIPO_LABELS,
  type ConceptoCobroEstado,
  type ConceptoCobroListFilters,
  type ConceptoCobroTipo,
} from '../../types/admin'
import { conceptoCobroTipos } from '../../schemas/conceptoCobro'
import ConceptoCobroEstadoBadge from '../../components/admin/ConceptoCobroEstadoBadge'
import { useToast } from '../../hooks/useToast'

const CONCEPTOS_QUERY_KEY = ['admin', 'conceptos-cobro'] as const

export default function ConceptosCobroAdminPage() {
  const [tipo, setTipo] = useState<ConceptoCobroTipo | ''>('')
  const [estado, setEstado] = useState<ConceptoCobroEstado | ''>('activo')
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const filters: ConceptoCobroListFilters = {}
  if (tipo) filters.tipo = tipo
  if (estado) filters.estado = estado

  const { data, isLoading, isError } = useQuery({
    queryKey: [...CONCEPTOS_QUERY_KEY, filters],
    queryFn: () => fetchConceptosCobro(filters),
  })
  const conceptos = Array.isArray(data) ? data : []

  const archiveMutation = useMutation({
    mutationFn: archivarConceptoCobro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONCEPTOS_QUERY_KEY })
      addToast('success', 'Concepto desactivado', 'Ya no estará disponible para generar nuevas órdenes.')
    },
    onError: () => addToast('error', 'No se pudo desactivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const restoreMutation = useMutation({
    mutationFn: restaurarConceptoCobro,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONCEPTOS_QUERY_KEY })
      addToast('success', 'Concepto reactivado', 'El concepto vuelve a estar disponible.')
    },
    onError: () => addToast('error', 'No se pudo reactivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const isPending = archiveMutation.isPending || restoreMutation.isPending

  return (
    <>
      <Helmet>
        <title>Conceptos de cobro - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Conceptos de cobro</h1>
              <p className="text-white/60">Gestiona los conceptos disponibles para generar órdenes de pago.</p>
            </div>
            <Link
              to="/admin/conceptos-cobro/nuevo"
              className="inline-flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 whitespace-nowrap"
            >
              <FiPlus /> Nuevo concepto
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as ConceptoCobroTipo | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todos los tipos</option>
              {conceptoCobroTipos.map((key) => (
                <option key={key} value={key}>{CONCEPTO_COBRO_TIPO_LABELS[key]}</option>
              ))}
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ConceptoCobroEstado | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando conceptos...</p>}

            {isError && <p className="text-rose-300 text-center py-16">No se pudieron cargar los conceptos. Intenta de nuevo.</p>}

            {!isLoading && !isError && conceptos.length === 0 && (
              <p className="text-white/60 text-center py-16">No hay conceptos que coincidan con los filtros.</p>
            )}

            {!isLoading && !isError && conceptos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Nombre</th>
                      <th className="px-5 py-3 font-semibold">Tipo</th>
                      <th className="px-5 py-3 font-semibold">Monto</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conceptos.map((concepto) => (
                      <tr key={concepto.id} className="border-b border-white/5 last:border-0 text-white/90">
                        <td className="px-5 py-4">{concepto.nombre}</td>
                        <td className="px-5 py-4">{CONCEPTO_COBRO_TIPO_LABELS[concepto.tipo]}</td>
                        <td className="px-5 py-4 font-semibold">S/. {concepto.monto.toFixed(2)}</td>
                        <td className="px-5 py-4"><ConceptoCobroEstadoBadge estado={concepto.estado} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/conceptos-cobro/${concepto.id}/editar`}
                              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                              title="Editar"
                            >
                              <FiEdit2 />
                            </Link>
                            {concepto.estado === 'activo' ? (
                              <button
                                type="button"
                                onClick={() => archiveMutation.mutate(concepto.id)}
                                disabled={isPending}
                                className="p-2 rounded-lg text-white/70 hover:text-rose-300 hover:bg-white/10 transition disabled:opacity-50"
                                title="Desactivar"
                              >
                                <FiArchive />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => restoreMutation.mutate(concepto.id)}
                                disabled={isPending}
                                className="p-2 rounded-lg text-white/70 hover:text-emerald-300 hover:bg-white/10 transition disabled:opacity-50"
                                title="Reactivar"
                              >
                                <FiRotateCcw />
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
    </>
  )
}
