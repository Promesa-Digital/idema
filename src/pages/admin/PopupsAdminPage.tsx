import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import RowActions from '@/components/ui/RowActions'
import SearchSelect from '@/components/ui/SearchSelect'
import type { SearchSelectOption } from '@/components/ui/SearchSelect'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import Textarea from '@/components/ui/Textarea'
import ImageUploadField from '@/components/admin/ImageUploadField'
import { useAuth } from '@/context/AuthContextType'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { listarConceptos } from '@/services/conceptosApi'
import { listarProgramasPublicos } from '@/services/programasApi'
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
import {
  ESTADO_POPUP_LABELS as ESTADO_LABELS,
  ESTADO_POPUP_SIGUIENTE,
  TIPO_POPUP_LABELS as TIPO_LABELS,
  validarPopup,
} from '@/utils/popup'
import { estadoVigencia, formatFecha as formatDate } from '@/utils/vigencia'
import type { CampoPopup, ErroresPopup } from '@/utils/popup'
import { descargarCSV } from '@/utils/csv'
import type {
  PopupBackend,
  ConceptoCobroBackend,
  ProgramaBackend,
  PopupCreate,
  PopupEstado,
  PopupTipo,
} from '@/types/backend'

interface PopupFormState {
  tipo: PopupTipo
  texto: string
  imagen_url: string
  video_url: string
  enlace: string
  paginas: string
  concepto_cobro_id: string
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

const ESTADO_BADGE_VARIANTS = {
  borrador: 'slate',
  pendiente: 'amber',
  aprobado: 'sky',
  rechazado: 'red',
  publicado: 'emerald',
  finalizado: 'violet',
} as const

const WORKFLOW_COPY: Record<
  WorkflowAction,
  {
    /** Texto corto para el menú de la fila. */
    menuLabel: string
    confirmLabel: string
    title: string
    question: string
    success: string
  }
> = {
  enviar: {
    menuLabel: 'Enviar a aprobación',
    confirmLabel: 'Sí, enviar',
    title: 'Enviar popup a aprobación',
    question: '¿Confirmas que deseas enviar a revisión el popup',
    success: 'El popup fue enviado a aprobación.',
  },
  aprobar: {
    menuLabel: 'Aprobar',
    confirmLabel: 'Sí, aprobar',
    title: 'Aprobar popup',
    question: '¿Confirmas que deseas aprobar el popup',
    success: 'El popup fue aprobado.',
  },
  rechazar: {
    menuLabel: 'Rechazar',
    confirmLabel: 'Sí, rechazar',
    title: 'Rechazar popup',
    question: '¿Confirmas que deseas rechazar el popup',
    success: 'El popup fue rechazado.',
  },
  publicar: {
    menuLabel: 'Publicar',
    confirmLabel: 'Sí, publicar',
    title: 'Publicar popup',
    question: '¿Confirmas que deseas publicar el popup',
    success: 'El popup fue publicado.',
  },
  finalizar: {
    menuLabel: 'Finalizar',
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
  paginas: '/',
  concepto_cobro_id: '',
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
    concepto_cobro_id: popup.concepto_cobro_id ?? '',
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
    video_url: form.tipo === 'anuncio' ? form.video_url.trim() || null : null,
    enlace: form.enlace.trim() || null,
    paginas: form.paginas.trim(),
    concepto_cobro_id: form.tipo === 'descuento' ? form.concepto_cobro_id : null,
    duracion_temporizador: form.tipo === 'descuento' ? 600 : null,
    texto_superior: form.tipo === 'descuento' ? form.texto_superior.trim() : null,
    fecha_inicio: form.fecha_inicio,
    fecha_fin: form.fecha_fin,
  }

  return payload
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function truncateText(value: string, maximumLength = 80): string {
  return value.length > maximumLength ? `${value.slice(0, maximumLength).trimEnd()}…` : value
}

function StatusBadge({ estado }: { estado: PopupEstado }) {
  return <Badge variant={ESTADO_BADGE_VARIANTS[estado]}>{ESTADO_LABELS[estado]}</Badge>
}

export default function PopupsAdminPage() {
  const { user, logout } = useAuth()
  const [popups, setPopups] = useState<PopupBackend[]>([])
  const [conceptos, setConceptos] = useState<ConceptoCobroBackend[]>([])
  const [carreras, setCarreras] = useState<ProgramaBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tipoFilter, setTipoFilter] = useState<PopupTipo | 'todos'>('todos')
  const [estadoFilter, setEstadoFilter] = useState<PopupEstado | 'todos'>('todos')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingPopup, setEditingPopup] = useState<PopupBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<PopupFormState>({ ...EMPTY_FORM })
  const [errores, setErrores] = useState<ErroresPopup>({})
  const [formError, setFormError] = useState('')
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  /** Foto del formulario al abrirlo, para saber si hay cambios sin guardar. */
  const formInicial = useRef<PopupFormState>({ ...EMPTY_FORM })
  const [pendingWorkflow, setPendingWorkflow] = useState<PendingWorkflow | null>(null)
  const [workflowError, setWorkflowError] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const isCreator = user?.rol === 'marketing' || user?.rol === 'ventas' || user?.rol === 'admin_sistema'
  const isApprover = user?.rol === 'director_marketing' || user?.rol === 'admin_sistema'
  const isAdmin = user?.rol === 'admin_sistema'
  const { addToast } = useToast()

