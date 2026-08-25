import { useState, type ReactNode } from 'react'
import { FiInbox } from 'react-icons/fi'

export interface DataTableColumn<T> {
  header: string
  accessor: keyof T
  render?: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  isLoading?: boolean
  emptyMessage?: string
  pageSize?: number
  getRowKey?: (row: T, index: number) => string | number
  onRowClick?: (row: T) => void
}

const DEFAULT_PAGE_SIZE = 10

export default function DataTable<T>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No hay registros para mostrar.',
  pageSize = DEFAULT_PAGE_SIZE,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0)

  const total = data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * pageSize
  const end = Math.min(start + pageSize, total)
  const pageData = data.slice(start, end)

  const goPrev = () => setPage((p) => Math.max(0, p - 1))
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1))

  return (
    <div
      className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--color-bg-card)] border border-[var(--color-border)]"
      style={{ fontFamily: 'var(--font-body)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[var(--color-bg-page)]">
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  className="px-4 py-3 text-[12px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-card)]">
                  {columns.map((_col, colIndex) => (
                    <td key={`skeleton-cell-${colIndex}`} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-border)]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && total === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center gap-2 text-center">
                    <FiInbox className="h-8 w-8 text-[var(--color-text-tertiary)]" />
                    <p className="text-sm text-[var(--color-text-tertiary)]">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              pageData.map((row, index) => (
                <tr
                  key={getRowKey ? getRowKey(row, start + index) : start + index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b border-[var(--color-border)] last:border-0 bg-[var(--color-bg-card)] transition-colors hover:bg-[var(--color-bg-page)] ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map((col) => (
                    <td key={String(col.accessor)} className="px-4 py-3.5 text-[var(--color-text-main)]">
                      {col.render ? col.render(row) : String(row[col.accessor] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div className="flex items-center justify-between gap-4 border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-tertiary)]">
          <span>
            Mostrando {start + 1}–{end} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={safePage === 0}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 font-medium transition-colors enabled:hover:border-[var(--color-primary)] enabled:hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 py-1.5 font-medium transition-colors enabled:hover:border-[var(--color-primary)] enabled:hover:text-[var(--color-primary)] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
