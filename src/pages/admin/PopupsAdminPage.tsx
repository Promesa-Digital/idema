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
import {
  actualizarPopup,
  aprobar,
  crearPopup,
  enviarAprobacion,
  finalizar,
  listarPopups,
  publicar,
  rechazar,
} from '@/services/popupsApi'
import type {
  PopupBackend,
  PopupCreate,
  PopupEstado,
  PopupTipo,
  UsuarioRol,
} from '@/types/backend'

interface PopupFormState {
  tipo: PopupTipo
  texto: string
  imagen_url: string
  video_url: string
  enlace: string
  paginas: string
  monto_descuento: string
  duracion_temporizador: string
  texto_superior: string
  fecha_inicio: string
  fecha_fin: string
}

type WorkflowAction = 'enviar' | 'aprobar' | 'rechazar' | 'publicar' | 'finalizar'

interface PendingWorkflow {
  popup: PopupBackend
  action: WorkflowAction
}

const TIPO_LABELS: Record<PopupTipo, string> = {
  anuncio: 'Anuncio',
  descuento: 'Descuento',
}

const ESTADO_LABELS: Record<PopupEstado, string> = {
  borrador: 'Borrador',
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  publicado: 'Publicado',
  finalizado: 'Finalizado',
}

const ESTADO_BADGE_VARIANTS = {
  borrador: 'slate',
  pendiente: 'amber',
  aprobado: 'sky',
  rechazado: 'red',
  publicado: 'emerald',
  finalizado: 'violet',
} as const

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const WORKFLOW_COPY: Record<
  WorkflowAction,
  {
    confirmLabel: string
    title: string
    question: string
    success: string
  }
> = {
  enviar: {
    confirmLabel: 'Sí, enviar',
    title: 'Enviar popup a aprobación',
    question: '¿Confirmas que deseas enviar a revisión el popup',
    success: 'El popup fue enviado a aprobación.',
  },
  aprobar: {
    confirmLabel: 'Sí, aprobar',
    title: 'Aprobar popup',
    question: '¿Confirmas que deseas aprobar el popup',
    success: 'El popup fue aprobado.',
  },
  rechazar: {
    confirmLabel: 'Sí, rechazar',
    title: 'Rechazar popup',
    question: '¿Confirmas que deseas rechazar el popup',
    success: 'El popup fue rechazado.',
  },
  publicar: {
    confirmLabel: 'Sí, publicar',
    title: 'Publicar popup',
    question: '¿Confirmas que deseas publicar el popup',
    success: 'El popup fue publicado.',
  },
  finalizar: {
    confirmLabel: 'Sí, finalizar',
    title: 'Finalizar popup',
    question: '¿Confirmas que deseas finalizar el popup',
    success: 'El popup fue finalizado.',
  },
}

const WORKFLOW_HANDLERS: Record<WorkflowAction, (id: string) => Promise<PopupBackend>> = {
  enviar: enviarAprobacion,
  aprobar,
  rechazar,
  publicar,
  finalizar,
}

const EMPTY_FORM: PopupFormState = {
  tipo: 'anuncio',
  texto: '',
  imagen_url: '',
  video_url: '',
  enlace: '',
  paginas: '',
  monto_descuento: '',
  duracion_temporizador: '',
  texto_superior: '',
  fecha_inicio: '',
  fecha_fin: '',
}

function toFormState(popup: PopupBackend): PopupFormState {
  return {
    tipo: popup.tipo,
    texto: popup.texto,
    imagen_url: popup.imagen_url,
    video_url: popup.video_url ?? '',
    enlace: popup.enlace ?? '',
    paginas: popup.paginas,
    monto_descuento:
      popup.monto_descuento === null ? '' : String(popup.monto_descuento),
    duracion_temporizador:
      popup.duracion_temporizador === null ? '' : String(popup.duracion_temporizador),
    texto_superior: popup.texto_superior ?? '',
    fecha_inicio: popup.fecha_inicio.slice(0, 10),
    fecha_fin: popup.fecha_fin.slice(0, 10),
  }
}

