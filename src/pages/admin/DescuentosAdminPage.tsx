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
import { useAuth } from '@/context/AuthContextType'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import { listarCombosAdmin, listarCombosPublicos } from '@/services/combosApi'
import { listarConceptos } from '@/services/conceptosApi'
import { listarProgramasPublicos } from '@/services/programasApi'
import {
  activarDescuento,
  actualizarDescuento,
  consultarDescuentoVigente,
  crearDescuento,
  eliminarDescuento,
  listarDescuentos,
} from '@/services/descuentosApi'
import { TIPO_CONCEPTO_LABELS, formatMonto } from '@/utils/conceptoCobro'
import { descargarCSV } from '@/utils/csv'
import {
  ESTADO_DESCUENTO_LABELS as ESTADO_LABELS,
  PORCENTAJE_MAXIMO,
  PORCENTAJE_MINIMO,
  TIPO_DESCUENTO_LABELS as TIPO_LABELS,
  buscarActivoDelConcepto,
  etiquetaConcepto,
  montoConDescuento,
  validarDescuento,
} from '@/utils/descuento'
import type { CampoDescuento, ErroresDescuento } from '@/utils/descuento'
import type {
  ComboBackend,
  ConceptoCobroBackend,
  DescuentoBackend,
  DescuentoCreate,
  DescuentoEstado,
  DescuentoTipo,
  ProgramaBackend,
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

export default function DescuentosAdminPage() {
  const { user, logout } = useAuth()
  const [descuentos, setDescuentos] = useState<DescuentoBackend[]>([])
  const [conceptos, setConceptos] = useState<ConceptoCobroBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [combos, setCombos] = useState<ComboBackend[]>([])
  const [estadoFilter, setEstadoFilter] = useState<DescuentoEstado | ''>('')
  const [tipoFilter, setTipoFilter] = useState<DescuentoTipo | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingDescuento, setEditingDescuento] = useState<DescuentoBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<DescuentoFormState>({ ...EMPTY_FORM })
  const [errores, setErrores] = useState<ErroresDescuento>({})
  const [formError, setFormError] = useState('')
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  /** Foto del formulario al abrirlo, para saber si hay cambios sin guardar. */
  const formInicial = useRef<DescuentoFormState>({ ...EMPTY_FORM })
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
  const { addToast } = useToast()

  useEffect(() => {
    let isActive = true

    // Programas y combos solo sirven para poner nombre al concepto. Si el rol no puede
    // ver los listados completos se cae al público en vez de tumbar la página con un 403.
    const cargarProgramas = () => listarProgramasPublicos().catch(() => [] as ProgramaBackend[])
    const cargarCombos = () =>
      listarCombosAdmin().catch(() => listarCombosPublicos().catch(() => [] as ComboBackend[]))

    // Los filtros se aplican en el navegador: cambiarlos vaciaba la tabla con un
    // "Cargando..." en cada pulsación.
    Promise.all([listarDescuentos(), listarConceptos(), cargarProgramas(), cargarCombos()])
      .then(([descuentoData, conceptoData, programaData, comboData]) => {
        if (!isActive) return
        setDescuentos(descuentoData)
        setConceptos(conceptoData)
        setProgramas(programaData)
        setCombos(comboData)
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
  }, [logout, reloadKey])

  const syncDescuento = useCallback((updated: DescuentoBackend) => {
    setDescuentos((current) => {
      const existe = current.some((descuento) => descuento.id === updated.id)
      return existe
        ? current.map((descuento) => (descuento.id === updated.id ? updated : descuento))
        : [updated, ...current]
    })
  }, [])

  /** El nombre del destino de cada concepto: programa o combo. */
  const nombreDestino = useMemo(() => {
    const porId = new Map<string, string>()
    for (const programa of programas) porId.set(programa.id, programa.nombre)
    for (const combo of combos) porId.set(combo.id, combo.nombre)
    return porId
  }, [combos, programas])

  const conceptosPorId = useMemo(
    () => new Map(conceptos.map((concepto) => [concepto.id, concepto])),
    [conceptos],
  )

  const etiquetaDe = useCallback(
    (conceptoId: string) => {
      const concepto = conceptosPorId.get(conceptoId)
      if (!concepto) return 'Concepto no encontrado'
      const destinoId = concepto.programa_id ?? concepto.combo_id ?? ''
      return etiquetaConcepto(concepto, nombreDestino.get(destinoId))
    },
    [conceptosPorId, nombreDestino],
  )

  const opcionesConcepto = useMemo<SearchSelectOption[]>(
    () =>
      conceptos
        .map((concepto) => {
          const destinoId = concepto.programa_id ?? concepto.combo_id ?? ''
          return {
            value: concepto.id,
            label: nombreDestino.get(destinoId) ?? 'Sin destino',
            hint: formatMonto(concepto.monto),
            group: TIPO_CONCEPTO_LABELS[concepto.tipo],
          }
        })
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [conceptos, nombreDestino],
  )

  const descuentosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return descuentos.filter((descuento) => {
      if (estadoFilter && descuento.estado !== estadoFilter) return false
      if (tipoFilter && descuento.tipo !== tipoFilter) return false
      if (!termino) return true
      // El concepto entra en la búsqueda: se busca "enfermería", no "manual".
      return [
        TIPO_LABELS[descuento.tipo],
        descuento.porcentaje,
        descuento.descripcion ?? '',
        etiquetaDe(descuento.concepto_id),
      ]
        .join(' ')
        .toLowerCase()
        .includes(termino)
    })
  }, [busqueda, descuentos, estadoFilter, etiquetaDe, tipoFilter])

  const resumen = useMemo(() => {
    const activos = descuentos.filter((descuento) => descuento.estado === 'activo')
    // Dos activos sobre el mismo concepto: el backend resuelve el empate por el más
    // reciente, o sea al azar para quien cobra. Conviene verlo aquí.
    const porConcepto = new Map<string, number>()
    for (const descuento of activos) {
      porConcepto.set(descuento.concepto_id, (porConcepto.get(descuento.concepto_id) ?? 0) + 1)
    }
    return {
      total: descuentos.length,
      activos: activos.length,
      inactivos: descuentos.length - activos.length,
      enConflicto: [...porConcepto.values()].filter((cuenta) => cuenta > 1).length,
    }
  }, [descuentos])

  const hayFiltrosActivos = Boolean(busqueda) || Boolean(estadoFilter) || Boolean(tipoFilter)

  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setEstadoFilter('')
    setTipoFilter('')
  }, [])

  const exportar = useCallback(() => {
    descargarCSV(
      `descuentos-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Tipo', 'Porcentaje', 'Aplica a', 'Descripción', 'Estado'],
      descuentosFiltrados.map((descuento) => [
        TIPO_LABELS[descuento.tipo],
        `${descuento.porcentaje}%`,
        etiquetaDe(descuento.concepto_id),
        descuento.descripcion ?? '',
        ESTADO_LABELS[descuento.estado],
      ]),
    )
  }, [descuentosFiltrados, etiquetaDe])

  /** Quita el rojo de los campos indicados en cuanto el usuario los corrige. */
  const limpiarError = useCallback((...campos: CampoDescuento[]) => {
    setErrores((actuales) => {
      const siguiente = { ...actuales }
      for (const campo of campos) delete siguiente[campo]
      return siguiente
    })
  }, [])

  const invalidateConsulta = useCallback(() => {
    setDescuentoVigente(null)
    setHasConsulted(false)
    setConsultaError('')
  }, [])

  const cerrarFormulario = useCallback(() => {
    setIsFormOpen(false)
    setEditingDescuento(null)
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

  const abrirFormulario = useCallback((estado: DescuentoFormState) => {
    setForm(estado)
    formInicial.current = estado
    setErrores({})
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingDescuento(null)
    abrirFormulario({ ...EMPTY_FORM })
  }, [abrirFormulario])

  const openEditModal = useCallback(
    (descuento: DescuentoBackend) => {
      setEditingDescuento(descuento)
      abrirFormulario(toFormState(descuento))
    },
    [abrirFormulario],
  )

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
      // Reactivar puede crear el mismo choque que crear: dos activos sobre un concepto.
      const choque = buscarActivoDelConcepto(descuentos, descuento.concepto_id, descuento.id)
      if (choque) {
        addToast(
          'error',
          'Ya hay un descuento activo',
          `${etiquetaDe(descuento.concepto_id)} tiene el ${choque.porcentaje}% activo. Desactívalo antes de reactivar este.`,
        )
        return
      }

      setActivatingDescuentoId(descuento.id)

      try {
        const activated = await activarDescuento(descuento.id)
        syncDescuento(activated)
        invalidateConsulta()
        addToast(
          'success',
          'Descuento reactivado',
          `${activated.porcentaje}% · ${etiquetaDe(activated.concepto_id)}`,
        )
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        addToast(
          'error',
          'No se pudo reactivar',
          getErrorMessage(error, 'Inténtalo de nuevo en un momento.'),
        )
      } finally {
        setActivatingDescuentoId(null)
      }
    },
    [addToast, descuentos, etiquetaDe, invalidateConsulta, logout, syncDescuento],
  )

  const columns = useMemo<TableColumn<DescuentoBackend>[]>(() => {
    const baseColumns: TableColumn<DescuentoBackend>[] = [
      {
        key: 'porcentaje',
        header: 'Descuento',
        // Por número: como texto, 9% iría después de 30%.
        sortValue: (descuento) => Number(descuento.porcentaje),
        render: (descuento) => (
          <span className="whitespace-nowrap font-semibold text-dark tabular-nums">
            {descuento.porcentaje}%
          </span>
        ),
      },
      {
        // La columna que faltaba: sin ella no se podía saber a qué se aplicaba cada
        // descuento, y todos los de un mismo tipo y porcentaje eran indistinguibles.
        key: 'concepto',
        header: 'Aplica a',
        sortValue: (descuento) => etiquetaDe(descuento.concepto_id),
        render: (descuento) => {
          const concepto = conceptosPorId.get(descuento.concepto_id)
          const otroActivo =
            descuento.estado === 'activo' &&
            Boolean(buscarActivoDelConcepto(descuentos, descuento.concepto_id, descuento.id))
          return (
            <div className="min-w-56">
              <p className="truncate font-semibold text-dark">
                {etiquetaDe(descuento.concepto_id)}
              </p>
              {concepto && (
                <p className="text-xs text-slate-500">
                  Queda en {montoConDescuento(concepto.monto, descuento.porcentaje)}
                </p>
              )}
              {otroActivo && (
                <p className="mt-0.5 text-xs font-semibold text-amber-700">
                  Hay otro descuento activo sobre este concepto
                </p>
              )}
            </div>
          )
        },
      },
      {
        key: 'tipo',
        header: 'Tipo',
        sortValue: (descuento) => TIPO_LABELS[descuento.tipo],
        render: (descuento) => TIPO_LABELS[descuento.tipo],
      },
      {
        key: 'descripcion',
        header: 'Descripción',
        sortValue: (descuento) => descuento.descripcion,
        render: (descuento) => descuento.descripcion || '—',
      },
      {
        key: 'estado',
        header: 'Estado',
        sortValue: (descuento) => ESTADO_LABELS[descuento.estado],
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
        header: '',
        headerClassName: 'w-12',
        render: (descuento) => (
          <RowActions
            etiquetaAccesible={`Acciones del descuento del ${descuento.porcentaje}%`}
            acciones={[
              { etiqueta: 'Editar', onSelect: () => openEditModal(descuento) },
              descuento.estado === 'activo'
                ? {
                    // Se llamaba "Eliminar", pero el endpoint da de baja y el registro
                    // sigue ahí: el nombre prometía un borrado que nunca ocurría.
                    etiqueta: 'Desactivar',
                    onSelect: () => openDeleteModal(descuento),
                    destructiva: true,
                  }
                : {
                    etiqueta: 'Reactivar',
                    onSelect: () => void handleActivate(descuento),
                    disabled: activatingDescuentoId === descuento.id,
                  },
            ]}
          />
        ),
      })
    }

    return baseColumns
  }, [
    activatingDescuentoId,
    canManage,
    conceptosPorId,
    descuentos,
    etiquetaDe,
    handleActivate,
    openDeleteModal,
    openEditModal,
  ])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const nuevosErrores = validarDescuento(
      form,
      descuentos,
      editingDescuento?.id,
      editingDescuento?.estado ?? 'activo',
    )
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const porcentaje = Number(form.porcentaje)
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
      addToast(
        'success',
        editingDescuento ? 'Descuento actualizado' : 'Descuento creado',
        `${saved.porcentaje}% · ${etiquetaDe(saved.concepto_id)}`,
      )
      cerrarFormulario()
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
    setIsDeleting(true)

    try {
      const deleted = await eliminarDescuento(descuentoToDelete.id)
      syncDescuento(deleted)
      invalidateConsulta()
      addToast(
        'success',
        'Descuento desactivado',
        `${deleted.porcentaje}% · ${etiquetaDe(deleted.concepto_id)}. Puedes reactivarlo cuando quieras.`,
      )
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

  const conceptoConsultado = conceptosPorId.get(consultaConceptoId)

  /** "S/ 350.00 -> S/ 315.00": ver el precio final evita descuentos puestos a ciegas. */
  const vistaPreviaMonto = (() => {
    const concepto = conceptosPorId.get(form.concepto_id)
    if (!concepto || !form.porcentaje.trim()) return ''
    const final = montoConDescuento(concepto.monto, form.porcentaje)
    return `${formatMonto(concepto.monto)} → ${final}`
  })()

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isLoading && !loadError && (
          <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { etiqueta: 'Total', valor: resumen.total, destacado: true },
              { etiqueta: 'Activos', valor: resumen.activos },
              { etiqueta: 'Inactivos', valor: resumen.inactivos },
              {
                etiqueta: 'Conceptos en conflicto',
                valor: resumen.enConflicto,
                alerta: resumen.enConflicto > 0,
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
              placeholder="Programa, concepto o porcentaje"
            />
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => setTipoFilter(event.target.value as DescuentoTipo | '')}
            >
              <option value="">Todos los tipos</option>
              <option value="manual">Manual</option>
              <option value="pronto_pago">Pronto pago</option>
            </Select>
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) => setEstadoFilter(event.target.value as DescuentoEstado | '')}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </Select>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              onClick={exportar}
              disabled={descuentosFiltrados.length === 0}
            >
              Exportar CSV
            </Button>
            {canManage && <Button onClick={openCreateModal}>Nuevo descuento</Button>}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-3 text-slate-600">Cargando descuentos…</p>
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
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <p>
                {hayFiltrosActivos
                  ? `${descuentosFiltrados.length} de ${descuentos.length} descuentos`
                  : `${descuentos.length} descuentos`}
              </p>
              {hayFiltrosActivos && (
                <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
                  Quitar filtros
                </Button>
              )}
            </div>
            <Table
              columns={columns}
              data={descuentosFiltrados}
              getRowKey={(descuento) => descuento.id}
              caption="Listado de descuentos"
              emptyMessage={
                hayFiltrosActivos
                  ? 'Ningún descuento coincide con los filtros.'
                  : 'Todavía no hay descuentos.'
              }
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
                <SearchSelect
                  label="Concepto de cobro"
                  value={consultaConceptoId}
                  onChange={(conceptoId) => {
                    setConsultaConceptoId(conceptoId)
                    invalidateConsulta()
                  }}
                  options={opcionesConcepto}
                  required
                  disabled={isConsulting}
                  placeholder="Busca el programa o combo…"
                  emptyMessage="No hay conceptos disponibles."
                  containerClassName="flex-1"
                />
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
                      {/* Lo que se viene a averiguar no es el porcentaje sino cuánto paga
                          el alumno: hacer la resta a mano invita a equivocarse. */}
                      {conceptoConsultado && (
                        <p className="mt-2 text-base font-bold">
                          {formatMonto(conceptoConsultado.monto)} →{' '}
                          {montoConDescuento(conceptoConsultado.monto, descuentoVigente.porcentaje)}
                        </p>
                      )}
                      <p className="mt-2">
                        {descuentoVigente.descripcion || 'Sin descripción.'}
                      </p>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                      No hay descuento vigente: se cobra el precio completo
                      {conceptoConsultado ? `, ${formatMonto(conceptoConsultado.monto)}` : ''}.
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
            min={PORCENTAJE_MINIMO}
            max={PORCENTAJE_MAXIMO}
            step={0.1}
            value={form.porcentaje}
            onChange={(event) => {
              setForm((current) => ({ ...current, porcentaje: event.target.value }))
              limpiarError('porcentaje')
            }}
            error={errores.porcentaje}
            hint={vistaPreviaMonto || `Entre ${PORCENTAJE_MINIMO}% y ${PORCENTAJE_MAXIMO}%`}
            required
            disabled={isSaving}
          />
          <SearchSelect
            label="Concepto de cobro"
            value={form.concepto_id}
            onChange={(conceptoId) => {
              setForm((current) => ({ ...current, concepto_id: conceptoId }))
              limpiarError('concepto_id')
            }}
            options={opcionesConcepto}
            error={errores.concepto_id}
            required
            disabled={isSaving}
            placeholder="Busca el programa o combo…"
            emptyMessage="No hay conceptos disponibles."
            hint="Escribe el nombre del programa. Solo puede haber un descuento activo por concepto."
            containerClassName="sm:col-span-2"
          />
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
        isOpen={Boolean(descuentoToDelete)}
        onClose={closeDeleteModal}
        title="Desactivar descuento"
        size="sm"
        closeOnBackdrop={!isDeleting}
        footer={
          <>
            <Button variant="ghost" onClick={closeDeleteModal} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Sí, desactivar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Desactivar el descuento del <strong>{descuentoToDelete?.porcentaje}%</strong> sobre{' '}
          <strong>
            {descuentoToDelete ? etiquetaDe(descuentoToDelete.concepto_id) : ''}
          </strong>
          ? Dejará de aplicarse en los cobros, pero el registro se conserva y puedes
          reactivarlo cuando quieras.
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
