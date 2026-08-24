import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiArchive } from 'react-icons/fi'
import { fetchProgramas, archivarPrograma } from '../../api/adminProgramasApi'
import { PROGRAMA_CATEGORIA_LABELS, type ProgramaCategoria, type ProgramaEstado, type ProgramaListFilters } from '../../types/admin'
import { programaCategorias } from '../../schemas/programa'
import EstadoBadge from '../../components/admin/EstadoBadge'
import { useToast } from '../../hooks/useToast'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PROGRAMAS_QUERY_KEY = ['admin', 'programas'] as const

export default function ProgramasAdminPage() {
  const [categoria, setCategoria] = useState<ProgramaCategoria | ''>('')
  const [estado, setEstado] = useState<ProgramaEstado | ''>('publicado')
  const [search, setSearch] = useState('')
  const [programaParaArchivar, setProgramaParaArchivar] = useState<string | null>(null)
  const { addToast } = useToast()
  const queryClient = useQueryClient()

  const filters: ProgramaListFilters = {}
  if (categoria) filters.categoria = categoria
  if (estado) filters.estado = estado
  if (search.trim()) filters.search = search.trim()

  const { data, isLoading, isError } = useQuery({
    queryKey: [...PROGRAMAS_QUERY_KEY, filters],
    queryFn: () => fetchProgramas(filters),
  })
  const programas = Array.isArray(data) ? data : []

  const archiveMutation = useMutation({
    mutationFn: archivarPrograma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMAS_QUERY_KEY })
      setProgramaParaArchivar(null)
      addToast('success', 'Programa archivado', 'El programa ya no aparecerá en el catálogo público.')
    },
    onError: () => addToast('error', 'No se pudo archivar', 'Inténtalo nuevamente en unos segundos.'),
  })

  return (
    <>
      <Helmet>
        <title>Programas - Panel admin - IDEMA</title>
      </Helmet>

      <div className="min-h-screen bg-dark px-4 sm:px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Programas</h1>
              <p className="text-white/60">Gestiona el catálogo de carreras, auxiliares, especializaciones y cursos.</p>
            </div>
            <Link
              to="/admin/programas/nuevo"
              className="inline-flex items-center gap-2 px-5 py-3 text-white font-bold rounded-lg bg-gradient-to-r from-cta to-accent hover:shadow-[0_8px_24px_rgba(253,61,181,0.45)] transition-all duration-300 whitespace-nowrap"
            >
              <FiPlus /> Nuevo programa
            </Link>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o código..."
              className="flex-1 min-w-[220px] px-4 py-2.5 rounded-lg bg-white/95 text-deep placeholder-deep/50 focus:outline-none focus:ring-2 focus:ring-primary transition"
            />
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ProgramaCategoria | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todas las categorías</option>
              {programaCategorias.map((key) => (
                <option key={key} value={key}>{PROGRAMA_CATEGORIA_LABELS[key]}</option>
              ))}
            </select>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value as ProgramaEstado | '')}
              className="px-4 py-2.5 rounded-lg bg-white/95 text-deep focus:outline-none focus:ring-2 focus:ring-primary transition"
            >
              <option value="">Todos los estados</option>
              <option value="no_publicado">No publicados</option>
              <option value="publicado">Publicados</option>
              <option value="archivado">Archivados</option>
            </select>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-2xl overflow-hidden">
            {isLoading && <p className="text-white/60 text-center py-16">Cargando programas...</p>}

            {isError && <p className="text-rose-300 text-center py-16">No se pudieron cargar los programas. Intenta de nuevo.</p>}

            {!isLoading && !isError && programas.length === 0 && (
              <p className="text-white/60 text-center py-16">No hay programas que coincidan con los filtros.</p>
            )}

            {!isLoading && !isError && programas.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-white/50 uppercase text-xs tracking-wide">
                      <th className="px-5 py-3 font-semibold">Código</th>
                      <th className="px-5 py-3 font-semibold">Nombre</th>
                      <th className="px-5 py-3 font-semibold">Categoría</th>
                      <th className="px-5 py-3 font-semibold">Estado</th>
                      <th className="px-5 py-3 font-semibold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {programas.map((programa) => (
                      <tr key={programa.id} className="border-b border-white/5 last:border-0 text-white/90">
                        <td className="px-5 py-4 font-mono text-white/70">{programa.codigo}</td>
                        <td className="px-5 py-4">{programa.nombre}</td>
                        <td className="px-5 py-4">{PROGRAMA_CATEGORIA_LABELS[programa.categoria]}</td>
                        <td className="px-5 py-4"><EstadoBadge estado={programa.estado} /></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/admin/programas/${programa.id}/editar`}
                              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition"
                              title="Editar"
                            >
                              <FiEdit2 />
                            </Link>
                            {programa.estado !== 'archivado' && (
                              <button
                                type="button"
                                onClick={() => setProgramaParaArchivar(programa.id)}
                                disabled={archiveMutation.isPending}
                                className="p-2 rounded-lg text-white/70 hover:text-rose-300 hover:bg-white/10 transition disabled:opacity-50"
                                title="Archivar"
                              >
                                <FiArchive />
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
      <ConfirmModal
        isOpen={!!programaParaArchivar}
        title="Archivar programa"
        message="El programa dejará de aparecer en el catálogo público. Esta acción conserva su historial."
        variant="destructive"
        onCancel={() => setProgramaParaArchivar(null)}
        onConfirm={() => programaParaArchivar && archiveMutation.mutate(programaParaArchivar)}
        isConfirming={archiveMutation.isPending}
        confirmLabel="Archivar"
      />
    </>
  )
}
