import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import Textarea from '@/components/ui/Textarea'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  anularOrden,
  confirmarTransferencia,
  listarOrdenes,
  obtenerOrden,
} from '@/services/ordenesApi'
import type { OrdenesFiltros } from '@/services/ordenesApi'
import type {
  OrdenPagoBackend,
  OrdenPagoEstado,
  OrdenPagoMedioPago,
} from '@/types/backend'

interface FilterFormState {
  estado: OrdenPagoEstado | ''
  medio_pago: OrdenPagoMedioPago | ''
  fecha_desde: string
  fecha_hasta: string
}

interface DetailItemProps {
  label: string
  children: ReactNode
  fullWidth?: boolean
}

const EMPTY_FILTERS: FilterFormState = {
  estado: '',
  medio_pago: '',
  fecha_desde: '',
  fecha_hasta: '',
}

const ESTADO_LABELS: Record<OrdenPagoEstado, string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  fallida: 'Fallida',
  anulada: 'Anulada',
  conciliada: 'Conciliada',
  pendiente_confirmacion: 'Pendiente de confirmación',
}

const MEDIO_PAGO_LABELS: Record<OrdenPagoMedioPago, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  transferencia: 'Transferencia',
}

const ESTADO_BADGES = {
  pendiente: { variant: 'amber', className: '' },
  pagada: { variant: 'emerald', className: '' },
  fallida: { variant: 'red', className: '' },
  anulada: { variant: 'red', className: 'ring-1 ring-inset ring-red-700' },
  conciliada: { variant: 'sky', className: '' },
  pendiente_confirmacion: {
    variant: 'amber',
    className: 'ring-1 ring-inset ring-amber-500',
  },
} as const

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMATTER.format(date)
}

function truncateId(id: string): string {
  return `${id.slice(0, 8)}…`
}

function DetailItem({ label, children, fullWidth = false }: DetailItemProps) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-dark">{children}</dd>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: OrdenPagoEstado }) {
  const badge = ESTADO_BADGES[estado]

  return (
    <Badge variant={badge.variant} className={badge.className}>
      {ESTADO_LABELS[estado]}
    </Badge>
  )
}

