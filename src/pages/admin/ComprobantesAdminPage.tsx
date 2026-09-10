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
  actualizarComprobante,
  anularComprobante,
  emitirComprobante,
  listarComprobantes,
  obtenerComprobante,
} from '@/services/comprobantesApi'
import type { ComprobanteUpdateData } from '@/services/comprobantesApi'
import { listarOrdenes } from '@/services/ordenesApi'
import type {
  ComprobanteBackend,
  ComprobanteCreate,
  ComprobanteEstado,
  ComprobanteTipo,
  OrdenPagoBackend,
  OrdenPagoMedioPago,
} from '@/types/backend'

interface EmissionFormState {
  orden_id: string
  tipo: ComprobanteTipo
  nombre_pagador: string
  ruc: string
  razon_social: string
}

interface EmissionFormErrors {
  orden_id?: string
  nombre_pagador?: string
  ruc?: string
  razon_social?: string
  form?: string
}

interface EditFormState {
  numero: string
  estado: ComprobanteEstado
  motivo: string
}

interface DetailItemProps {
  label: string
  children: ReactNode
  fullWidth?: boolean
}

const EMPTY_EMISSION_FORM: EmissionFormState = {
  orden_id: '',
  tipo: 'boleta',
  nombre_pagador: '',
  ruc: '',
  razon_social: '',
}

const TIPO_LABELS: Record<ComprobanteTipo, string> = {
  boleta: 'Boleta',
  factura: 'Factura',
}

const ESTADO_LABELS: Record<ComprobanteEstado, string> = {
  emitido: 'Emitido',
  observado: 'Observado',
  anulado: 'Anulado',
}

const MEDIO_PAGO_LABELS: Record<OrdenPagoMedioPago, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  transferencia: 'Transferencia',
}

