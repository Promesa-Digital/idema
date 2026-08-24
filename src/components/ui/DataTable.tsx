import { useState, type ReactNode } from 'react'

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
      className="overflow-hidden rounded-[var(--admin-radius-md)] bg-[var(--admin-color-surface)] border"
      style={{ borderColor: 'var(--admin-color-border)' }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--admin-color-border)' }}>
              {columns.map((col) => (
                <th
                  key={String(col.accessor)}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--admin-color-text-secondary)' }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b last:border-0" style={{ borderColor: 'var(--admin-color-border)' }}>
                  {columns.map((_col, colIndex) => (
                    <td key={`skeleton-cell-${colIndex}`} className="px-4 py-3.5">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--admin-color-bg-alt)]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && total === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm"
                  style={{ color: 'var(--admin-color-text-secondary)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            )}

            {!isLoading &&
              pageData.map((row, index) => (
                <tr
                  key={getRowKey ? getRowKey(row, start + index) : start + index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`border-b last:border-0 ${onRowClick ? 'cursor-pointer hover:bg-[var(--admin-color-bg)]' : ''}`}
                  style={{ borderColor: 'var(--admin-color-border)' }}
                >
                  {columns.map((col) => (
                    <td key={String(col.accessor)} className="px-4 py-3.5" style={{ color: 'var(--admin-color-text-primary)' }}>
                      {col.render ? col.render(row) : String(row[col.accessor] ?? '')}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {!isLoading && total > 0 && (
        <div
          className="flex items-center justify-between gap-4 border-t px-4 py-3 text-sm"
          style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
        >
          <span>
            Mostrando {start + 1}–{end} de {total}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={safePage === 0}
              className="rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--admin-color-border)' }}
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={safePage >= totalPages - 1}
              className="rounded-lg border px-3 py-1.5 font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--admin-color-border)' }}
            >
              Siguiente
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
