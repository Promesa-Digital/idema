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
import {
  ESTADO_CONCEPTO_LABELS as ESTADO_LABELS,
  TIPO_CONCEPTO_LABELS as TIPO_LABELS,
  formatMonto,
  validarConcepto,
} from '@/utils/conceptoCobro'
import type {
  CampoConcepto,
  DestinoTipo,
  ErroresConcepto,
} from '@/utils/conceptoCobro'
import { descargarCSV } from '@/utils/csv'
import { ApiError } from '@/services/apiClient'
import { listarCombosAdmin, listarCombosPublicos } from '@/services/combosApi'
import {
  activarConcepto,
  actualizarConcepto,
  crearConcepto,
  desactivarConcepto,
  listarConceptos,
} from '@/services/conceptosApi'
import { listarProgramas, listarProgramasPublicos } from '@/services/programasApi'
import type {
  ComboBackend,
  ConceptoCobroBackend,
  ConceptoCobroCreate,
  ConceptoCobroEstado,
  ConceptoCobroTipo,
  ConceptoCobroUpdate,
  ProgramaBackend,
  ProgramaTipo,
} from '@/types/backend'

interface ConceptoFormState {
  tipo: ConceptoCobroTipo
  monto: string
  descripcion: string
  modalidad: string
  enlacePago: string
  destinoTipo: DestinoTipo
  destinoId: string
}

const EMPTY_FORM: ConceptoFormState = {
  tipo: 'matricula',
  monto: '',
  descripcion: '',
  modalidad: '',
  enlacePago: '',
  destinoTipo: 'programa',
  destinoId: '',
}

const TIPO_PROGRAMA_LABELS: Record<ProgramaTipo, string> = {
  carrera: 'Carreras',
  auxiliar: 'Auxiliares',
  especializacion: 'Especializaciones',
  curso: 'Cursos',
}

const ESTADO_BADGE_VARIANTS = {
  activo: 'emerald',
  inactivo: 'slate',
} as const

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function toFormState(concepto: ConceptoCobroBackend): ConceptoFormState {
  return {
    tipo: concepto.tipo,
    monto: concepto.monto,
    descripcion: concepto.descripcion ?? '',
    modalidad: concepto.modalidad ?? '',
    enlacePago: concepto.enlace_pago ?? '',
    destinoTipo: concepto.programa_id ? 'programa' : 'combo',
    destinoId: concepto.programa_id ?? concepto.combo_id ?? '',
  }
}

