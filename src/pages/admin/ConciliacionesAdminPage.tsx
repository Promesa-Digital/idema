import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  actualizarConciliacion,
  cerrarConciliacion,
  conciliarOrdenes,
  crearConciliacion,
  listarConciliaciones,
  obtenerConciliacion,
} from '@/services/conciliacionesApi'
import type {
  ConciliacionBackend,
  ConciliacionDetalleBackend,
  ConciliacionEstado,
} from '@/types/backend'

const ESTADO_LABELS: Record<ConciliacionEstado, string> = {
  abierta: 'Abierta',
  en_revision: 'En revisión',
  cerrada: 'Cerrada',
}

const ESTADO_BADGES = {
  abierta: 'sky',
  en_revision: 'amber',
  cerrada: 'emerald',
} as const

const MEDIO_PAGO_LABELS = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  transferencia: 'Transferencia',
} as const

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function inputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function initialPeriod() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  return { periodo_inicio: inputDate(firstDay), periodo_fin: inputDate(today) }
}

function formatCurrency(value: string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? CURRENCY_FORMATTER.format(amount) : `S/ ${value}`
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date)
}

function formatDateTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMATTER.format(date)
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function shortId(value: string): string {
  return `${value.slice(0, 8)}…`
}

function EstadoBadge({ estado }: { estado: ConciliacionEstado }) {
  return <Badge variant={ESTADO_BADGES[estado]}>{ESTADO_LABELS[estado]}</Badge>
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-dark">{value}</p>
    </div>
  )
}