const ESTADO_BADGES = {
  emitido: 'emerald',
  observado: 'amber',
  anulado: 'red',
} as const

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(value: string): string {
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

function EstadoBadge({ estado }: { estado: ComprobanteEstado }) {
  return <Badge variant={ESTADO_BADGES[estado]}>{ESTADO_LABELS[estado]}</Badge>
}

function getOrderLabel(order: OrdenPagoBackend): string {
  return `S/ ${order.monto} · ${MEDIO_PAGO_LABELS[order.medio_pago]} · ${truncateId(order.id)}`
}

export default function ComprobantesAdminPage() {
  const { logout } = useAuth()
  const [comprobantes, setComprobantes] = useState<ComprobanteBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const [isEmissionOpen, setIsEmissionOpen] = useState(false)
  const [emissionForm, setEmissionForm] = useState<EmissionFormState>({ ...EMPTY_EMISSION_FORM })
  const [emissionErrors, setEmissionErrors] = useState<EmissionFormErrors>({})
  const [isEmitting, setIsEmitting] = useState(false)
  const [paidOrders, setPaidOrders] = useState<OrdenPagoBackend[]>([])
  const [isOrdersLoading, setIsOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [ordersReloadKey, setOrdersReloadKey] = useState(0)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailReceipt, setDetailReceipt] = useState<ComprobanteBackend | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailRequestId = useRef(0)

  const [receiptToEdit, setReceiptToEdit] = useState<ComprobanteBackend | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({
    numero: '',
    estado: 'emitido',
    motivo: '',
  })
  const [editError, setEditError] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const [receiptToCancel, setReceiptToCancel] = useState<ComprobanteBackend | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isActive = true

    listarComprobantes()
      .then((data) => {
        if (isActive) setComprobantes(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudieron cargar los comprobantes.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, reloadKey])

  useEffect(() => {
    if (!isEmissionOpen) return

    let isActive = true

    listarOrdenes({ estado: 'pagada' })
      .then((data) => {
        if (isActive) setPaidOrders(data.filter((order) => order.estado === 'pagada'))
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setOrdersError(getErrorMessage(error, 'No se pudieron cargar las órdenes pagadas.'))
      })
      .finally(() => {
        if (isActive) setIsOrdersLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [isEmissionOpen, logout, ordersReloadKey])

  const syncReceipt = useCallback((updated: ComprobanteBackend) => {
    setComprobantes((current) =>
      current.map((receipt) => (receipt.id === updated.id ? updated : receipt)),
    )
    setDetailReceipt((current) => (current?.id === updated.id ? updated : current))
  }, [])

  const openEmission = useCallback(() => {
    setEmissionForm({ ...EMPTY_EMISSION_FORM })
    setEmissionErrors({})
    setPaidOrders([])
    setIsOrdersLoading(true)
    setOrdersError('')
    setIsEmissionOpen(true)
  }, [])

  const closeEmission = useCallback(() => {
    if (isEmitting) return
    setIsEmissionOpen(false)
    setEmissionForm({ ...EMPTY_EMISSION_FORM })
    setEmissionErrors({})
  }, [isEmitting])

  const closeDetail = useCallback(() => {
    detailRequestId.current += 1
    setIsDetailOpen(false)
    setDetailError('')
  }, [])

  const openDetail = useCallback(
    async (receipt: ComprobanteBackend) => {
      const requestId = detailRequestId.current + 1
      detailRequestId.current = requestId
      setIsDetailOpen(true)
      setDetailReceipt(receipt)
      setDetailError('')
      setIsDetailLoading(true)

      try {
        const currentReceipt = await obtenerComprobante(receipt.id)
        if (detailRequestId.current === requestId) setDetailReceipt(currentReceipt)
      } catch (error) {
        if (detailRequestId.current !== requestId) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setDetailError(getErrorMessage(error, 'No se pudo cargar el detalle del comprobante.'))
      } finally {
        if (detailRequestId.current === requestId) setIsDetailLoading(false)
      }
    },
    [logout],
  )

  const openEdit = useCallback((receipt: ComprobanteBackend) => {
    setReceiptToEdit(receipt)
    setEditForm({
      numero: receipt.numero ?? '',
      estado: receipt.estado,
      motivo: receipt.motivo ?? '',
    })
    setEditError('')
  }, [])

  const closeEdit = useCallback(() => {
    if (isEditing) return
    setReceiptToEdit(null)
    setEditError('')
  }, [isEditing])

  const openCancellation = useCallback((receipt: ComprobanteBackend) => {
    setReceiptToCancel(receipt)
    setCancellationReason('')
    setCancellationError('')
  }, [])

  const closeCancellation = useCallback(() => {
    if (isCancelling) return
    setReceiptToCancel(null)
    setCancellationReason('')
    setCancellationError('')
  }, [isCancelling])

  const columns = useMemo<TableColumn<ComprobanteBackend>[]>(
    () => [
      {
        key: 'tipo',
        header: 'Tipo',
        render: (receipt) => TIPO_LABELS[receipt.tipo],
      },
      {
        key: 'numero',
        header: 'Número',
        render: (receipt) => (
          <span className={receipt.numero ? 'font-semibold text-dark' : 'text-slate-500'}>
            {receipt.numero || 'Sin asignar'}
          </span>
        ),
      },
      {
        key: 'nombre_pagador',
        header: 'Nombre del pagador',
        render: (receipt) => receipt.nombre_pagador,
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (receipt) => <EstadoBadge estado={receipt.estado} />,
      },
      {
        key: 'fecha_emision',
        header: 'Fecha de emisión',
        render: (receipt) => (
          <span className="whitespace-nowrap">{formatDate(receipt.fecha_emision)}</span>
        ),
      },
      {
        key: 'orden_id',
        header: 'Orden',
        render: (receipt) => (
          <span title={receipt.orden_id} className="font-mono text-xs">
            {truncateId(receipt.orden_id)}
          </span>
        ),
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (receipt) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => void openDetail(receipt)}>
              Ver detalle
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openEdit(receipt)}>
              Editar
            </Button>
            {receipt.estado !== 'anulado' && (
              <Button size="sm" variant="danger" onClick={() => openCancellation(receipt)}>
                Anular
              </Button>
            )}
          </div>
        ),
      },
    ],
    [openCancellation, openDetail, openEdit],
  )

  const handleEmission = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors: EmissionFormErrors = {}
    const payerName = emissionForm.nombre_pagador.trim()
    const ruc = emissionForm.ruc.trim()
    const businessName = emissionForm.razon_social.trim()

    if (!emissionForm.orden_id) nextErrors.orden_id = 'Selecciona una orden pagada.'
    if (!payerName) nextErrors.nombre_pagador = 'Ingresa el nombre del pagador.'
    if (emissionForm.tipo === 'factura') {
      if (ruc.length !== 11) nextErrors.ruc = 'El RUC debe tener exactamente 11 caracteres.'
      if (!businessName) nextErrors.razon_social = 'Ingresa la razón social.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setEmissionErrors(nextErrors)
      return
    }

    const data: ComprobanteCreate = {
      orden_id: emissionForm.orden_id,
      tipo: emissionForm.tipo,
      nombre_pagador: payerName,
    }

    if (emissionForm.tipo === 'factura') {
      data.ruc = ruc
      data.razon_social = businessName
    }

    setEmissionErrors({})
    setFeedback('')
    setIsEmitting(true)

    try {
      const emitted = await emitirComprobante(data)
      setComprobantes((current) => [
        emitted,
        ...current.filter((receipt) => receipt.id !== emitted.id),
      ])
      setFeedback(`El comprobante ${truncateId(emitted.id)} fue emitido correctamente.`)
      setIsEmissionOpen(false)
      setEmissionForm({ ...EMPTY_EMISSION_FORM })
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setEmissionErrors({
        form: getErrorMessage(error, 'No se pudo emitir el comprobante.'),
      })
    } finally {
      setIsEmitting(false)
    }
  }

  const handleEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!receiptToEdit) return

    const numero = editForm.numero.trim()
    const motivo = editForm.motivo.trim()
    const data: ComprobanteUpdateData = {}

    if (numero !== (receiptToEdit.numero ?? '')) data.numero = numero
    if (editForm.estado !== receiptToEdit.estado) data.estado = editForm.estado
    if (motivo !== (receiptToEdit.motivo ?? '')) data.motivo = motivo

    if (Object.keys(data).length === 0) {
      setEditError('Realiza al menos un cambio antes de guardar.')
      return
    }

    setEditError('')
    setFeedback('')
    setIsEditing(true)

    try {
      const updated = await actualizarComprobante(receiptToEdit.id, data)
      syncReceipt(updated)
      setFeedback(`El comprobante ${truncateId(updated.id)} fue actualizado correctamente.`)
      setReceiptToEdit(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setEditError(getErrorMessage(error, 'No se pudo actualizar el comprobante.'))
    } finally {
      setIsEditing(false)
    }
  }

  const handleCancellation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!receiptToCancel) return

    const reason = cancellationReason.trim()
    if (!reason) {
      setCancellationError('Ingresa el motivo de la anulación.')
      return
    }

    setCancellationError('')
    setFeedback('')
    setIsCancelling(true)

    try {
      const cancelled = await anularComprobante(receiptToCancel.id, reason)
      syncReceipt(cancelled)
      setFeedback(`El comprobante ${truncateId(cancelled.id)} fue anulado correctamente.`)
      setReceiptToCancel(null)
      setCancellationReason('')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setCancellationError(getErrorMessage(error, 'No se pudo anular el comprobante.'))
    } finally {
      setIsCancelling(false)
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
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-dark">Comprobantes emitidos</h2>
            <p className="mt-1 text-sm text-slate-600">
              Consulta, corrige y anula los comprobantes registrados.
            </p>
          </div>
          <Button onClick={openEmission}>Emitir comprobante</Button>
        </div>

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
              <p className="text-slate-600">Cargando comprobantes...</p>
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
              {comprobantes.length}{' '}
              {comprobantes.length === 1 ? 'comprobante disponible' : 'comprobantes disponibles'}
            </p>
            <Table
              columns={columns}
              data={comprobantes}
              getRowKey={(receipt) => receipt.id}
              caption="Listado de comprobantes"
              emptyMessage="No hay comprobantes registrados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isEmissionOpen}
        onClose={closeEmission}
        title="Emitir comprobante"
        size="lg"
        closeOnBackdrop={!isEmitting}
        footer={
          <>
            <Button variant="ghost" onClick={closeEmission} disabled={isEmitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="emit-receipt-form"
              isLoading={isEmitting}
              disabled={isOrdersLoading || Boolean(ordersError) || paidOrders.length === 0}
            >
              Emitir comprobante
            </Button>
          </>
        }
      >
        <form id="emit-receipt-form" onSubmit={handleEmission} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Orden pagada"
              value={emissionForm.orden_id}
              onChange={(event) => {
                setEmissionForm((current) => ({ ...current, orden_id: event.target.value }))
                setEmissionErrors((current) => ({ ...current, orden_id: undefined, form: undefined }))
              }}
              error={emissionErrors.orden_id}
              hint={
                isOrdersLoading
                  ? 'Cargando órdenes pagadas...'
                  : paidOrders.length === 0 && !ordersError
                    ? 'No hay órdenes pagadas disponibles.'
                    : undefined
              }
              required
              disabled={isEmitting || isOrdersLoading || Boolean(ordersError)}
              containerClassName="sm:col-span-2"
            >
              <option value="">
                {isOrdersLoading ? 'Cargando...' : 'Selecciona una orden pagada'}
              </option>
              {paidOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {getOrderLabel(order)}
                </option>
              ))}
            </Select>

            {ordersError && (
              <div
                role="alert"
                className="flex flex-col gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{ordersError}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0 text-red-700 hover:bg-red-100"
                  onClick={() => {
                    setPaidOrders([])
                    setIsOrdersLoading(true)
                    setOrdersError('')
                    setOrdersReloadKey((current) => current + 1)
                  }}
                >
                  Reintentar
                </Button>
              </div>
            )}

            <Select
              label="Tipo"
              value={emissionForm.tipo}
              onChange={(event) => {
                const tipo = event.target.value as ComprobanteTipo
                setEmissionForm((current) => ({
                  ...current,
                  tipo,
                  ruc: tipo === 'boleta' ? '' : current.ruc,
                  razon_social: tipo === 'boleta' ? '' : current.razon_social,
                }))
                setEmissionErrors((current) => ({
                  ...current,
                  ruc: undefined,
                  razon_social: undefined,
                  form: undefined,
                }))
              }}
              required
              disabled={isEmitting}
            >
              <option value="boleta">Boleta</option>
              <option value="factura">Factura</option>
            </Select>

            <Input
              label="Nombre del pagador"
              value={emissionForm.nombre_pagador}
              onChange={(event) => {
                setEmissionForm((current) => ({
                  ...current,
                  nombre_pagador: event.target.value,
                }))
                setEmissionErrors((current) => ({
                  ...current,
                  nombre_pagador: undefined,
                  form: undefined,
                }))
              }}
              error={emissionErrors.nombre_pagador}
              required
              disabled={isEmitting}
            />

            {emissionForm.tipo === 'factura' && (
              <>
                <Input
                  label="RUC"
                  value={emissionForm.ruc}
                  onChange={(event) => {
                    setEmissionForm((current) => ({ ...current, ruc: event.target.value }))
                    setEmissionErrors((current) => ({
                      ...current,
                      ruc: undefined,
                      form: undefined,
                    }))
                  }}
                  error={emissionErrors.ruc}
                  hint="Debe tener exactamente 11 caracteres."
                  maxLength={11}
                  required
                  disabled={isEmitting}
                />
                <Input
                  label="Razón social"
                  value={emissionForm.razon_social}
                  onChange={(event) => {
                    setEmissionForm((current) => ({
                      ...current,
                      razon_social: event.target.value,
                    }))
                    setEmissionErrors((current) => ({
                      ...current,
                      razon_social: undefined,
                      form: undefined,
                    }))
                  }}
                  error={emissionErrors.razon_social}
                  required
                  disabled={isEmitting}
                />
              </>
            )}
          </div>

          {emissionErrors.form && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {emissionErrors.form}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        title="Detalle del comprobante"
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
        {detailReceipt && (
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailItem label="ID" fullWidth>
              <span className="font-mono text-xs">{detailReceipt.id}</span>
            </DetailItem>
            <DetailItem label="Tipo">{TIPO_LABELS[detailReceipt.tipo]}</DetailItem>
            <DetailItem label="Número">{detailReceipt.numero || 'Sin asignar'}</DetailItem>
            <DetailItem label="Nombre del pagador">{detailReceipt.nombre_pagador}</DetailItem>
            <DetailItem label="Estado">
              <EstadoBadge estado={detailReceipt.estado} />
            </DetailItem>
            <DetailItem label="RUC">{detailReceipt.ruc || '—'}</DetailItem>
            <DetailItem label="Razón social">{detailReceipt.razon_social || '—'}</DetailItem>
            <DetailItem label="Motivo" fullWidth>
              {detailReceipt.motivo || '—'}
            </DetailItem>
            <DetailItem label="Nota de crédito">
              {detailReceipt.nota_credito || '—'}
            </DetailItem>
            <DetailItem label="Fecha de emisión">
              {formatDate(detailReceipt.fecha_emision)}
            </DetailItem>
            <DetailItem label="Orden ID" fullWidth>
              <span className="font-mono text-xs">{detailReceipt.orden_id}</span>
            </DetailItem>
            <DetailItem label="Fecha de creación">
              {formatDate(detailReceipt.created_at)}
            </DetailItem>
            <DetailItem label="Última actualización">
              {formatDate(detailReceipt.updated_at)}
            </DetailItem>
          </dl>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(receiptToEdit)}
        onClose={closeEdit}
        title="Editar comprobante"
        size="md"
        closeOnBackdrop={!isEditing}
        footer={
          <>
            <Button variant="ghost" onClick={closeEdit} disabled={isEditing}>
              Cancelar
            </Button>
            <Button type="submit" form="edit-receipt-form" isLoading={isEditing}>
              Guardar cambios
            </Button>
          </>
        }
      >
        <form id="edit-receipt-form" onSubmit={handleEdit} noValidate>
          <div className="grid gap-4">
            <Input
              label="Número"
              value={editForm.numero}
              onChange={(event) => {
                setEditForm((current) => ({ ...current, numero: event.target.value }))
                if (editError) setEditError('')
              }}
              placeholder="Sin asignar"
              disabled={isEditing}
            />
            <Select
              label="Estado"
              value={editForm.estado}
              onChange={(event) => {
                setEditForm((current) => ({
                  ...current,
                  estado: event.target.value as ComprobanteEstado,
                }))
                if (editError) setEditError('')
              }}
              disabled={isEditing}
            >
              <option value="emitido">Emitido</option>
              <option value="observado">Observado</option>
              <option value="anulado">Anulado</option>
            </Select>
            <Textarea
              label="Motivo"
              rows={4}
              value={editForm.motivo}
              onChange={(event) => {
                setEditForm((current) => ({ ...current, motivo: event.target.value }))
                if (editError) setEditError('')
              }}
              disabled={isEditing}
            />
          </div>
          {editError && (
            <p role="alert" className="mt-4 text-sm text-red-700">
              {editError}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(receiptToCancel)}
        onClose={closeCancellation}
        title="Anular comprobante"
        size="sm"
        closeOnBackdrop={!isCancelling}
        footer={
          <>
            <Button variant="ghost" onClick={closeCancellation} disabled={isCancelling}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cancel-receipt-form"
              variant="danger"
              isLoading={isCancelling}
            >
              Sí, anular
            </Button>
          </>
        }
      >
        <form id="cancel-receipt-form" onSubmit={handleCancellation} noValidate>
          <p className="mb-4 text-sm text-slate-700">
            Esta acción anulará el comprobante <strong>{receiptToCancel?.id}</strong> y generará su nota
            de crédito.
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
    </main>
  )
}
