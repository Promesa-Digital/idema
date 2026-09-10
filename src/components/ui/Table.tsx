import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi'
import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (row: T, index: number) => string
  emptyMessage?: string
  caption?: string
  pageSize?: number
}

export default function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No hay registros para mostrar.',
  caption,
  pageSize = 10,
}: TableProps<T>) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const visibleData = useMemo(
    () => data.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, data, pageSize],
  )

  const rangeStart = data.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, data.length)

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-dark text-white">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 font-semibold ${column.headerClassName ?? ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visibleData.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)} className="transition-colors hover:bg-primary/5">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-4 py-3 align-middle text-slate-700 ${column.cellClassName ?? ''}`}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="divide-y divide-slate-200 md:hidden">
        {visibleData.map((row, rowIndex) => (
          <article key={getRowKey(row, rowIndex)} className="space-y-3 p-4">
            {columns.map((column) => (
              <div key={column.key} className="grid grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.2fr)] gap-3 text-sm">
                <span className="font-bold text-slate-500">{column.header}</span>
                <div className="min-w-0 break-words text-slate-700">{column.render(row)}</div>
              </div>
            ))}
          </article>
        ))}
        {data.length === 0 && <p className="px-4 py-12 text-center text-slate-500">{emptyMessage}</p>}
      </div>

      {data.length > pageSize && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-slate-500 sm:text-left">
            Mostrando {rangeStart}–{rangeEnd} de {data.length}
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-dark transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FiChevronLeft aria-hidden="true" /> Anterior
            </button>
            <span className="min-w-16 text-center font-semibold text-slate-600">{currentPage} / {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 font-semibold text-dark transition hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente <FiChevronRight aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