export default function ConceptosAdminPage() {
  const { user, logout } = useAuth()
  const [conceptos, setConceptos] = useState<ConceptoCobroBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [combos, setCombos] = useState<ComboBackend[]>([])
  const [tipoFilter, setTipoFilter] = useState<ConceptoCobroTipo | ''>('')
  const [estadoFilter, setEstadoFilter] = useState<ConceptoCobroEstado | ''>('')
  const [busqueda, setBusqueda] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCobroBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ConceptoFormState>({ ...EMPTY_FORM })
  const [errores, setErrores] = useState<ErroresConcepto>({})
  const [formError, setFormError] = useState('')
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [seleccionados, setSeleccionados] = useState<string[]>([])
  const [accionEnLote, setAccionEnLote] = useState(false)
  /** Foto del formulario al abrirlo, para saber si hay cambios sin guardar. */
  const formInicial = useRef<ConceptoFormState>({ ...EMPTY_FORM })
  const [conceptoToToggle, setConceptoToToggle] = useState<ConceptoCobroBackend | null>(null)
  const [toggleError, setToggleError] = useState('')
  const [isToggling, setIsToggling] = useState(false)
  const { addToast } = useToast()
  const canManage = user?.rol === 'admin_sistema'

  useEffect(() => {
    let isActive = true

    // Programas y combos son solo para resolver el nombre del "Destino" en la tabla.
    // Los listados completos (/programas, /combos/admin) están restringidos a los roles
    // que gestionan esos módulos; un rol de solo-lectura de conceptos (p. ej. ventas o
    // academico) puede no tenerlos. En ese caso degradamos al listado público en vez de
    // tumbar toda la página con un 403.
    const cargarProgramas = (): Promise<ProgramaBackend[]> =>
      listarProgramas().catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 403) return listarProgramasPublicos()
        throw error
      })
    const cargarCombos = (): Promise<ComboBackend[]> =>
      listarCombosAdmin().catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 403) return listarCombosPublicos()
        throw error
      })

    // Se traen todos y se filtra en el navegador: cambiar de filtro dejaba la tabla
    // en blanco con un "Cargando..." cada vez, y el volumen de conceptos no lo amerita.
    Promise.all([listarConceptos(), cargarProgramas(), cargarCombos()])
      .then(([conceptoData, programaData, comboData]) => {
        if (!isActive) return
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
        setLoadError(getErrorMessage(error, 'No se pudo cargar la gestión de conceptos de cobro.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, reloadKey])

  const programaNames = useMemo(
    () => new Map(programas.map((programa) => [programa.id, programa.nombre])),
    [programas],
  )

  const comboNames = useMemo(
    () => new Map(combos.map((combo) => [combo.id, combo.nombre])),
    [combos],
  )

  const programasOrdenados = useMemo(
    () => [...programas].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es')),
    [programas],
  )

  const combosOrdenados = useMemo(
    () => [...combos].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es')),
    [combos],
  )

  const opcionesDestino = useMemo<SearchSelectOption[]>(
    () =>
      form.destinoTipo === 'programa'
        ? programasOrdenados.map((programa) => ({
            value: programa.id,
            label: programa.nombre,
            hint: programa.codigo,
            group: TIPO_PROGRAMA_LABELS[programa.tipo],
          }))
        : combosOrdenados.map((combo) => ({
            value: combo.id,
            label: combo.nombre,
            hint: `${combo.programa_ids.length} programa(s)`,
          })),
    [combosOrdenados, form.destinoTipo, programasOrdenados],
  )

  const getDestinoNombre = useCallback(
    (concepto: ConceptoCobroBackend) => {
      if (concepto.programa_id) {
        return programaNames.get(concepto.programa_id) ?? `Programa ${concepto.programa_id}`
      }
      if (concepto.combo_id) {
        return comboNames.get(concepto.combo_id) ?? `Combo ${concepto.combo_id}`
      }
      return '—'
    },
    [comboNames, programaNames],
  )

  const conceptosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return conceptos.filter((concepto) => {
      if (tipoFilter && concepto.tipo !== tipoFilter) return false
      if (estadoFilter && concepto.estado !== estadoFilter) return false
      if (!termino) return true
      // El destino entra en la búsqueda porque es por donde el usuario lo recuerda:
      // busca "enfermería", no "matrícula".
      const texto = [
        TIPO_LABELS[concepto.tipo],
        getDestinoNombre(concepto),
        concepto.descripcion ?? '',
        concepto.modalidad ?? '',
        concepto.monto,
      ]
        .join(' ')
        .toLowerCase()
      return texto.includes(termino)
    })
  }, [busqueda, conceptos, estadoFilter, getDestinoNombre, tipoFilter])

  const resumen = useMemo(() => {
    const dePago = conceptos.filter((concepto) => concepto.tipo !== 'gratuito')
    return {
      total: conceptos.length,
      activos: conceptos.filter((concepto) => concepto.estado === 'activo').length,
      inactivos: conceptos.filter((concepto) => concepto.estado === 'inactivo').length,
      // Un concepto de pago sin enlace no se puede cobrar: es el error que más duele.
      sinEnlace: dePago.filter((concepto) => !concepto.enlace_pago).length,
    }
  }, [conceptos])

  const hayFiltrosActivos = Boolean(busqueda || tipoFilter || estadoFilter)

  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setTipoFilter('')
    setEstadoFilter('')
  }, [])

  const exportar = useCallback(() => {
    descargarCSV(
      `conceptos-cobro-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Tipo', 'Monto', 'Destino', 'Tipo de destino', 'Modalidad', 'Enlace de pago', 'Estado', 'Descripción'],
      conceptosFiltrados.map((concepto) => [
        TIPO_LABELS[concepto.tipo],
        concepto.monto,
        getDestinoNombre(concepto),
        concepto.programa_id ? 'Programa' : concepto.combo_id ? 'Combo' : '',
        concepto.modalidad ?? '',
        concepto.enlace_pago ?? '',
        ESTADO_LABELS[concepto.estado],
        concepto.descripcion ?? '',
      ]),
    )
  }, [conceptosFiltrados, getDestinoNombre])

  const syncConcepto = useCallback((updated: ConceptoCobroBackend) => {
    setConceptos((current) => {
      const existe = current.some((concepto) => concepto.id === updated.id)
      return existe
        ? current.map((concepto) => (concepto.id === updated.id ? updated : concepto))
        : [updated, ...current]
    })
  }, [])

  /**
   * Activa o desactiva varios conceptos de una vez.
   *
   * Se informa por separado de los que salieron y de los que no: decir solo "listo"
   * cuando tres de cinco fallaron deja al usuario creyendo que el trabajo esta hecho.
   */
  const aplicarEnLote = useCallback(
    async (activar: boolean) => {
      const objetivo: ConceptoCobroEstado = activar ? 'inactivo' : 'activo'
      const afectados = conceptos.filter(
        (concepto) => seleccionados.includes(concepto.id) && concepto.estado === objetivo,
      )
      if (afectados.length === 0) {
        addToast(
          'info',
          'Nada que hacer',
          `Los conceptos seleccionados ya están ${activar ? 'activos' : 'inactivos'}.`,
        )
        return
      }

      setAccionEnLote(true)
      const resultados = await Promise.allSettled(
        afectados.map((concepto) =>
          activar ? activarConcepto(concepto.id) : desactivarConcepto(concepto.id),
        ),
      )

      const logrados = resultados.filter(
        (resultado): resultado is PromiseFulfilledResult<ConceptoCobroBackend> =>
          resultado.status === 'fulfilled',
      )
      logrados.forEach((resultado) => syncConcepto(resultado.value))

      if (logrados.length > 0) {
        addToast(
          'success',
          activar ? 'Conceptos activados' : 'Conceptos desactivados',
          `Se ${activar ? 'activaron' : 'desactivaron'} ${logrados.length} de ${afectados.length}.`,
        )
      }
      if (logrados.length < afectados.length) {
        addToast(
          'error',
          'Algunos no se pudieron cambiar',
          `${afectados.length - logrados.length} concepto(s) siguen igual. Inténtalo de nuevo.`,
        )
      }

      setSeleccionados([])
      setAccionEnLote(false)
    },
    [addToast, conceptos, seleccionados, syncConcepto],
  )

  /** Quita el rojo de los campos indicados en cuanto el usuario los corrige. */
  const limpiarError = useCallback((...campos: CampoConcepto[]) => {
    setErrores((actuales) => {
      const siguiente = { ...actuales }
      for (const campo of campos) delete siguiente[campo]
      return siguiente
    })
  }, [])

  const cerrarFormulario = useCallback(() => {
    setIsFormOpen(false)
    setEditingConcepto(null)
    setErrores({})
    setFormError('')
    setConfirmandoDescarte(false)
  }, [])

  /**
   * Cierra avisando si hay cambios. Se compara contra el estado con el que se abrió y
   * no contra un formulario vacío: al editar, "sin cambios" significa igual al
   * original. Sin esto, un clic fuera del modal borraba lo escrito en silencio.
   */
  const closeFormModal = useCallback(() => {
    if (isSaving) return
    if (JSON.stringify(form) !== JSON.stringify(formInicial.current)) {
      setConfirmandoDescarte(true)
      return
    }
    cerrarFormulario()
  }, [cerrarFormulario, form, isSaving])

  const abrirFormulario = useCallback((estado: ConceptoFormState) => {
    setForm(estado)
    formInicial.current = estado
    setErrores({})
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingConcepto(null)
    abrirFormulario({ ...EMPTY_FORM })
  }, [abrirFormulario])

  const openEditModal = useCallback(
    (concepto: ConceptoCobroBackend) => {
      setEditingConcepto(concepto)
      abrirFormulario(toFormState(concepto))
    },
    [abrirFormulario],
  )

  const openToggleModal = useCallback((concepto: ConceptoCobroBackend) => {
    setConceptoToToggle(concepto)
    setToggleError('')
  }, [])

  const closeToggleModal = useCallback(() => {
    if (isToggling) return
    setConceptoToToggle(null)
    setToggleError('')
  }, [isToggling])

  const columns = useMemo<TableColumn<ConceptoCobroBackend>[]>(() => {
    const baseColumns: TableColumn<ConceptoCobroBackend>[] = [
      {
        key: 'tipo',
        header: 'Tipo',
        sortValue: (concepto) => TIPO_LABELS[concepto.tipo],
        render: (concepto) => (
          <span className="font-semibold text-dark">{TIPO_LABELS[concepto.tipo]}</span>
        ),
      },
      {
        key: 'monto',
        header: 'Monto',
        // Por número y no por texto: como texto, S/ 100 iría antes que S/ 90.
        sortValue: (concepto) => Number(concepto.monto),
        render: (concepto) => (
          <span className="whitespace-nowrap tabular-nums">{formatMonto(concepto.monto)}</span>
        ),
      },
      {
        key: 'destino',
        header: 'Destino',
        sortValue: (concepto) => getDestinoNombre(concepto),
        render: (concepto) => (
          <div className="min-w-0">
            <p className="truncate font-semibold text-dark">{getDestinoNombre(concepto)}</p>
            <p className="text-xs text-slate-500">
              {concepto.programa_id ? 'Programa' : concepto.combo_id ? 'Combo' : 'Sin destino'}
              {concepto.modalidad ? ` · ${concepto.modalidad}` : ''}
            </p>
          </div>
        ),
      },
      {
        key: 'cobro',
        header: 'Cobro',
        sortValue: (concepto) => (concepto.enlace_pago ? 1 : 0),
        render: (concepto) =>
          concepto.tipo === 'gratuito' ? (
            <span className="text-sm text-slate-400">No aplica</span>
          ) : concepto.enlace_pago ? (
            <Badge variant="emerald">Con enlace</Badge>
          ) : (
            // Un concepto de pago sin enlace no se puede cobrar: hay que verlo en la tabla,
            // no descubrirlo cuando el alumno intenta pagar.
            <Badge variant="amber">Sin enlace</Badge>
          ),
      },
      {
        key: 'estado',
        header: 'Estado',
        sortValue: (concepto) => ESTADO_LABELS[concepto.estado],
        render: (concepto) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[concepto.estado]}>
            {ESTADO_LABELS[concepto.estado]}
          </Badge>
        ),
      },
    ]

    if (canManage) {
      baseColumns.push({
        key: 'acciones',
        header: '',
        headerClassName: 'w-12',
        render: (concepto) => (
          <RowActions
            etiquetaAccesible={`Acciones de ${TIPO_LABELS[concepto.tipo]} en ${getDestinoNombre(concepto)}`}
            acciones={[
              { etiqueta: 'Editar', onSelect: () => openEditModal(concepto) },
              {
                etiqueta: concepto.estado === 'activo' ? 'Desactivar' : 'Activar',
                onSelect: () => openToggleModal(concepto),
                destructiva: concepto.estado === 'activo',
              },
            ]}
          />
        ),
      })
    }

    return baseColumns
  }, [canManage, getDestinoNombre, openEditModal, openToggleModal])

  const validar = useCallback(
    () => validarConcepto(form, conceptos, editingConcepto?.id),
    [conceptos, editingConcepto, form],
  )

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const nuevosErrores = validar()
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    const monto = Number(form.monto.trim())

    setIsSaving(true)
    const descripcion = form.descripcion.trim() || null
    const modalidad = form.modalidad.trim() || null
    const enlacePago = form.enlacePago.trim() || null

    try {
      let saved: ConceptoCobroBackend

      if (editingConcepto) {
        const payload: ConceptoCobroUpdate = {}

        if (form.tipo !== editingConcepto.tipo) payload.tipo = form.tipo
        if (monto !== Number(editingConcepto.monto)) payload.monto = monto
        if (descripcion !== editingConcepto.descripcion) payload.descripcion = descripcion
        if (modalidad !== editingConcepto.modalidad) payload.modalidad = modalidad
        if (enlacePago !== editingConcepto.enlace_pago) payload.enlace_pago = enlacePago

        const originalDestinoTipo: DestinoTipo = editingConcepto.programa_id
          ? 'programa'
          : 'combo'
        const originalDestinoId = editingConcepto.programa_id ?? editingConcepto.combo_id ?? ''

        if (form.destinoTipo !== originalDestinoTipo) {
          if (form.destinoTipo === 'programa') {
            payload.programa_id = form.destinoId
            payload.combo_id = null
          } else {
            payload.combo_id = form.destinoId
            payload.programa_id = null
          }
        } else if (form.destinoId !== originalDestinoId) {
          if (form.destinoTipo === 'programa') {
            payload.programa_id = form.destinoId
          } else {
            payload.combo_id = form.destinoId
          }
        }

        if (Object.keys(payload).length === 0) {
          addToast('info', 'Sin cambios', 'No modificaste ningún campo del concepto.')
          cerrarFormulario()
          return
        }

        saved = await actualizarConcepto(editingConcepto.id, payload)
      } else {
        const payload: ConceptoCobroCreate = {
          tipo: form.tipo,
          monto,
          descripcion,
          modalidad,
          enlace_pago: enlacePago,
          ...(form.destinoTipo === 'programa'
            ? { programa_id: form.destinoId }
            : { combo_id: form.destinoId }),
        }
        saved = await crearConcepto(payload)
      }

      syncConcepto(saved)
      addToast(
        'success',
        editingConcepto ? 'Concepto actualizado' : 'Concepto creado',
        `${TIPO_LABELS[saved.tipo]} · ${getDestinoNombre(saved)}`,
      )
      cerrarFormulario()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setFormError(getErrorMessage(error, 'No se pudo guardar el concepto de cobro.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggle = async () => {
    if (!conceptoToToggle) return
    setToggleError('')
    setIsToggling(true)

    const shouldActivate = conceptoToToggle.estado === 'inactivo'

    try {
      const updated = shouldActivate
        ? await activarConcepto(conceptoToToggle.id)
        : await desactivarConcepto(conceptoToToggle.id)

      syncConcepto(updated)
      addToast(
        'success',
        shouldActivate ? 'Concepto activado' : 'Concepto desactivado',
        `${TIPO_LABELS[updated.tipo]} · ${getDestinoNombre(updated)}`,
      )
      setConceptoToToggle(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setToggleError(
        getErrorMessage(
          error,
          shouldActivate
            ? 'No se pudo activar el concepto de cobro.'
            : 'No se pudo desactivar el concepto de cobro.',
        ),
      )
    } finally {
      setIsToggling(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  const isActivating = conceptoToToggle?.estado === 'inactivo'

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
                etiqueta: 'Sin enlace de pago',
                valor: resumen.sinEnlace,
                alerta: resumen.sinEnlace > 0,
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
              placeholder="Programa, combo, tipo o monto"
            />
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => setTipoFilter(event.target.value as ConceptoCobroTipo | '')}
            >
              <option value="">Todos los tipos</option>
              <option value="matricula">Matrícula</option>
              <option value="inscripcion">Inscripción</option>
              <option value="curso">Curso</option>
              <option value="pension">Pensión</option>
              <option value="gratuito">Gratuito</option>
            </Select>
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) => setEstadoFilter(event.target.value as ConceptoCobroEstado | '')}
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
              disabled={conceptosFiltrados.length === 0}
            >
              Exportar CSV
            </Button>
            {canManage && <Button onClick={openCreateModal}>Nuevo concepto</Button>}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-3 text-slate-600">Cargando conceptos de cobro…</p>
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
                  ? `${conceptosFiltrados.length} de ${conceptos.length} conceptos`
                  : `${conceptos.length} conceptos de cobro`}
              </p>
              {hayFiltrosActivos && (
                <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
                  Quitar filtros
                </Button>
              )}
            </div>

            {canManage && seleccionados.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
                <p className="text-sm font-semibold text-dark">
                  {seleccionados.length} seleccionado(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void aplicarEnLote(true)}
                    disabled={accionEnLote}
                  >
                    Activar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => void aplicarEnLote(false)}
                    disabled={accionEnLote}
                  >
                    Desactivar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSeleccionados([])}>
                    Quitar selección
                  </Button>
                </div>
              </div>
            )}
            <Table
              columns={columns}
              data={conceptosFiltrados}
              getRowKey={(concepto) => concepto.id}
              seleccion={
                canManage
                  ? { seleccionados, onChange: setSeleccionados }
                  : undefined
              }
              caption="Listado de conceptos de cobro"
              emptyMessage={
                hayFiltrosActivos
                  ? 'Ningún concepto coincide con los filtros.'
                  : 'Todavía no hay conceptos de cobro.'
              }
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingConcepto ? 'Editar concepto' : 'Nuevo concepto'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="concepto-form" isLoading={isSaving}>
              {editingConcepto ? 'Guardar cambios' : 'Crear concepto'}
            </Button>
          </>
        }
      >
        <form
          id="concepto-form"
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
              const tipo = event.target.value as ConceptoCobroTipo
              setForm((current) => ({
                ...current,
                tipo,
                monto: tipo === 'gratuito' ? '0' : current.tipo === 'gratuito' ? '' : current.monto,
              }))
              // Cambiar el tipo puede resolver el duplicado y el monto a la vez.
              limpiarError('monto', 'destinoId')
            }}
            required
            disabled={isSaving}
          >
            <option value="matricula">Matrícula</option>
            <option value="inscripcion">Inscripción</option>
            <option value="curso">Curso</option>
            <option value="pension">Pensión</option>
            <option value="gratuito">Gratuito</option>
          </Select>
          <Input
            label="Monto"
            type="number"
            min={form.tipo === 'gratuito' ? 0 : 0.01}
            step={0.01}
            value={form.monto}
            onChange={(event) => {
              setForm((current) => ({ ...current, monto: event.target.value }))
              limpiarError('monto')
            }}
            error={errores.monto}
            hint={
              form.tipo === 'gratuito'
                ? 'El monto de un concepto gratuito es S/ 0.00.'
                : 'Ingresa un monto mayor que S/ 0.00.'
            }
            required
            disabled={isSaving || form.tipo === 'gratuito'}
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
          <Input
            label="Modalidad del precio"
            value={form.modalidad}
            onChange={(event) =>
              setForm((current) => ({ ...current, modalidad: event.target.value }))
            }
            placeholder="Ej. Virtual, Presencial o Semipresencial"
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Enlace de pago"
            type="url"
            value={form.enlacePago}
            onChange={(event) => {
              setForm((current) => ({ ...current, enlacePago: event.target.value }))
              limpiarError('enlacePago')
            }}
            error={errores.enlacePago}
            placeholder="https://..."
            hint="Enlace de Culqi u otra pasarela. El monto continúa administrándose en EDU-09."
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Select
            label="Tipo de destino"
            value={form.destinoTipo}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                destinoTipo: event.target.value as DestinoTipo,
                destinoId: '',
              }))
              limpiarError('destinoId')
            }}
            required
            disabled={isSaving}
          >
            <option value="programa">Programa</option>
            <option value="combo">Combo</option>
          </Select>
          <SearchSelect
            label={form.destinoTipo === 'programa' ? 'Programa' : 'Combo'}
            value={form.destinoId}
            onChange={(destinoId) => {
              setForm((current) => ({ ...current, destinoId }))
              limpiarError('destinoId')
            }}
            options={opcionesDestino}
            error={errores.destinoId}
            required
            disabled={isSaving}
            clearLabel={`Quitar ${form.destinoTipo} seleccionado`}
            placeholder={
              form.destinoTipo === 'programa' ? 'Busca un programa…' : 'Busca un combo…'
            }
            emptyMessage={
              form.destinoTipo === 'programa'
                ? 'No hay programas disponibles.'
                : 'No hay combos disponibles.'
            }
            hint={
              form.destinoTipo === 'programa'
                ? 'Escribe parte del nombre o el código. Ej.: "enf" o "CAR001".'
                : 'Escribe parte del nombre del combo.'
            }
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
        isOpen={Boolean(conceptoToToggle)}
        onClose={closeToggleModal}
        title={isActivating ? 'Activar concepto' : 'Desactivar concepto'}
        size="sm"
        closeOnBackdrop={!isToggling}
        footer={
          <>
            <Button variant="ghost" onClick={closeToggleModal} disabled={isToggling}>
              Cancelar
            </Button>
            <Button
              variant={isActivating ? 'primary' : 'danger'}
              onClick={handleToggle}
              isLoading={isToggling}
            >
              {isActivating ? 'Sí, activar' : 'Sí, desactivar'}
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que deseas {isActivating ? 'activar' : 'desactivar'} el concepto de{' '}
          <strong>{conceptoToToggle ? TIPO_LABELS[conceptoToToggle.tipo] : ''}</strong>
          {conceptoToToggle ? ` para ${getDestinoNombre(conceptoToToggle)}` : ''}?
          {!isActivating && ' El registro no se borrará y podrá activarse nuevamente.'}
        </p>
        {toggleError && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {toggleError}
          </div>
        )}
      </Modal>
    </main>
  )
}