export default function ConciliacionesAdminPage() {
  const { user, logout } = useAuth()
  const canEdit = user?.rol === 'administracion'
  const [conciliaciones, setConciliaciones] = useState<ConciliacionBackend[]>([])
  const [estadoFilter, setEstadoFilter] = useState<ConciliacionEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [periodForm, setPeriodForm] = useState(initialPeriod)
  const [createError, setCreateError] = useState('')
  const [detail, setDetail] = useState<ConciliacionDetalleBackend | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [montoAbonado, setMontoAbonado] = useState('0.00')
  const [comision, setComision] = useState('0.00')
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [isCloseOpen, setIsCloseOpen] = useState(false)
  const [activeAction, setActiveAction] = useState<
    'create' | 'update' | 'reconcile' | 'close' | null
  >(null)

  useEffect(() => {
    let active = true
    listarConciliaciones()
      .then((data) => {
        if (active) setConciliaciones(data)
      })
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudieron cargar las conciliaciones.'))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [logout, reloadKey])

  const syncConciliacion = useCallback((updated: ConciliacionBackend) => {
    setConciliaciones((current) => {
      const exists = current.some((item) => item.id === updated.id)
      return exists
        ? current.map((item) => (item.id === updated.id ? updated : item))
        : [updated, ...current]
    })
  }, [])

  const applyDetail = useCallback(
    (updated: ConciliacionDetalleBackend) => {
      setDetail(updated)
      setMontoAbonado(updated.monto_abonado_culqi)
      setComision(updated.comision)
      setSelectedOrderIds([])
      syncConciliacion(updated)
    },
    [syncConciliacion],
  )

  const openDetail = useCallback(
    async (conciliacion: ConciliacionBackend) => {
      setIsDetailOpen(true)
      setIsDetailLoading(true)
      setDetailError('')
      setFeedback('')
      try {
        const data = await obtenerConciliacion(conciliacion.id)
        applyDetail(data)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setDetailError(getErrorMessage(error, 'No se pudo cargar el detalle.'))
      } finally {
        setIsDetailLoading(false)
      }
    },
    [applyDetail, logout],
  )

  const filteredConciliaciones = useMemo(
    () =>
      conciliaciones.filter(
        (conciliacion) => !estadoFilter || conciliacion.estado === estadoFilter,
      ),
    [conciliaciones, estadoFilter],
  )

  const resumen = useMemo(
    () => ({
      total: conciliaciones.length,
      abiertas: conciliaciones.filter((item) => item.estado === 'abierta').length,
      revision: conciliaciones.filter((item) => item.estado === 'en_revision').length,
      cerradas: conciliaciones.filter((item) => item.estado === 'cerrada').length,
    }),
    [conciliaciones],
  )

  const columns = useMemo<TableColumn<ConciliacionBackend>[]>(
    () => [
      {
        key: 'periodo',
        header: 'Periodo',
        render: (item) => (
          <div>
            <p className="font-semibold text-dark">
              {formatDate(item.periodo_inicio)} — {formatDate(item.periodo_fin)}
            </p>
            <p className="mt-0.5 font-mono text-xs text-slate-500" title={item.id}>
              {shortId(item.id)}
            </p>
          </div>
        ),
      },
      {
        key: 'monto_esperado',
        header: 'Monto esperado',
        render: (item) => (
          <span className="font-semibold text-dark">{formatCurrency(item.monto_esperado)}</span>
        ),
      },
      {
        key: 'abono',
        header: 'Abono + comisión',
        render: (item) => (
          <div>
            <p>{formatCurrency(item.monto_abonado_culqi)}</p>
            <p className="text-xs text-slate-500">+ {formatCurrency(item.comision)}</p>
          </div>
        ),
      },
      {
        key: 'diferencia',
        header: 'Diferencia',
        render: (item) => {
          const balanced = Number(item.diferencia) === 0
          return (
            <span className={balanced ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700'}>
              {formatCurrency(item.diferencia)}
            </span>
          )
        },
      },
      {
        key: 'avance',
        header: 'Órdenes',
        render: (item) => (
          <span className="whitespace-nowrap">
            {item.ordenes_conciliadas} / {item.total_ordenes}
          </span>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (item) => <EstadoBadge estado={item.estado} />,
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (item) => (
          <Button size="sm" variant="ghost" onClick={() => void openDetail(item)}>
            Ver detalle
          </Button>
        ),
      },
    ],
    [openDetail],
  )

  const pendingOrders = detail?.ordenes.filter((order) => !order.conciliada) ?? []
  const canClose =
    detail !== null &&
    detail.estado !== 'cerrada' &&
    detail.ordenes_conciliadas === detail.total_ordenes &&
    Number(detail.diferencia) === 0

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (periodForm.periodo_inicio > periodForm.periodo_fin) {
      setCreateError('La fecha inicial no puede ser posterior a la fecha final.')
      return
    }
    setActiveAction('create')
    setCreateError('')
    setFeedback('')
    try {
      const created = await crearConciliacion(periodForm)
      applyDetail(created)
      setIsCreateOpen(false)
      setIsDetailOpen(true)
      setFeedback('La conciliación fue creada y sus órdenes pagadas quedaron agrupadas.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setCreateError(getErrorMessage(error, 'No se pudo crear la conciliación.'))
    } finally {
      setActiveAction(null)
    }
  }

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!detail) return
    const amount = Number(montoAbonado)
    const fee = Number(comision)
    if (!Number.isFinite(amount) || amount < 0 || !Number.isFinite(fee) || fee < 0) {
      setDetailError('El monto abonado y la comisión deben ser importes válidos no negativos.')
      return
    }
    setActiveAction('update')
    setDetailError('')
    try {
      const updated = await actualizarConciliacion(detail.id, {
        monto_abonado_culqi: amount,
        comision: fee,
      })
      applyDetail(updated)
      setFeedback('Los importes de Culqi fueron actualizados.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setDetailError(getErrorMessage(error, 'No se pudieron actualizar los importes.'))
    } finally {
      setActiveAction(null)
    }
  }

  const handleReconcile = async () => {
    if (!detail || selectedOrderIds.length === 0) return
    setActiveAction('reconcile')
    setDetailError('')
    try {
      const updated = await conciliarOrdenes(detail.id, selectedOrderIds)
      applyDetail(updated)
      setFeedback('Las órdenes seleccionadas fueron conciliadas.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setDetailError(getErrorMessage(error, 'No se pudieron conciliar las órdenes.'))
    } finally {
      setActiveAction(null)
    }
  }

  const handleClose = async () => {
    if (!detail) return
    setActiveAction('close')
    setDetailError('')
    try {
      const closed = await cerrarConciliacion(detail.id)
      syncConciliacion(closed)
      setDetail((current) => (current ? { ...current, ...closed } : current))
      setIsCloseOpen(false)
      setFeedback('El periodo fue cerrado correctamente.')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setIsCloseOpen(false)
      setDetailError(getErrorMessage(error, 'No se pudo cerrar la conciliación.'))
    } finally {
      setActiveAction(null)
    }
  }

  const toggleOrder = (orderId: string) => {
    setSelectedOrderIds((current) =>
      current.includes(orderId)
        ? current.filter((item) => item !== orderId)
        : [...current, orderId],
    )
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total periodos" value={resumen.total} />
          <SummaryCard label="Abiertos" value={resumen.abiertas} />
          <SummaryCard label="En revisión" value={resumen.revision} />
          <SummaryCard label="Cerrados" value={resumen.cerradas} />
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <Select
            label="Filtrar por estado"
            value={estadoFilter}
            containerClassName="w-full sm:max-w-xs"
            onChange={(event) => setEstadoFilter(event.target.value as ConciliacionEstado | '')}
          >
            <option value="">Todos los estados</option>
            <option value="abierta">Abierta</option>
            <option value="en_revision">En revisión</option>
            <option value="cerrada">Cerrada</option>
          </Select>
          {canEdit && <Button onClick={() => setIsCreateOpen(true)}>Nueva conciliación</Button>}
        </div>

        {feedback && (
          <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando conciliaciones...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={filteredConciliaciones}
            getRowKey={(item) => item.id}
            caption="Listado de conciliaciones de pago"
            emptyMessage="No hay conciliaciones que coincidan con el filtro seleccionado."
          />
        )}
      </div>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Nueva conciliación"
        size="sm"
        closeOnBackdrop={activeAction !== 'create'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={activeAction === 'create'}>Cancelar</Button>
            <Button type="submit" form="create-reconciliation-form" isLoading={activeAction === 'create'}>Crear periodo</Button>
          </>
        }
      >
        <form id="create-reconciliation-form" onSubmit={handleCreate} className="space-y-4">
          <p className="text-sm text-slate-600">Se agruparán las órdenes pagadas y aún no conciliadas cuya fecha de pago esté dentro del periodo.</p>
          <Input label="Inicio del periodo" type="date" required value={periodForm.periodo_inicio} onChange={(event) => setPeriodForm((current) => ({ ...current, periodo_inicio: event.target.value }))} />
          <Input label="Fin del periodo" type="date" required value={periodForm.periodo_fin} onChange={(event) => setPeriodForm((current) => ({ ...current, periodo_fin: event.target.value }))} />
          {createError && <p role="alert" className="text-sm text-red-700">{createError}</p>}
        </form>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detalle de conciliación"
        size="xl"
        footer={<Button variant="ghost" onClick={() => setIsDetailOpen(false)}>Cerrar detalle</Button>}
      >
        {isDetailLoading && <div className="flex min-h-40 items-center justify-center text-slate-600">Cargando detalle...</div>}
        {detailError && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{detailError}</div>}
        {detail && !isDetailLoading && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-dark">{formatDate(detail.periodo_inicio)} — {formatDate(detail.periodo_fin)}</p>
                <p className="mt-1 font-mono text-xs text-slate-500">{detail.id}</p>
              </div>
              <EstadoBadge estado={detail.estado} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard label="Monto esperado" value={formatCurrency(detail.monto_esperado)} />
              <SummaryCard label="Abonado por Culqi" value={formatCurrency(detail.monto_abonado_culqi)} />
              <SummaryCard label="Comisión" value={formatCurrency(detail.comision)} />
              <SummaryCard label="Diferencia" value={formatCurrency(detail.diferencia)} />
            </div>

            {canEdit && detail.estado !== 'cerrada' && (
              <form onSubmit={handleUpdate} className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3 sm:items-end">
                <Input label="Monto abonado por Culqi" type="number" min="0" step="0.01" required value={montoAbonado} onChange={(event) => setMontoAbonado(event.target.value)} />
                <Input label="Comisión de Culqi" type="number" min="0" step="0.01" required value={comision} onChange={(event) => setComision(event.target.value)} />
                <Button type="submit" isLoading={activeAction === 'update'}>Guardar importes</Button>
              </form>
            )}

            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-dark">Órdenes del periodo</h2>
                  <p className="text-sm text-slate-600">{detail.ordenes_conciliadas} de {detail.total_ordenes} conciliadas</p>
                </div>
                {canEdit && detail.estado !== 'cerrada' && pendingOrders.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOrderIds(pendingOrders.map((order) => order.orden_id))}>Seleccionar pendientes</Button>
                    <Button size="sm" disabled={selectedOrderIds.length === 0} isLoading={activeAction === 'reconcile'} onClick={() => void handleReconcile()}>Conciliar seleccionadas ({selectedOrderIds.length})</Button>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead className="bg-dark text-white">
                    <tr>
                      {canEdit && detail.estado !== 'cerrada' && <th className="px-4 py-3"><span className="sr-only">Seleccionar</span></th>}
                      <th className="px-4 py-3">Orden</th>
                      <th className="px-4 py-3">Alumno</th>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3">Pago</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {detail.ordenes.map((order) => (
                      <tr key={order.orden_id}>
                        {canEdit && detail.estado !== 'cerrada' && (
                          <td className="px-4 py-3">
                            <input type="checkbox" aria-label={`Seleccionar orden ${order.orden_id}`} checked={selectedOrderIds.includes(order.orden_id)} disabled={order.conciliada} onChange={() => toggleOrder(order.orden_id)} className="h-4 w-4 accent-primary" />
                          </td>
                        )}
                        <td className="px-4 py-3"><span className="font-mono text-xs" title={order.orden_id}>{shortId(order.orden_id)}</span></td>
                        <td className="px-4 py-3"><p className="font-semibold text-dark">{order.alumno}</p><p className="text-xs text-slate-500">DNI {order.dni}</p></td>
                        <td className="px-4 py-3">{order.concepto}</td>
                        <td className="whitespace-nowrap px-4 py-3"><p>{MEDIO_PAGO_LABELS[order.medio_pago]}</p><p className="text-xs text-slate-500">{formatDateTime(order.fecha_pago)}</p></td>
                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-dark">{formatCurrency(order.monto)}</td>
                        <td className="px-4 py-3">{order.conciliada ? <Badge variant="emerald">Conciliada</Badge> : <Badge variant="amber">Pendiente</Badge>}</td>
                      </tr>
                    ))}
                    {detail.ordenes.length === 0 && (
                      <tr><td colSpan={canEdit && detail.estado !== 'cerrada' ? 7 : 6} className="px-4 py-10 text-center text-slate-500">No se encontraron órdenes pagadas sin conciliar en este periodo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {canEdit && detail.estado !== 'cerrada' && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-dark">Cerrar periodo contable</p>
                    <p className="text-sm text-slate-600">Requiere todas las órdenes conciliadas y una diferencia de S/ 0.00.</p>
                  </div>
                  <Button variant="secondary" disabled={!canClose} onClick={() => setIsCloseOpen(true)}>Cerrar conciliación</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={isCloseOpen}
        onClose={() => setIsCloseOpen(false)}
        title="Cerrar conciliación"
        size="sm"
        closeOnBackdrop={activeAction !== 'close'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCloseOpen(false)} disabled={activeAction === 'close'}>Cancelar</Button>
            <Button variant="secondary" isLoading={activeAction === 'close'} onClick={() => void handleClose()}>Confirmar cierre</Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">El periodo quedará cerrado y ya no permitirá modificar importes ni órdenes. Este cierre no elimina su historial.</p>
      </Modal>
    </main>
  )
}
