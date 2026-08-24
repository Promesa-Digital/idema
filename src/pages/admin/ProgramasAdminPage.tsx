import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiArchive } from 'react-icons/fi'
import { fetchProgramas, archivarPrograma } from '../../api/adminProgramasApi'
import { PROGRAMA_CATEGORIA_LABELS, type ProgramaCategoria, type ProgramaEstado, type ProgramaListFilters } from '../../types/admin'
import { programaCategorias } from '../../schemas/programa'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import { useToast } from '../../hooks/useToast'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PROGRAMAS_QUERY_KEY = ['admin', 'programas'] as const

const inputClass =
  'rounded-lg border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--admin-color-primary)] transition'
const inputStyle = { borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-primary)' }
const cardBorder = { borderColor: 'var(--admin-color-border)' }

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

      <PageHeader
        title="Programas"
        subtitle="Gestiona el catálogo de carreras, auxiliares, especializaciones y cursos."
        action={
          <Link
            to="/admin/programas/nuevo"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)] whitespace-nowrap"
          >
            <FiPlus /> Nuevo programa
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o código..."
          className={`flex-1 min-w-[220px] ${inputClass}`}
          style={inputStyle}
        />
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value as ProgramaCategoria | '')}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">Todas las categorías</option>
          {programaCategorias.map((key) => (
            <option key={key} value={key}>{PROGRAMA_CATEGORIA_LABELS[key]}</option>
          ))}
        </select>
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as ProgramaEstado | '')}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">Todos los estados</option>
          <option value="no_publicado">No publicados</option>
          <option value="publicado">Publicados</option>
          <option value="archivado">Archivados</option>
        </select>
      </div>

      <div
        className="overflow-hidden rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] shadow-[var(--admin-shadow-sm)]"
        style={cardBorder}
      >
        {isLoading && <p className="py-16 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>Cargando programas...</p>}

        {isError && <p className="py-16 text-center text-sm text-red-600">No se pudieron cargar los programas. Intenta de nuevo.</p>}

        {!isLoading && !isError && programas.length === 0 && (
          <p className="py-16 text-center text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>No hay programas que coincidan con los filtros.</p>
        )}

        {!isLoading && !isError && programas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs font-semibold uppercase tracking-wide" style={{ ...cardBorder, color: 'var(--admin-color-text-secondary)' }}>
                  <th className="px-5 py-3">Código</th>
                  <th className="px-5 py-3">Nombre</th>
                  <th className="px-5 py-3">Categoría</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {programas.map((programa) => (
                  <tr key={programa.id} className="border-b last:border-0" style={cardBorder}>
                    <td className="px-5 py-4 font-mono" style={{ color: 'var(--admin-color-text-secondary)' }}>{programa.codigo}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--admin-color-text-primary)' }}>{programa.nombre}</td>
                    <td className="px-5 py-4" style={{ color: 'var(--admin-color-text-primary)' }}>{PROGRAMA_CATEGORIA_LABELS[programa.categoria]}</td>
                    <td className="px-5 py-4"><Badge value={programa.estado} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/admin/programas/${programa.id}/editar`}
                          className="rounded-lg p-2 transition-colors hover:bg-[var(--admin-color-bg)]"
                          style={{ color: 'var(--admin-color-text-secondary)' }}
                          title="Editar"
                        >
                          <FiEdit2 />
                        </Link>
                        {programa.estado !== 'archivado' && (
                          <button
                            type="button"
                            onClick={() => setProgramaParaArchivar(programa.id)}
                            disabled={archiveMutation.isPending}
                            className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
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