function toPayload(form: PopupFormState): PopupCreate {
  const payload: PopupCreate = {
    tipo: form.tipo,
    texto: form.texto.trim(),
    imagen_url: form.imagen_url.trim(),
    paginas: form.paginas.trim(),
    fecha_inicio: form.fecha_inicio,
    fecha_fin: form.fecha_fin,
  }

  if (form.video_url.trim()) payload.video_url = form.video_url.trim()
  if (form.enlace.trim()) payload.enlace = form.enlace.trim()
  if (form.texto_superior.trim()) payload.texto_superior = form.texto_superior.trim()
  if (form.duracion_temporizador) {
    payload.duracion_temporizador = Number(form.duracion_temporizador)
  }
  if (form.tipo === 'descuento' && form.monto_descuento) {
    payload.monto_descuento = Number(form.monto_descuento)
  }

  return payload
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function truncateText(value: string, maximumLength = 80): string {
  return value.length > maximumLength ? `${value.slice(0, maximumLength).trimEnd()}…` : value
}

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

function StatusBadge({ estado }: { estado: PopupEstado }) {
  return <Badge variant={ESTADO_BADGE_VARIANTS[estado]}>{ESTADO_LABELS[estado]}</Badge>
}

export default function PopupsAdminPage() {
  const { user, logout } = useAuth()
  const [popups, setPopups] = useState<PopupBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [tipoFilter, setTipoFilter] = useState<PopupTipo | 'todos'>('todos')
  const [estadoFilter, setEstadoFilter] = useState<PopupEstado | 'todos'>('todos')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingPopup, setEditingPopup] = useState<PopupBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<PopupFormState>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [pendingWorkflow, setPendingWorkflow] = useState<PendingWorkflow | null>(null)
  const [workflowError, setWorkflowError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isMarketing = user?.rol === 'marketing'
  const isDirector = user?.rol === 'director_marketing'

  useEffect(() => {
    let isActive = true

    listarPopups({
      tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
      estado: estadoFilter === 'todos' ? undefined : estadoFilter,
    })
      .then((data) => {
        if (isActive) setPopups(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudo cargar la lista de popups.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [estadoFilter, logout, reloadKey, tipoFilter])

  const syncPopup = useCallback(
    (updated: PopupBackend) => {
      const matchesFilters =
        (tipoFilter === 'todos' || updated.tipo === tipoFilter) &&
        (estadoFilter === 'todos' || updated.estado === estadoFilter)

      setPopups((current) => {
        if (!matchesFilters) return current.filter((popup) => popup.id !== updated.id)

        const exists = current.some((popup) => popup.id === updated.id)
        return exists
          ? current.map((popup) => (popup.id === updated.id ? updated : popup))
          : [updated, ...current]
      })
    },
    [estadoFilter, tipoFilter],
  )

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingPopup(null)
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingPopup(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((popup: PopupBackend) => {
    setEditingPopup(popup)
    setForm(toFormState(popup))
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openWorkflowModal = useCallback((popup: PopupBackend, action: WorkflowAction) => {
    setPendingWorkflow({ popup, action })
    setWorkflowError('')
  }, [])

  const closeWorkflowModal = useCallback(() => {
    if (isTransitioning) return
    setPendingWorkflow(null)
    setWorkflowError('')
  }, [isTransitioning])

  const columns = useMemo<TableColumn<PopupBackend>[]>(() => {
    const baseColumns: TableColumn<PopupBackend>[] = [
      {
        key: 'tipo',
        header: 'Tipo',
        render: (popup) => TIPO_LABELS[popup.tipo],
      },
      {
        key: 'texto',
        header: 'Texto',
        render: (popup) => (
          <p className="min-w-64 max-w-sm" title={popup.texto}>
            {truncateText(popup.texto)}
          </p>
        ),
      },
      {
        key: 'vigencia',
        header: 'Vigencia',
        render: (popup) => (
          <span className="whitespace-nowrap">
            {formatDate(popup.fecha_inicio)} – {formatDate(popup.fecha_fin)}
          </span>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (popup) => <StatusBadge estado={popup.estado} />,
      },
    ]

    if (isMarketing || isDirector) {
      baseColumns.push({
        key: 'acciones',
        header: 'Acciones',
        render: (popup) => {
          const isOwn = popup.creado_por === user?.id
          const isEditable = popup.estado === 'borrador' || popup.estado === 'rechazado'

          if (isMarketing && isOwn && isEditable) {
            return (
              <div className="flex min-w-max flex-wrap items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEditModal(popup)}>
                  Editar
                </Button>
                <Button size="sm" onClick={() => openWorkflowModal(popup, 'enviar')}>
                  Enviar a aprobación
                </Button>
              </div>
            )
          }

          if (isDirector && popup.estado === 'pendiente') {
            return (
              <div className="flex min-w-max flex-wrap items-center gap-2">
                <Button size="sm" onClick={() => openWorkflowModal(popup, 'aprobar')}>
                  Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => openWorkflowModal(popup, 'rechazar')}
                >
                  Rechazar
                </Button>
              </div>
            )
          }

          if (isDirector && popup.estado === 'aprobado') {
            return (
              <Button size="sm" onClick={() => openWorkflowModal(popup, 'publicar')}>
                Publicar
              </Button>
            )
          }

          if (isDirector && popup.estado === 'publicado') {
            return (
              <Button
                size="sm"
                variant="danger"
                onClick={() => openWorkflowModal(popup, 'finalizar')}
              >
                Finalizar
              </Button>
            )
          }

          return <span className="text-xs text-slate-400">Sin acciones disponibles</span>
        },
      })
    }

    return baseColumns
  }, [isDirector, isMarketing, openEditModal, openWorkflowModal, user?.id])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setIsSaving(true)

    try {
      const payload = toPayload(form)
      const saved = editingPopup
        ? await actualizarPopup(editingPopup.id, payload)
        : await crearPopup(payload)

      syncPopup(saved)
      setFeedback(
        editingPopup
          ? 'El popup se actualizó correctamente.'
          : 'El popup se creó correctamente.',
      )
      setIsFormOpen(false)
      setEditingPopup(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setFormError(getErrorMessage(error, 'No se pudo guardar el popup.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleWorkflow = async () => {
    if (!pendingWorkflow) return
    setWorkflowError('')
    setFeedback('')
    setIsTransitioning(true)

    try {
      const updated = await WORKFLOW_HANDLERS[pendingWorkflow.action](pendingWorkflow.popup.id)
      syncPopup(updated)
      setFeedback(WORKFLOW_COPY[pendingWorkflow.action].success)
      setPendingWorkflow(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setWorkflowError(getErrorMessage(error, 'No se pudo actualizar el estado del popup.'))
    } finally {
      setIsTransitioning(false)
    }
  }

  const dateRangeWarning =
    form.fecha_inicio && form.fecha_fin && form.fecha_inicio > form.fecha_fin
      ? 'La fecha de inicio es posterior a la fecha de fin.'
      : ''
  const workflowCopy = pendingWorkflow ? WORKFLOW_COPY[pendingWorkflow.action] : null

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Popups</h1>
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => {
                setIsLoading(true)
                setLoadError('')
                setTipoFilter(event.target.value as PopupTipo | 'todos')
              }}
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los tipos</option>
              <option value="anuncio">Anuncio</option>
              <option value="descuento">Descuento</option>
            </Select>
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) => {
                setIsLoading(true)
                setLoadError('')
                setEstadoFilter(event.target.value as PopupEstado | 'todos')
              }}
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los estados</option>
              <option value="borrador">Borrador</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobado">Aprobado</option>
              <option value="rechazado">Rechazado</option>
              <option value="publicado">Publicado</option>
              <option value="finalizado">Finalizado</option>
            </Select>
          </div>
          {isMarketing && (
            <Button size="lg" onClick={openCreateModal}>
              Nuevo popup
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

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando popups...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">
              {loadError}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setIsLoading(true)
                setLoadError('')
                setReloadKey((current) => current + 1)
              }}
            >
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {popups.length} {popups.length === 1 ? 'popup' : 'popups'}
            </p>
            <Table
              columns={columns}
              data={popups}
              getRowKey={(popup) => popup.id}
              caption="Listado de popups administrativos"
              emptyMessage="No hay popups que coincidan con los filtros seleccionados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingPopup ? 'Editar popup' : 'Nuevo popup'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="popup-form" isLoading={isSaving}>
              {editingPopup ? 'Guardar cambios' : 'Crear popup'}
            </Button>
          </>
        }
      >
        <form id="popup-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
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
              setForm((current) => ({ ...current, tipo: event.target.value as PopupTipo }))
            }
            required
            disabled={isSaving}
          >
            <option value="anuncio">Anuncio</option>
            <option value="descuento">Descuento</option>
          </Select>
          <Input
            label="URL de imagen"
            value={form.imagen_url}
            onChange={(event) =>
              setForm((current) => ({ ...current, imagen_url: event.target.value }))
            }
            required
            disabled={isSaving}
          />
          <Textarea
            label="Texto"
            rows={4}
            value={form.texto}
            onChange={(event) =>
              setForm((current) => ({ ...current, texto: event.target.value }))
            }
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="URL de video"
            value={form.video_url}
            onChange={(event) =>
              setForm((current) => ({ ...current, video_url: event.target.value }))
            }
            disabled={isSaving}
          />
          <Input
            label="Enlace"
            value={form.enlace}
            onChange={(event) =>
              setForm((current) => ({ ...current, enlace: event.target.value }))
            }
            disabled={isSaving}
          />
          <Input
            label="Páginas"
            value={form.paginas}
            onChange={(event) =>
              setForm((current) => ({ ...current, paginas: event.target.value }))
            }
            hint="Indica las páginas donde se mostrará el popup."
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          {form.tipo === 'descuento' && (
            <Input
              label="Monto de descuento"
              type="number"
              min={0}
              step="0.01"
              value={form.monto_descuento}
              onChange={(event) =>
                setForm((current) => ({ ...current, monto_descuento: event.target.value }))
              }
              disabled={isSaving}
            />
          )}
          <Input
            label="Duración del temporizador"
            type="number"
            min={0}
            step={1}
            value={form.duracion_temporizador}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                duracion_temporizador: event.target.value,
              }))
            }
            hint="Duración en segundos."
            disabled={isSaving}
          />
          <Input
            label="Texto superior"
            value={form.texto_superior}
            onChange={(event) =>
              setForm((current) => ({ ...current, texto_superior: event.target.value }))
            }
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Fecha de inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(event) =>
              setForm((current) => ({ ...current, fecha_inicio: event.target.value }))
            }
            required
            disabled={isSaving}
          />
          <Input
            label="Fecha de fin"
            type="date"
            value={form.fecha_fin}
            onChange={(event) =>
              setForm((current) => ({ ...current, fecha_fin: event.target.value }))
            }
            required
            disabled={isSaving}
          />
          {dateRangeWarning && (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:col-span-2"
            >
              {dateRangeWarning}
            </p>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(pendingWorkflow)}
        onClose={closeWorkflowModal}
        title={workflowCopy?.title ?? 'Actualizar popup'}
        size="sm"
        closeOnBackdrop={!isTransitioning}
        footer={
          <>
            <Button variant="ghost" onClick={closeWorkflowModal} disabled={isTransitioning}>
              Cancelar
            </Button>
            <Button
              variant={pendingWorkflow?.action === 'rechazar' || pendingWorkflow?.action === 'finalizar' ? 'danger' : 'primary'}
              onClick={handleWorkflow}
              isLoading={isTransitioning}
            >
              {workflowCopy?.confirmLabel ?? 'Confirmar'}
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          {workflowCopy?.question}{' '}
          <strong>“{truncateText(pendingWorkflow?.popup.texto ?? '', 60)}”</strong>?
        </p>
        {workflowError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {workflowError}
          </div>
        )}
      </Modal>
    </main>
  )
}