  useEffect(() => {
    if (!isCreator) return
    let isActive = true
    Promise.all([listarConceptos({ estado: 'activo' }), listarProgramasPublicos()])
      .then(([conceptosActivos, programasPublicos]) => {
        if (!isActive) return
        setConceptos(conceptosActivos)
        setCarreras(programasPublicos.filter((programa) => programa.tipo === 'carrera'))
      })
      .catch(() => {
        if (isActive) {
          setConceptos([])
          setCarreras([])
        }
      })
    return () => {
      isActive = false
    }
  }, [isCreator])

  const carrerasById = useMemo(
    () => new Map(carreras.map((carrera) => [carrera.id, carrera])),
    [carreras],
  )
  const conceptosCarrera = useMemo(
    () => conceptos.filter((concepto) => concepto.programa_id && carrerasById.has(concepto.programa_id)),
    [carrerasById, conceptos],
  )

  useEffect(() => {
    let isActive = true

    // Se traen todos y se filtra en el navegador: cambiar de filtro vaciaba la tabla con
    // un "Cargando..." en cada pulsación.
    listarPopups()
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
  }, [logout, reloadKey])

  const syncPopup = useCallback((updated: PopupBackend) => {
    setPopups((current) => {
      const existe = current.some((popup) => popup.id === updated.id)
      return existe
        ? current.map((popup) => (popup.id === updated.id ? updated : popup))
        : [updated, ...current]
    })
  }, [])

