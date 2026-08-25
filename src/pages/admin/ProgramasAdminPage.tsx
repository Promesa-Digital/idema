import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FiPlus, FiEdit2, FiArchive, FiRotateCcw } from 'react-icons/fi'
import { fetchProgramas, archivarPrograma, restaurarPrograma } from '../../api/adminProgramasApi'
import { PROGRAMA_CATEGORIA_LABELS, type Programa, type ProgramaCategoria, type ProgramaEstado, type ProgramaListFilters } from '../../types/admin'
import { programaCategorias } from '../../schemas/programa'
import Badge from '../../components/ui/Badge'
import PageHeader from '../../components/ui/PageHeader'
import DataTable, { type DataTableColumn } from '../../components/ui/DataTable'
import { VARIANT_CLASSES, iconButtonClasses } from '../../components/ui/buttonVariants'
import { useToast } from '../../hooks/useToast'
import ConfirmModal from '../../components/ui/ConfirmModal'

const PROGRAMAS_QUERY_KEY = ['admin', 'programas'] as const

const inputClass =
  'rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-main)] transition focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'

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

  const restoreMutation = useMutation({
    mutationFn: restaurarPrograma,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROGRAMAS_QUERY_KEY })
      addToast('success', 'Programa restaurado', 'Vuelve a estar disponible como no publicado.')
    },
    onError: () => addToast('error', 'No se pudo restaurar', 'Inténtalo nuevamente en unos segundos.'),
  })

  const columns: DataTableColumn<Programa>[] = [
    { header: 'Código', accessor: 'codigo', render: (p) => <span className="font-mono">{p.codigo}</span> },
    { header: 'Nombre', accessor: 'nombre' },
    { header: 'Categoría', accessor: 'categoria', render: (p) => PROGRAMA_CATEGORIA_LABELS[p.categoria] },
    { header: 'Estado', accessor: 'estado', render: (p) => <Badge value={p.estado} /> },
    {
      header: 'Acciones',
      accessor: 'id',
      render: (programa) => (
        <div className="flex items-center justify-end gap-2">
          <Link to={`/admin/programas/${programa.id}/editar`} className={iconButtonClasses('ghost')} title="Editar">
            <FiEdit2 />
          </Link>
          {programa.estado !== 'archivado' && (
            <button
              type="button"
              onClick={() => setProgramaParaArchivar(programa.id)}
              disabled={archiveMutation.isPending}
              className={iconButtonClasses('destructive')}
              title="Archivar"
            >
              <FiArchive />
            </button>
          )}
          {programa.estado === 'archivado' && (
            <button
              type="button"
              onClick={() => restoreMutation.mutate(programa.id)}
              disabled={restoreMutation.isPending}
              className={iconButtonClasses('ghost')}
              title="Restaurar"
            >
              <FiRotateCcw />
            </button>
          )}
        </div>
      ),
    },
  ]

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
            className={`inline-flex items-center gap-2 rounded-[var(--radius-sm)] px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${VARIANT_CLASSES.primary}`}
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
        />
        <select value={categoria} onChange={(e) => setCategoria(e.target.value as ProgramaCategoria | '')} className={inputClass}>
          <option value="">Todas las categorías</option>
          {programaCategorias.map((key) => (
            <option key={key} value={key}>{PROGRAMA_CATEGORIA_LABELS[key]}</option>
          ))}
        </select>
        <select value={estado} onChange={(e) => setEstado(e.target.value as ProgramaEstado | '')} className={inputClass}>
          <option value="">Todos los estados</option>
          <option value="no_publicado">No publicados</option>
          <option value="publicado">Publicados</option>
          <option value="archivado">Archivados</option>
        </select>
      </div>

      {isError ? (
        <p className="py-16 text-center text-sm text-[var(--color-error)]">No se pudieron cargar los programas. Intenta de nuevo.</p>
      ) : (
        <DataTable
          columns={columns}
          data={programas}
          isLoading={isLoading}
          emptyMessage="No hay programas que coincidan con los filtros."
          getRowKey={(p) => p.id}
        />
      )}

      <ConfirmModal
        isOpen={!!programaParaArchivar}
        title="Archivar programa"
        message="El programa dejará de aparecer en el catálogo público. Esta acción conserva su historial."
        variant="destructive"
        onCancel={() => setProgramaParaArchivar(null)}
        onConfirm={() => programaParaArchivar && archiveMutation.mutate(programaParaArchivar)}
        isConfirming={archiveMutation.isPending}
        confirmText="Archivar"
      />
    </>
  )
}
