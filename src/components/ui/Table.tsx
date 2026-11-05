import { useMemo, useState } from 'react'
import { FiChevronLeft, FiChevronRight, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  headerClassName?: string
  cellClassName?: string
  /** Valor por el que ordenar. Si se omite, la columna no es ordenable. */
  sortValue?: (row: T) => string | number | null
}

export interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  getRowKey: (row: T, index: number) => string
  emptyMessage?: string
  caption?: string
  pageSize?: number
  /**
   * Activa la selección por fila. Es opcional a propósito: las tablas que no la pasan
   * siguen renderizando exactamente igual que antes.
   */
  seleccion?: {
    seleccionados: string[]
    onChange: (claves: string[]) => void
    /** Filas que no pueden seleccionarse, por ejemplo las ya archivadas. */
    puedeSeleccionarse?: (row: T) => boolean
  }
}

export default function Table<T>({
  columns,
  data,
  getRowKey,
  emptyMessage = 'No hay registros para mostrar.',
  caption,
  pageSize = 10,
  seleccion,
}: TableProps<T>) {
  const [page, setPage] = useState(1)
  const [orden, setOrden] = useState<{ key: string; direccion: 'asc' | 'desc' } | null>(null)

  const sortedData = useMemo(() => {
    if (!orden) return data
    const columna = columns.find((c) => c.key === orden.key)
    if (!columna?.sortValue) return data

    const signo = orden.direccion === 'asc' ? 1 : -1
    // Copia antes de ordenar: `data` viene del padre y no debe mutarse.
    return [...data].sort((a, b) => {
      const va = columna.sortValue!(a)
      const vb = columna.sortValue!(b)
      // Los vacíos van siempre al final, ordene como ordene: son ausencia de dato,
      // no un valor que compita por posición.
      if (va === null || va === '') return 1
      if (vb === null || vb === '') return -1
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * signo
      return String(va).localeCompare(String(vb), 'es', { sensitivity: 'base' }) * signo
    })
  }, [columns, data, orden])

  const alternarOrden = (key: string) => {
    setPage(1) // ordenar cambia qué hay en la página 1; quedarse en la 4 desorienta
    setOrden((actual) =>
      actual?.key === key
        ? { key, direccion: actual.direccion === 'asc' ? 'desc' : 'asc' }
        : { key, direccion: 'asc' },
    )
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const visibleData = useMemo(
    () => sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, sortedData, pageSize],
  )

  const rangeStart = sortedData.length === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const rangeEnd = Math.min(currentPage * pageSize, sortedData.length)


  const seleccionablesEnPagina = seleccion
    ? visibleData.filter((row) => seleccion.puedeSeleccionarse?.(row) ?? true)
    : []
  const clavesEnPagina = seleccionablesEnPagina.map((row, i) => getRowKey(row, i))
  // "Todas" se refiere solo a la página visible: marcar filas que el usuario no está
  // viendo, y luego actuar sobre ellas, es la receta para un borrado accidental.
  const todasMarcadas =
    clavesEnPagina.length > 0 && clavesEnPagina.every((k) => seleccion?.seleccionados.includes(k))

  const alternarTodas = () => {
    if (!seleccion) return
    seleccion.onChange(
      todasMarcadas
        ? seleccion.seleccionados.filter((k) => !clavesEnPagina.includes(k))
        : [...new Set([...seleccion.seleccionados, ...clavesEnPagina])],
    )
  }

  const alternarUna = (clave: string) => {
    if (!seleccion) return
    seleccion.onChange(
      seleccion.seleccionados.includes(clave)
        ? seleccion.seleccionados.filter((k) => k !== clave)
        : [...seleccion.seleccionados, clave],
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full border-collapse text-left text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-dark text-white">
            <tr>
              {seleccion && (
                <th scope="col" className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={todasMarcadas}
                    onChange={alternarTodas}
                    disabled={clavesEnPagina.length === 0}
                    aria-label="Seleccionar todas las filas de esta página"
                    className="h-4 w-4 rounded border-white/40 accent-primary"
                  />
                </th>
              )}
              {columns.map((column) => {
                const activa = orden?.key === column.key
                return (
                  <th
                    key={column.key}
                    scope="col"
                    aria-sort={activa ? (orden.direccion === 'asc' ? 'ascending' : 'descending') : undefined}
                    className={`whitespace-nowrap px-4 py-3 font-semibold ${column.headerClassName ?? ''}`}
                  >
                    {column.sortValue ? (
                      <button
                        type="button"
                        onClick={() => alternarOrden(column.key)}
                        className="group inline-flex items-center gap-1.5 font-semibold transition hover:text-primary"
                      >
                        {column.header}
                        {activa ? (
                          orden.direccion === 'asc' ? (
                            <FiChevronUp aria-hidden className="text-primary" />
                          ) : (
                            <FiChevronDown aria-hidden className="text-primary" />
                          )
                        ) : (
                          <FiChevronDown
                            aria-hidden
                            className="opacity-0 transition group-hover:opacity-50"
                          />
                        )}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {visibleData.map((row, rowIndex) => (
              <tr key={getRowKey(row, rowIndex)} className="transition-colors hover:bg-primary/5">
                {seleccion && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={seleccion.seleccionados.includes(getRowKey(row, rowIndex))}
                      onChange={() => alternarUna(getRowKey(row, rowIndex))}
                      disabled={!(seleccion.puedeSeleccionarse?.(row) ?? true)}
                      aria-label="Seleccionar fila"
                      className="h-4 w-4 rounded border-slate-300 accent-primary disabled:opacity-40"
                    />
                  </td>
                )}
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
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={columns.length + (seleccion ? 1 : 0)} className="px-4 py-12 text-center text-slate-500">
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
            {seleccion && (
              <label className="flex items-center gap-3 border-b border-slate-100 pb-3 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={seleccion.seleccionados.includes(getRowKey(row, rowIndex))}
                  onChange={() => alternarUna(getRowKey(row, rowIndex))}
                  disabled={!(seleccion.puedeSeleccionarse?.(row) ?? true)}
                  className="h-4 w-4 rounded border-slate-300 accent-primary disabled:opacity-40"
                />
                Seleccionar
              </label>
            )}
            {columns.map((column) => (
              <div key={column.key} className="grid grid-cols-[minmax(6.5rem,0.8fr)_minmax(0,1.2fr)] gap-3 text-sm">
                <span className="font-bold text-slate-500">{column.header}</span>
                <div className="min-w-0 break-words text-slate-700">{column.render(row)}</div>
              </div>
            ))}
          </article>
        ))}
        {sortedData.length === 0 && <p className="px-4 py-12 text-center text-slate-500">{emptyMessage}</p>}
      </div>

      {sortedData.length > pageSize && (
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-slate-500 sm:text-left">
            Mostrando {rangeStart}–{rangeEnd} de {sortedData.length}
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
