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
}

export default function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No hay registros para mostrar.',
  caption,
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
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
          {data.map((row, rowIndex) => (
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
  )
}