export default function OrdenesAdminPage() {
  const { logout } = useAuth()
  const [ordenes, setOrdenes] = useState<OrdenPagoBackend[]>([])
  const [filterForm, setFilterForm] = useState<FilterFormState>({ ...EMPTY_FILTERS })
  const [appliedFilters, setAppliedFilters] = useState<OrdenesFiltros>({})
  const [filterError, setFilterError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState<OrdenPagoBackend | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailRequestId = useRef(0)
  const [orderToCancel, setOrderToCancel] = useState<OrdenPagoBackend | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)
  const [orderToConfirm, setOrderToConfirm] = useState<OrdenPagoBackend | null>(null)
  const [confirmationError, setConfirmationError] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)

  useEffect(() => {
    let isActive = true

    listarOrdenes(appliedFilters)
      .then((data) => {
        if (isActive) setOrdenes(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudieron cargar las órdenes de pago.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [appliedFilters, logout, reloadKey])

  const syncOrder = useCallback(
    (updated: OrdenPagoBackend) => {
      setOrdenes((current) => {
        const matchesFilters =
          (!appliedFilters.estado || updated.estado === appliedFilters.estado) &&
          (!appliedFilters.medio_pago || updated.medio_pago === appliedFilters.medio_pago)

        if (!matchesFilters) return current.filter((order) => order.id !== updated.id)
        return current.map((order) => (order.id === updated.id ? updated : order))
      })
      setDetailOrder((current) => (current?.id === updated.id ? updated : current))
    },
    [appliedFilters],
  )

  const closeDetail = useCallback(() => {
    detailRequestId.current += 1
    setIsDetailOpen(false)
    setDetailError('')
  }, [])

  const openDetail = useCallback(
    async (order: OrdenPagoBackend) => {
      const requestId = detailRequestId.current + 1
      detailRequestId.current = requestId
      setIsDetailOpen(true)
      setDetailOrder(order)
      setDetailError('')
      setIsDetailLoading(true)

      try {
        const currentOrder = await obtenerOrden(order.id)
        if (detailRequestId.current === requestId) setDetailOrder(currentOrder)
      } catch (error) {
        if (detailRequestId.current !== requestId) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setDetailError(getErrorMessage(error, 'No se pudo cargar el detalle de la orden.'))
      } finally {
        if (detailRequestId.current === requestId) setIsDetailLoading(false)
      }
    },
    [logout],
  )

  const openCancellation = useCallback((order: OrdenPagoBackend) => {
    setOrderToCancel(order)
    setCancellationReason('')
    setCancellationError('')
  }, [])

  const closeCancellation = useCallback(() => {
    if (isCancelling) return
    setOrderToCancel(null)
    setCancellationReason('')
    setCancellationError('')
  }, [isCancelling])

  const openConfirmation = useCallback((order: OrdenPagoBackend) => {
    setOrderToConfirm(order)
    setConfirmationError('')
  }, [])

  const closeConfirmation = useCallback(() => {
    if (isConfirming) return
    setOrderToConfirm(null)
    setConfirmationError('')
  }, [isConfirming])

  const columns = useMemo<TableColumn<OrdenPagoBackend>[]>(
    () => [
      {
        key: 'monto',
        header: 'Monto',
        render: (order) => <span className="font-semibold text-dark">S/ {order.monto}</span>,
      },
      {
        key: 'medio_pago',
        header: 'Medio de pago',
        render: (order) => MEDIO_PAGO_LABELS[order.medio_pago],
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (order) => <EstadoBadge estado={order.estado} />,
      },
      {
        key: 'created_at',
        header: 'Fecha de creación',
        render: (order) => <span className="whitespace-nowrap">{formatDate(order.created_at)}</span>,
      },
      {
        key: 'alumno_id',
        header: 'Alumno',
        render: (order) => (
          <span title={order.alumno_id} className="font-mono text-xs">
            {truncateId(order.alumno_id)}
          </span>
        ),
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (order) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => void openDetail(order)}>
              Ver detalle
            </Button>
            {order.estado !== 'anulada' && order.estado !== 'conciliada' && (
              <Button size="sm" variant="danger" onClick={() => openCancellation(order)}>
                Anular
              </Button>
            )}
            {order.estado === 'pendiente_confirmacion' && (
              <Button size="sm" onClick={() => openConfirmation(order)}>
                Confirmar transferencia
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openCancellation, openConfirmation, openDetail],
  )

  const handleFilter = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFilterError('')

    if (
      filterForm.fecha_desde &&
      filterForm.fecha_hasta &&
      filterForm.fecha_desde > filterForm.fecha_hasta
    ) {
      setFilterError('La fecha desde no puede ser posterior a la fecha hasta.')
      return
    }

    setIsLoading(true)
    setLoadError('')
    setAppliedFilters({
      estado: filterForm.estado || undefined,
      medio_pago: filterForm.medio_pago || undefined,
      fecha_desde: filterForm.fecha_desde || undefined,
      fecha_hasta: filterForm.fecha_hasta || undefined,
    })
  }

  const handleCancellation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!orderToCancel) return

    const reason = cancellationReason.trim()
    if (!reason) {
      setCancellationError('Ingresa el motivo de la anulación.')
      return
    }

    setCancellationError('')
    setFeedback('')
    setIsCancelling(true)

    try {
      const cancelled = await anularOrden(orderToCancel.id, reason)
      syncOrder(cancelled)
      setFeedback(`La orden ${truncateId(cancelled.id)} fue anulada correctamente.`)
      setOrderToCancel(null)
      setCancellationReason('')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setCancellationError(getErrorMessage(error, 'No se pudo anular la orden.'))
    } finally {
      setIsCancelling(false)
    }
  }

  const handleConfirmation = async () => {
    if (!orderToConfirm) return

    setConfirmationError('')
    setFeedback('')
    setIsConfirming(true)

    try {
      const confirmed = await confirmarTransferencia(orderToConfirm.id)
      syncOrder(confirmed)
      setFeedback(`La transferencia de la orden ${truncateId(confirmed.id)} fue confirmada.`)
      setOrderToConfirm(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setConfirmationError(getErrorMessage(error, 'No se pudo confirmar la transferencia.'))
    } finally {
      setIsConfirming(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <form
          onSubmit={handleFilter}
          className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <Select
              label="Estado"
              value={filterForm.estado}
              onChange={(event) =>
                setFilterForm((current) => ({
                  ...current,
                  estado: event.target.value as OrdenPagoEstado | '',
                }))
              }
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="fallida">Fallida</option>
              <option value="anulada">Anulada</option>
              <option value="conciliada">Conciliada</option>
              <option value="pendiente_confirmacion">Pendiente de confirmación</option>
            </Select>
            <Select
              label="Medio de pago"
              value={filterForm.medio_pago}
              onChange={(event) =>
                setFilterForm((current) => ({
                  ...current,
                  medio_pago: event.target.value as OrdenPagoMedioPago | '',
                }))
              }
            >
              <option value="">Todos los medios</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="yape">Yape</option>
              <option value="transferencia">Transferencia</option>
            </Select>
            <Input
              label="Fecha desde"
              type="date"
              value={filterForm.fecha_desde}
              onChange={(event) =>
                setFilterForm((current) => ({ ...current, fecha_desde: event.target.value }))
              }
            />
            <Input
              label="Fecha hasta"
              type="date"
              value={filterForm.fecha_hasta}
              onChange={(event) =>
                setFilterForm((current) => ({ ...current, fecha_hasta: event.target.value }))
              }
            />
            <Button type="submit" isLoading={isLoading}>
              Filtrar
            </Button>
          </div>
          {filterError && (
            <p role="alert" className="mt-3 text-sm text-red-700">
              {filterError}
            </p>
          )}
        </form>

        {feedback && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando órdenes de pago...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">
              {loadError}
            </p>
            <Button variant="secondary" onClick={handleRetry}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {ordenes.length} {ordenes.length === 1 ? 'orden disponible' : 'órdenes disponibles'}
            </p>
            <Table
              columns={columns}
              data={ordenes}
              getRowKey={(order) => order.id}
              caption="Listado de órdenes de pago"
              emptyMessage="No hay órdenes que coincidan con los filtros seleccionados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        title="Detalle de la orden"
        size="lg"
        footer={
          <Button variant="ghost" onClick={closeDetail}>
            Cerrar
          </Button>
        }
      >
        {isDetailLoading && (
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-600" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            Actualizando detalle...
          </div>
        )}
        {detailError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {detailError}
          </div>
        )}
        {detailOrder && (
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailItem label="ID" fullWidth>
              <span className="font-mono text-xs">{detailOrder.id}</span>
            </DetailItem>
            <DetailItem label="Monto">S/ {detailOrder.monto}</DetailItem>
            <DetailItem label="Medio de pago">
              {MEDIO_PAGO_LABELS[detailOrder.medio_pago]}
            </DetailItem>
            <DetailItem label="Estado">
              <EstadoBadge estado={detailOrder.estado} />
            </DetailItem>
            <DetailItem label="Fecha de pago">{formatDate(detailOrder.fecha_pago)}</DetailItem>
            <DetailItem label="Referencia Culqi">{detailOrder.ref_culqi || '—'}</DetailItem>
            <DetailItem label="Voucher">
              {detailOrder.voucher_url ? (
                <a
                  href={detailOrder.voucher_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all font-semibold text-deep underline decoration-deep/30 underline-offset-2 hover:decoration-deep"
                >
                  {detailOrder.voucher_url}
                </a>
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Alumno ID">
              <span className="font-mono text-xs">{detailOrder.alumno_id}</span>
            </DetailItem>
            <DetailItem label="Concepto ID">
              <span className="font-mono text-xs">{detailOrder.concepto_id}</span>
            </DetailItem>
            <DetailItem label="Descuento ID">
              {detailOrder.descuento_id ? (
                <span className="font-mono text-xs">{detailOrder.descuento_id}</span>
              ) : (
                '—'
              )}
            </DetailItem>
            <DetailItem label="Motivo de anulación">
              {detailOrder.motivo_anulacion || '—'}
            </DetailItem>
            <DetailItem label="Fecha de creación">{formatDate(detailOrder.created_at)}</DetailItem>
            <DetailItem label="Última actualización">
              {formatDate(detailOrder.updated_at)}
            </DetailItem>
          </dl>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(orderToCancel)}
        onClose={closeCancellation}
        title="Anular orden"
        size="sm"
        closeOnBackdrop={!isCancelling}
        footer={
          <>
            <Button variant="ghost" onClick={closeCancellation} disabled={isCancelling}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cancel-order-form"
              variant="danger"
              isLoading={isCancelling}
            >
              Sí, anular
            </Button>
          </>
        }
      >
        <form id="cancel-order-form" onSubmit={handleCancellation} noValidate>
          <p className="mb-4 text-sm text-slate-700">
            Esta acción anulará la orden <strong>{orderToCancel?.id}</strong>.
          </p>
          <Textarea
            label="Motivo"
            rows={4}
            value={cancellationReason}
            onChange={(event) => {
              setCancellationReason(event.target.value)
              if (cancellationError) setCancellationError('')
            }}
            error={cancellationError}
            required
            disabled={isCancelling}
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(orderToConfirm)}
        onClose={closeConfirmation}
        title="Confirmar transferencia"
        size="sm"
        closeOnBackdrop={!isConfirming}
        footer={
          <>
            <Button variant="ghost" onClick={closeConfirmation} disabled={isConfirming}>
              Cancelar
            </Button>
            <Button onClick={() => void handleConfirmation()} isLoading={isConfirming}>
              Sí, confirmar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que el voucher de la orden <strong>{orderToConfirm?.id}</strong> fue verificado?
        </p>
        {confirmationError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {confirmationError}
          </div>
        )}
      </Modal>
    </main>
  )
}