  const popupsFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return popups.filter((popup) => {
      if (tipoFilter !== 'todos' && popup.tipo !== tipoFilter) return false
      if (estadoFilter !== 'todos' && popup.estado !== estadoFilter) return false
      if (!termino) return true
      return [popup.texto, popup.texto_superior ?? '', popup.paginas, popup.enlace ?? '']
        .join(' ')
        .toLowerCase()
        .includes(termino)
    })
  }, [busqueda, estadoFilter, popups, tipoFilter])

  const resumen = useMemo(() => {
    const publicados = popups.filter((popup) => popup.estado === 'publicado')
    return {
      total: popups.length,
      pendientes: popups.filter((popup) => popup.estado === 'pendiente').length,
      publicados: publicados.length,
      // Un popup publicado fuera de sus fechas no se ve, pero sigue diciendo "Publicado":
      // sin esta cuenta, nadie se entera de que la campaña dejó de mostrarse.
      vencidos: publicados.filter(
        (popup) => estadoVigencia(popup.fecha_inicio, popup.fecha_fin) === 'vencido',
      ).length,
    }
  }, [popups])

  const hayFiltrosActivos = Boolean(busqueda) || tipoFilter !== 'todos' || estadoFilter !== 'todos'

  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setTipoFilter('todos')
    setEstadoFilter('todos')
  }, [])

  const opcionesConcepto = useMemo<SearchSelectOption[]>(
    () =>
      conceptosCarrera.map((concepto) => {
        const carrera = carrerasById.get(concepto.programa_id ?? '')
        return {
          value: concepto.id,
          label: carrera?.nombre ?? 'Sin carrera',
          hint: `S/ ${Number(concepto.monto).toFixed(2)}`,
          group: concepto.descripcion || concepto.tipo,
        }
      }),
    [carrerasById, conceptosCarrera],
  )

  const exportar = useCallback(() => {
    descargarCSV(
      `popups-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Tipo', 'Texto', 'Páginas', 'Enlace', 'Desde', 'Hasta', 'Estado'],
      popupsFiltrados.map((popup) => [
        TIPO_LABELS[popup.tipo],
        popup.texto,
        popup.paginas,
        popup.enlace ?? '',
        formatDate(popup.fecha_inicio),
        formatDate(popup.fecha_fin),
        ESTADO_LABELS[popup.estado],
      ]),
    )
  }, [popupsFiltrados])

  /** Quita el rojo de los campos indicados en cuanto el usuario los corrige. */
  const limpiarError = useCallback((...campos: CampoPopup[]) => {
    setErrores((actuales) => {
      const siguiente = { ...actuales }
      for (const campo of campos) delete siguiente[campo]
      return siguiente
    })
  }, [])

  const cerrarFormulario = useCallback(() => {
    setIsFormOpen(false)
    setEditingPopup(null)
    setErrores({})
    setFormError('')
    setConfirmandoDescarte(false)
  }, [])

  /**
   * Cierra avisando si hay cambios. Se compara contra el estado con el que se abrió y no
   * contra un formulario vacío: al editar, "sin cambios" significa igual al original.
   */
  const closeFormModal = useCallback(() => {
    if (isSaving) return
    if (JSON.stringify(form) !== JSON.stringify(formInicial.current)) {
      setConfirmandoDescarte(true)
      return
    }
    cerrarFormulario()
  }, [cerrarFormulario, form, isSaving])

  const abrirFormulario = useCallback((estado: PopupFormState) => {
    setForm(estado)
    formInicial.current = estado
    setErrores({})
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingPopup(null)
    abrirFormulario({ ...EMPTY_FORM })
  }, [abrirFormulario])

  const openEditModal = useCallback(
    (popup: PopupBackend) => {
      setEditingPopup(popup)
      abrirFormulario(toFormState(popup))
    },
    [abrirFormulario],
  )

  const openWorkflowModal = useCallback((popup: PopupBackend, action: WorkflowAction) => {
    setPendingWorkflow({ popup, action })
    setWorkflowError('')
  }, [])

  const closeWorkflowModal = useCallback(() => {
    if (isTransitioning) return
    setPendingWorkflow(null)
    setWorkflowError('')
  }, [isTransitioning])

  /**
   * Las transiciones que este usuario puede hacer sobre este popup.
   *
   * Antes cada rama devolvía sus propios botones y el resto de filas mostraban el texto
   * "Sin acciones disponibles", que para la mayoría de roles era casi toda la tabla.
   */
  const accionesDe = useCallback(
    (popup: PopupBackend): WorkflowAction[] => {
      const esSuyo = popup.creado_por === user?.id
      const editable = popup.estado === 'borrador' || popup.estado === 'rechazado'

      if (isCreator && (esSuyo || isAdmin) && editable) return ['enviar']
      if (isApprover && popup.estado === 'pendiente') return ['aprobar', 'rechazar']
      if (isApprover && popup.estado === 'aprobado') return ['publicar']
      if (isApprover && popup.estado === 'publicado') return ['finalizar']
      return []
    },
    [isAdmin, isApprover, isCreator, user?.id],
  )

  const puedeEditar = useCallback(
    (popup: PopupBackend) =>
      isCreator &&
      (popup.creado_por === user?.id || isAdmin) &&
      (popup.estado === 'borrador' || popup.estado === 'rechazado'),
    [isAdmin, isCreator, user?.id],
  )

  const columns = useMemo<TableColumn<PopupBackend>[]>(() => {
    const baseColumns: TableColumn<PopupBackend>[] = [
      {
        key: 'tipo',
        header: 'Tipo',
        sortValue: (popup) => TIPO_LABELS[popup.tipo],
        render: (popup) => TIPO_LABELS[popup.tipo],
      },
      {
        key: 'texto',
        header: 'Texto',
        sortValue: (popup) => popup.texto,
        render: (popup) => (
          <div className="min-w-64 max-w-sm">
            <p title={popup.texto}>{truncateText(popup.texto)}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{popup.paginas}</p>
          </div>
        ),
      },
      {
        key: 'vigencia',
        header: 'Vigencia',
        sortValue: (popup) => popup.fecha_inicio,
        render: (popup) => {
          const vigencia = estadoVigencia(popup.fecha_inicio, popup.fecha_fin)
          return (
            <div className="whitespace-nowrap">
              <p>
                {formatDate(popup.fecha_inicio)} – {formatDate(popup.fecha_fin)}
              </p>
              {popup.estado === 'publicado' && vigencia !== 'vigente' && (
                // Publicado pero fuera de fechas: el estado dice que sí y la web dice que no.
                <p className="mt-0.5 text-xs font-semibold text-amber-700">
                  {vigencia === 'vencido' ? 'Fuera de fecha: no se muestra' : 'Aún no empieza'}
                </p>
              )}
            </div>
          )
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        sortValue: (popup) => ESTADO_LABELS[popup.estado],
        render: (popup) => (
          <div className="min-w-44">
            <StatusBadge estado={popup.estado} />
            <p className="mt-1 text-xs text-slate-500">{ESTADO_POPUP_SIGUIENTE[popup.estado]}</p>
          </div>
        ),
      },
    ]

    if (isCreator || isApprover) {
      baseColumns.push({
        key: 'acciones',
        header: '',
        headerClassName: 'w-12',
        render: (popup) => {
          const acciones = [
            ...(puedeEditar(popup)
              ? [{ etiqueta: 'Editar', onSelect: () => openEditModal(popup) }]
              : []),
            ...accionesDe(popup).map((accion) => ({
              etiqueta: WORKFLOW_COPY[accion].menuLabel,
              onSelect: () => openWorkflowModal(popup, accion),
              destructiva: accion === 'rechazar' || accion === 'finalizar',
            })),
          ]
          return (
            <RowActions
              acciones={acciones}
              etiquetaAccesible={`Acciones del popup ${truncateText(popup.texto, 40)}`}
            />
          )
        },
      })
    }

    return baseColumns
  }, [accionesDe, isApprover, isCreator, openEditModal, openWorkflowModal, puedeEditar])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const nuevosErrores = validarPopup(form)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setIsSaving(true)

    try {
      const payload = toPayload(form)
      const saved = editingPopup
        ? await actualizarPopup(editingPopup.id, payload)
        : await crearPopup(payload)

      syncPopup(saved)
      addToast(
        'success',
        editingPopup ? 'Popup actualizado' : 'Popup creado',
        `${TIPO_LABELS[saved.tipo]} · ${ESTADO_POPUP_SIGUIENTE[saved.estado]}`,
      )
      cerrarFormulario()
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
    setIsTransitioning(true)

    try {
      const updated = await WORKFLOW_HANDLERS[pendingWorkflow.action](pendingWorkflow.popup.id)
      syncPopup(updated)
      addToast(
        pendingWorkflow.action === 'rechazar' ? 'info' : 'success',
        WORKFLOW_COPY[pendingWorkflow.action].title,
        `${WORKFLOW_COPY[pendingWorkflow.action].success} ${ESTADO_POPUP_SIGUIENTE[updated.estado]}`,
      )
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

  const workflowCopy = pendingWorkflow ? WORKFLOW_COPY[pendingWorkflow.action] : null

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isLoading && !loadError && (
          <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { etiqueta: 'Total', valor: resumen.total, destacado: true },
              {
                etiqueta: 'Esperando aprobación',
                valor: resumen.pendientes,
                alerta: resumen.pendientes > 0,
              },
              { etiqueta: 'Publicados', valor: resumen.publicados },
              {
                etiqueta: 'Publicados fuera de fecha',
                valor: resumen.vencidos,
                alerta: resumen.vencidos > 0,
              },
            ].map((dato) => (
              <div
                key={dato.etiqueta}
                className={`rounded-xl border bg-white px-4 py-3 ${
                  dato.alerta ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'
                }`}
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {dato.etiqueta}
                </dt>
                <dd
                  className={`mt-1 text-2xl font-bold ${
                    dato.alerta ? 'text-amber-700' : dato.destacado ? 'text-primary' : 'text-dark'
                  }`}
                >
                  {dato.valor}
                </dd>
              </div>
            ))}
          </dl>
        )}

        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-3 lg:max-w-3xl">
            <Input
              label="Buscar"
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Texto, página o enlace"
            />
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => setTipoFilter(event.target.value as PopupTipo | 'todos')}
            >
              <option value="todos">Todos los tipos</option>
              <option value="anuncio">Anuncio</option>
              <option value="descuento">Descuento</option>
            </Select>
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) => setEstadoFilter(event.target.value as PopupEstado | 'todos')}
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={exportar}
              disabled={popupsFiltrados.length === 0}
            >
              Exportar CSV
            </Button>
            {isCreator && <Button onClick={openCreateModal}>Nuevo popup</Button>}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-3 text-slate-600">Cargando popups…</p>
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
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <p>
                {hayFiltrosActivos
                  ? `${popupsFiltrados.length} de ${popups.length} popups`
                  : `${popups.length} ${popups.length === 1 ? 'popup' : 'popups'}`}
              </p>
              {hayFiltrosActivos && (
                <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
                  Quitar filtros
                </Button>
              )}
            </div>
            <Table
              columns={columns}
              data={popupsFiltrados}
              getRowKey={(popup) => popup.id}
              caption="Listado de popups administrativos"
              emptyMessage={
                hayFiltrosActivos
                  ? 'Ningún popup coincide con los filtros.'
                  : 'Todavía no hay popups.'
              }
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
        {/* noValidate: si valida el navegador, salta su globo nativo antes que nuestros
            mensajes por campo y estos no llegan a verse nunca. */}
        <form
          id="popup-form"
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
            onChange={(event) => {
              const tipo = event.target.value as PopupTipo
              setForm((current) => ({
                ...current,
                tipo,
                paginas: tipo === 'anuncio' ? '/' : '',
                video_url: tipo === 'descuento' ? '' : current.video_url,
                concepto_cobro_id: tipo === 'anuncio' ? '' : current.concepto_cobro_id,
                duracion_temporizador: tipo === 'descuento' ? '600' : '',
                texto_superior: tipo === 'anuncio' ? '' : current.texto_superior,
              }))
            }}
            required
            disabled={isSaving}
          >
            <option value="anuncio">Anuncio</option>
            <option value="descuento">Descuento</option>
          </Select>
          <ImageUploadField
            label="Imagen"
            value={form.imagen_url}
            onChange={(value) => {
              setForm((current) => ({ ...current, imagen_url: value }))
              limpiarError('imagen_url')
            }}
            error={errores.imagen_url}
            required
            disabled={isSaving}
          />
          <Textarea
            label="Texto"
            rows={4}
            value={form.texto}
            onChange={(event) => {
              setForm((current) => ({ ...current, texto: event.target.value }))
              limpiarError('texto')
            }}
            error={errores.texto}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          {form.tipo === 'anuncio' && (
            <Input
              label="URL de video (opcional)"
              value={form.video_url}
              onChange={(event) => {
                setForm((current) => ({ ...current, video_url: event.target.value }))
                limpiarError('video_url')
              }}
              error={errores.video_url}
              placeholder="https://..."
              disabled={isSaving}
            />
          )}
          <Input
            label="Enlace"
            value={form.enlace}
            onChange={(event) => {
              setForm((current) => ({ ...current, enlace: event.target.value }))
              limpiarError('enlace')
            }}
            error={errores.enlace}
            placeholder="https://… o /ruta-interna"
            disabled={isSaving}
          />
          <Input
            label="Páginas"
            value={form.paginas}
            onChange={(event) =>
              setForm((current) => ({ ...current, paginas: event.target.value }))
            }
            hint={form.tipo === 'anuncio' ? 'Los anuncios se muestran únicamente en la página principal.' : 'Se completa automáticamente según la carrera del concepto EDU-09.'}
            required
            disabled
            containerClassName="sm:col-span-2"
          />
          {form.tipo === 'descuento' && (
            <SearchSelect
              label="Concepto de cobro (EDU-09)"
              value={form.concepto_cobro_id}
              onChange={(conceptoId) => {
                const concepto = conceptosCarrera.find((item) => item.id === conceptoId)
                const carrera = concepto?.programa_id
                  ? carrerasById.get(concepto.programa_id)
                  : undefined
                setForm((current) => ({
                  ...current,
                  concepto_cobro_id: conceptoId,
                  // La página donde se muestra el popup sale de la carrera del concepto:
                  // el campo "Páginas" está deshabilitado precisamente por esto.
                  paginas: carrera ? `/programas-de-estudio/${carrera.slug}` : '',
                }))
                limpiarError('concepto_cobro_id')
              }}
              options={opcionesConcepto}
              error={errores.concepto_cobro_id}
              required
              disabled={isSaving}
              placeholder="Busca la carrera…"
              emptyMessage="No hay conceptos activos de carreras."
              hint="Escribe el nombre de la carrera. Define también en qué página se muestra."
            />
          )}
          {form.tipo === 'descuento' && (
            <>
              <Input
                label="Temporizador"
                value="10 minutos"
                hint="Duración definida por el requisito EDU-02."
                disabled
              />
              <Input
                label="Texto superior"
                value={form.texto_superior}
                onChange={(event) =>
                  setForm((current) => ({ ...current, texto_superior: event.target.value }))
                }
                required
                disabled={isSaving}
                containerClassName="sm:col-span-2"
              />
            </>
          )}
          <Input
            label="Fecha de inicio"
            type="date"
            value={form.fecha_inicio}
            onChange={(event) => {
              setForm((current) => ({ ...current, fecha_inicio: event.target.value }))
              limpiarError('fecha_inicio', 'fecha_fin')
            }}
            error={errores.fecha_inicio}
            required
            disabled={isSaving}
          />
          <Input
            label="Fecha de fin"
            type="date"
            value={form.fecha_fin}
            onChange={(event) => {
              setForm((current) => ({ ...current, fecha_fin: event.target.value }))
              limpiarError('fecha_fin')
            }}
            error={errores.fecha_fin}
            required
            disabled={isSaving}
          />
        </form>
      </Modal>

      <Modal
        isOpen={confirmandoDescarte}
        onClose={() => setConfirmandoDescarte(false)}
        title="Cambios sin guardar"
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmandoDescarte(false)}>
              Seguir editando
            </Button>
            <Button variant="danger" onClick={cerrarFormulario}>
              Descartar cambios
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          Hiciste cambios que todavía no se han guardado. Si cierras ahora se perderán.
        </p>
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
