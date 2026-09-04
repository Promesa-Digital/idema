import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AdminModuleNav from '@/components/admin/AdminModuleNav'
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
import { listarConceptos } from '@/services/conceptosApi'
import {
  activarDescuento,
  actualizarDescuento,
  consultarDescuentoVigente,
  crearDescuento,
  eliminarDescuento,
  listarDescuentos,
} from '@/services/descuentosApi'
import type {
  ConceptoCobroBackend,
  DescuentoBackend,
  DescuentoCreate,
  DescuentoEstado,
  DescuentoTipo,
  UsuarioRol,
} from '@/types/backend'

interface DescuentoFormState {
  tipo: DescuentoTipo
  porcentaje: string
  descripcion: string
  concepto_id: string
}

const EMPTY_FORM: DescuentoFormState = {
  tipo: 'manual',
  porcentaje: '',
  descripcion: '',
  concepto_id: '',
}

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const TIPO_LABELS: Record<DescuentoTipo, string> = {
  manual: 'Manual',
  pronto_pago: 'Pronto pago',
}

const ESTADO_LABELS: Record<DescuentoEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
}

const ESTADO_BADGE_VARIANTS = {
  activo: 'emerald',
  inactivo: 'slate',
} as const

function toFormState(descuento: DescuentoBackend): DescuentoFormState {
  return {
    tipo: descuento.tipo,
    porcentaje: descuento.porcentaje,
    descripcion: descuento.descripcion ?? '',
    concepto_id: descuento.concepto_id,
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function getConceptoLabel(concepto: ConceptoCobroBackend): string {
  const descripcion = concepto.descripcion ? ` (${concepto.descripcion})` : ''
  return `${concepto.tipo} - S/ ${concepto.monto}${descripcion}`
}

export default function DescuentosAdminPage() {
  const { user, logout } = useAuth()
  const [descuentos, setDescuentos] = useState<DescuentoBackend[]>([])
  const [conceptos, setConceptos] = useState<ConceptoCobroBackend[]>([])
  const [estadoFilter, setEstadoFilter] = useState<DescuentoEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingDescuento, setEditingDescuento] = useState<DescuentoBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<DescuentoFormState>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [descuentoToDelete, setDescuentoToDelete] = useState<DescuentoBackend | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [activatingDescuentoId, setActivatingDescuentoId] = useState<string | null>(null)
  const [consultaConceptoId, setConsultaConceptoId] = useState('')
  const [descuentoVigente, setDescuentoVigente] = useState<DescuentoBackend | null>(null)
  const [hasConsulted, setHasConsulted] = useState(false)
  const [consultaError, setConsultaError] = useState('')
  const [isConsulting, setIsConsulting] = useState(false)
  const canManage = user?.rol === 'ventas' || user?.rol === 'admin_sistema'

  useEffect(() => {
    let isActive = true

    Promise.all([
      listarDescuentos(estadoFilter ? { estado: estadoFilter } : {}),
      listarConceptos(),
    ])
      .then(([descuentoData, conceptoData]) => {
        if (!isActive) return
        setDescuentos(descuentoData)
        setConceptos(conceptoData)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudo cargar la gestión de descuentos.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [estadoFilter, logout, reloadKey])

  const syncDescuento = useCallback(
    (updated: DescuentoBackend) => {
      setDescuentos((current) => {
        if (estadoFilter && updated.estado !== estadoFilter) {
          return current.filter((descuento) => descuento.id !== updated.id)
        }

        const exists = current.some((descuento) => descuento.id === updated.id)
        return exists
          ? current.map((descuento) => (descuento.id === updated.id ? updated : descuento))
          : [updated, ...current]
      })
    },
    [estadoFilter],
  )

  const invalidateConsulta = useCallback(() => {
    setDescuentoVigente(null)
    setHasConsulted(false)
    setConsultaError('')
  }, [])

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingDescuento(null)
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingDescuento(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((descuento: DescuentoBackend) => {
    setEditingDescuento(descuento)
    setForm(toFormState(descuento))
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openDeleteModal = useCallback((descuento: DescuentoBackend) => {
    setDescuentoToDelete(descuento)
    setDeleteError('')
  }, [])

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return
    setDescuentoToDelete(null)
    setDeleteError('')
  }, [isDeleting])

  const handleActivate = useCallback(
    async (descuento: DescuentoBackend) => {
      setFeedback('')
      setActionError('')
      setActivatingDescuentoId(descuento.id)

      try {
        const activated = await activarDescuento(descuento.id)
        syncDescuento(activated)
        invalidateConsulta()
        setFeedback(`El descuento de ${activated.porcentaje}% fue reactivado.`)
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setActionError(getErrorMessage(error, 'No se pudo reactivar el descuento.'))
      } finally {
        setActivatingDescuentoId(null)
      }
    },
    [invalidateConsulta, logout, syncDescuento],
  )

  const columns = useMemo<TableColumn<DescuentoBackend>[]>(() => {
    const baseColumns: TableColumn<DescuentoBackend>[] = [
      {
        key: 'tipo',
        header: 'Tipo',
        render: (descuento) => (
          <span className="font-semibold text-dark">{TIPO_LABELS[descuento.tipo]}</span>
        ),
      },
      {
        key: 'porcentaje',
        header: 'Porcentaje',
        render: (descuento) => `${descuento.porcentaje}%`,
      },
      {
        key: 'descripcion',
        header: 'Descripción',
        render: (descuento) => descuento.descripcion || '—',
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (descuento) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[descuento.estado]}>
            {ESTADO_LABELS[descuento.estado]}
          </Badge>
        ),
      },
    ]

    if (canManage) {
      baseColumns.push({
        key: 'acciones',
        header: 'Acciones',
        render: (descuento) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(descuento)}>
              Editar
            </Button>
            {descuento.estado === 'activo' ? (
              <Button size="sm" variant="danger" onClick={() => openDeleteModal(descuento)}>
                Eliminar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => void handleActivate(descuento)}
                isLoading={activatingDescuentoId === descuento.id}
              >
                Reactivar
              </Button>
            )}
          </div>
        ),
      })
    }

    return baseColumns
  }, [activatingDescuentoId, canManage, handleActivate, openDeleteModal, openEditModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setActionError('')

    const porcentaje = Number(form.porcentaje)
    const hasValidDecimals = /^\d+(?:\.\d{1,2})?$/.test(form.porcentaje)

    if (!hasValidDecimals || !Number.isFinite(porcentaje) || porcentaje < 0.1 || porcentaje > 30) {
      setFormError('Ingresa un porcentaje entre 0.1% y 30%, con hasta 2 decimales.')
      return
    }
    if (!form.concepto_id) {
      setFormError('Selecciona un concepto de cobro.')
      return
    }

    setIsSaving(true)

    const payload: DescuentoCreate = {
      tipo: form.tipo,
      porcentaje,
      descripcion: form.descripcion.trim() || null,
      concepto_id: form.concepto_id,
    }

    try {
      const saved = editingDescuento
        ? await actualizarDescuento(editingDescuento.id, payload)
        : await crearDescuento(payload)

      syncDescuento(saved)
      invalidateConsulta()
      setFeedback(
        editingDescuento
          ? `El descuento de ${saved.porcentaje}% se actualizó correctamente.`
          : `El descuento de ${saved.porcentaje}% se creó correctamente.`,
      )
      setIsFormOpen(false)
      setEditingDescuento(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setFormError(getErrorMessage(error, 'No se pudo guardar el descuento.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!descuentoToDelete) return
    setDeleteError('')
    setFeedback('')
    setActionError('')
    setIsDeleting(true)

    try {
      const deleted = await eliminarDescuento(descuentoToDelete.id)
      syncDescuento(deleted)
      invalidateConsulta()
      setFeedback(`El descuento de ${deleted.porcentaje}% fue dado de baja.`)
      setDescuentoToDelete(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setDeleteError(getErrorMessage(error, 'No se pudo dar de baja el descuento.'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConsulta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDescuentoVigente(null)
    setHasConsulted(false)
    setConsultaError('')

    if (!consultaConceptoId) {
      setConsultaError('Selecciona un concepto de cobro para consultar.')
      return
    }

    setIsConsulting(true)

    try {
      const vigente = await consultarDescuentoVigente(consultaConceptoId)
      setDescuentoVigente(vigente)
      setHasConsulted(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setConsultaError(
        getErrorMessage(error, 'No se pudo consultar el descuento vigente del concepto.'),
      )
    } finally {
      setIsConsulting(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Descuentos</h1>
            <AdminModuleNav role={user?.rol} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm sm:text-right">
              <p className="font-semibold">{user?.nombre}</p>
              <p className="text-white/70">{user ? ROL_LABELS[user.rol] : ''}</p>
            </div>
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={logout}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <Select
            label="Filtrar por estado"
            value={estadoFilter}
            onChange={(event) => {
              setIsLoading(true)
              setLoadError('')
              setEstadoFilter(event.target.value as DescuentoEstado | '')
            }}
            containerClassName="w-full sm:max-w-xs"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </Select>
          {canManage && (
            <Button size="lg" onClick={openCreateModal}>
              Nuevo descuento
            </Button>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {feedback}
          </div>
        )}

        {actionError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando descuentos...</p>
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
              {descuentos.length} descuentos disponibles
            </p>
            <Table
              columns={columns}
              data={descuentos}
              getRowKey={(descuento) => descuento.id}
              caption="Listado de descuentos"
              emptyMessage="No hay descuentos para el estado seleccionado."
            />

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-dark">Consultar descuento vigente</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Selecciona un concepto de cobro para verificar si tiene un descuento activo.
                </p>
              </div>

              <form
                onSubmit={handleConsulta}
                noValidate
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <Select
                  label="Concepto de cobro"
                  value={consultaConceptoId}
                  onChange={(event) => {
                    setConsultaConceptoId(event.target.value)
                    invalidateConsulta()
                  }}
                  required
                  disabled={isConsulting}
                  containerClassName="flex-1"
                >
                  <option value="">
                    {conceptos.length === 0
                      ? 'No hay conceptos disponibles'
                      : 'Selecciona un concepto'}
                  </option>
                  {conceptos.map((concepto) => (
                    <option key={concepto.id} value={concepto.id}>
                      {getConceptoLabel(concepto)}
                    </option>
                  ))}
                </Select>
                <Button type="submit" isLoading={isConsulting} disabled={!consultaConceptoId}>
                  Consultar
                </Button>
              </form>

              {consultaError && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {consultaError}
                </div>
              )}

              {hasConsulted && (
                <div aria-live="polite" className="mt-5">
                  {descuentoVigente ? (
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold">
                          {TIPO_LABELS[descuentoVigente.tipo]} · {descuentoVigente.porcentaje}%
                        </p>
                        <Badge variant="emerald">Activo</Badge>
                      </div>
                      <p className="mt-2">
                        {descuentoVigente.descripcion || 'Sin descripción.'}
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      No hay un descuento vigente para este concepto.
                    </p>
                  )}
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingDescuento ? 'Editar descuento' : 'Nuevo descuento'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="descuento-form" isLoading={isSaving}>
              {editingDescuento ? 'Guardar cambios' : 'Crear descuento'}
            </Button>
          </>
        }
      >
        <form
          id="descuento-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-5 sm:grid-cols-2"
        >
          {formError && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
            >
              {formError}
            </div>
          )}

          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                tipo: event.target.value as DescuentoTipo,
              }))
            }
            required
            disabled={isSaving}
          >
            <option value="manual">Manual</option>
            <option value="pronto_pago">Pronto pago</option>
          </Select>
          <Input
            label="Porcentaje"
            type="number"
            min={0.1}
            max={30}
            step={0.1}
            value={form.porcentaje}
            onChange={(event) =>
              setForm((current) => ({ ...current, porcentaje: event.target.value }))
            }
            hint="Entre 0.1% y 30%"
            required
            disabled={isSaving}
          />
          <Select
            label="Concepto de cobro"
            value={form.concepto_id}
            onChange={(event) =>
              setForm((current) => ({ ...current, concepto_id: event.target.value }))
            }
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          >
            <option value="">
              {conceptos.length === 0 ? 'No hay conceptos disponibles' : 'Selecciona un concepto'}
            </option>
            {conceptos.map((concepto) => (
              <option key={concepto.id} value={concepto.id}>
                {getConceptoLabel(concepto)}
              </option>
            ))}
          </Select>
          <Textarea
            label="Descripción"
            rows={4}
            maxLength={255}
            value={form.descripcion}
            onChange={(event) =>
              setForm((current) => ({ ...current, descripcion: event.target.value }))
            }
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(descuentoToDelete)}
        onClose={closeDeleteModal}
        title="Eliminar descuento"
        size="sm"
        closeOnBackdrop={!isDeleting}
        footer={
          <>
            <Button variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Sí, eliminar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que deseas dar de baja el descuento de{' '}
          <strong>{descuentoToDelete?.porcentaje}%</strong>? El registro no se borrará y podrá
          reactivarse.
        </p>
        {deleteError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {deleteError}
          </div>
        )}
      </Modal>
    </main>
  )
}
