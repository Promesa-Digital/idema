import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Modal from '@/components/ui/Modal'
import RowActions from '@/components/ui/RowActions'
import Select from '@/components/ui/Select'
import SearchSelect from '@/components/ui/SearchSelect'
import type { SearchSelectOption } from '@/components/ui/SearchSelect'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import Textarea from '@/components/ui/Textarea'
import { useAuth } from '@/context/AuthContextType'
import { useToast } from '@/hooks/useToast'
import { ApiError } from '@/services/apiClient'
import {
  activarCombo,
  actualizarCombo,
  crearCombo,
  eliminarCombo,
  listarCombosAdmin,
} from '@/services/combosApi'
import { listarProgramasPublicos } from '@/services/programasApi'
import {
  ESTADO_COMBO_LABELS as ESTADO_LABELS,
  PROGRAMAS_MINIMOS,
  moverEnLista,
  validarCombo,
} from '@/utils/combo'
import type { CampoCombo, ErroresCombo } from '@/utils/combo'
import { formatMonto } from '@/utils/conceptoCobro'
import { descargarCSV } from '@/utils/csv'
import { estadoVigencia, formatFecha as formatDate } from '@/utils/vigencia'
import type {
  ComboBackend,
  ComboCreate,
  ComboEstado,
  ProgramaBackend,
  ProgramaTipo,
} from '@/types/backend'

interface ComboFormState {
  nombre: string
  descripcion: string
  vigencia_inicio: string
  vigencia_fin: string
  programa_ids: string[]
}

const EMPTY_FORM: ComboFormState = {
  nombre: '',
  descripcion: '',
  vigencia_inicio: '',
  vigencia_fin: '',
  programa_ids: [],
}

const ESTADO_BADGE_VARIANTS = {
  activo: 'emerald',
  inactivo: 'slate',
} as const

function toFormState(combo: ComboBackend): ComboFormState {
  return {
    nombre: combo.nombre,
    descripcion: combo.descripcion ?? '',
    vigencia_inicio: combo.vigencia_inicio.slice(0, 10),
    vigencia_fin: combo.vigencia_fin.slice(0, 10),
    programa_ids: [...combo.programa_ids],
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

const TIPO_PROGRAMA_LABELS: Record<ProgramaTipo, string> = {
  carrera: 'Carreras',
  auxiliar: 'Auxiliares',
  especializacion: 'Especializaciones',
  curso: 'Cursos',
}

export default function CombosAdminPage() {
  const { user, logout } = useAuth()
  const [combos, setCombos] = useState<ComboBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<ComboEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingCombo, setEditingCombo] = useState<ComboBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ComboFormState>({ ...EMPTY_FORM })
  const [errores, setErrores] = useState<ErroresCombo>({})
  const [formError, setFormError] = useState('')
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  /** Foto del formulario al abrirlo, para saber si hay cambios sin guardar. */
  const formInicial = useRef<ComboFormState>({ ...EMPTY_FORM })
  const [comboToDelete, setComboToDelete] = useState<ComboBackend | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [activatingComboId, setActivatingComboId] = useState<string | null>(null)
  const canManage =
    user?.rol === 'ventas' || user?.rol === 'marketing' || user?.rol === 'admin_sistema'
  const { addToast } = useToast()

  useEffect(() => {
    let isActive = true

    Promise.all([listarCombosAdmin(), listarProgramasPublicos()])
      .then(([comboData, programaData]) => {
        if (!isActive) return
        setCombos(comboData)
        setProgramas(programaData)
      })
      .catch((error: unknown) => {
        if (isActive) {
          setLoadError(getErrorMessage(error, 'No se pudo cargar la gestión de combos.'))
        }
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [reloadKey])

  const programaNames = useMemo(
    () => new Map(programas.map((programa) => [programa.id, programa.nombre])),
    [programas],
  )

  const availableProgramas = useMemo<SearchSelectOption[]>(
    () =>
      programas
        .filter((programa) => !form.programa_ids.includes(programa.id))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
        .map((programa) => ({
          value: programa.id,
          label: programa.nombre,
          hint: programa.codigo,
          group: TIPO_PROGRAMA_LABELS[programa.tipo],
        })),
    [form.programa_ids, programas],
  )

  const combosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase()
    return combos.filter((combo) => {
      if (estadoFilter && combo.estado !== estadoFilter) return false
      if (!termino) return true
      // Los nombres de los programas entran en la búsqueda: se busca el paquete por lo
      // que lleva dentro, no solo por cómo se llama.
      return [combo.nombre, combo.descripcion ?? '', ...combo.programa_nombres]
        .join(' ')
        .toLowerCase()
        .includes(termino)
    })
  }, [busqueda, combos, estadoFilter])

  const resumen = useMemo(() => {
    const activos = combos.filter((combo) => combo.estado === 'activo')
    return {
      total: combos.length,
      activos: activos.length,
      // Activo pero fuera de vigencia: sigue diciendo "Activo" y no se ofrece a nadie.
      fueraDeFecha: activos.filter(
        (combo) => estadoVigencia(combo.vigencia_inicio, combo.vigencia_fin) !== 'vigente',
      ).length,
      // El precio no se edita aquí: sale del concepto de cobro cuyo destino es el combo.
      // Sin concepto, el combo no tiene precio y no se puede vender.
      sinPrecio: activos.filter((combo) => !combo.monto).length,
    }
  }, [combos])

  const hayFiltrosActivos = Boolean(busqueda) || Boolean(estadoFilter)

  const limpiarFiltros = useCallback(() => {
    setBusqueda('')
    setEstadoFilter('')
  }, [])

  const exportar = useCallback(() => {
    descargarCSV(
      `combos-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Nombre', 'Programas', 'Precio', 'Desde', 'Hasta', 'Estado', 'Descripción'],
      combosFiltrados.map((combo) => [
        combo.nombre,
        combo.programa_nombres.join(' | '),
        combo.monto ?? 'Sin precio',
        formatDate(combo.vigencia_inicio),
        formatDate(combo.vigencia_fin),
        ESTADO_LABELS[combo.estado],
        combo.descripcion ?? '',
      ]),
    )
  }, [combosFiltrados])

  /** Quita el rojo de los campos indicados en cuanto el usuario los corrige. */
  const limpiarError = useCallback((...campos: CampoCombo[]) => {
    setErrores((actuales) => {
      const siguiente = { ...actuales }
      for (const campo of campos) delete siguiente[campo]
      return siguiente
    })
  }, [])

  const syncCombo = useCallback((updated: ComboBackend) => {
    setCombos((current) => {
      const exists = current.some((combo) => combo.id === updated.id)
      return exists
        ? current.map((combo) => (combo.id === updated.id ? updated : combo))
        : [updated, ...current]
    })
  }, [])

  const handleActivate = useCallback(
    async (combo: ComboBackend) => {
      setActivatingComboId(combo.id)

      try {
        const activated = await activarCombo(combo.id)
        syncCombo(activated)
        const vigencia = estadoVigencia(activated.vigencia_inicio, activated.vigencia_fin)
        addToast(
          'success',
          'Combo reactivado',
          vigencia === 'vigente'
            ? `${activated.nombre} vuelve a ofrecerse.`
            : `${activated.nombre} está activo, pero fuera de su vigencia: todavía no se ofrece.`,
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
        setActivatingComboId(null)
      }
    },
    [addToast, logout, syncCombo],
  )

  const cerrarFormulario = useCallback(() => {
    setIsFormOpen(false)
    setEditingCombo(null)
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

  const abrirFormulario = useCallback((estado: ComboFormState) => {
    setForm(estado)
    formInicial.current = estado
    setErrores({})
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openCreateModal = useCallback(() => {
    setEditingCombo(null)
    abrirFormulario({ ...EMPTY_FORM, programa_ids: [] })
  }, [abrirFormulario])

  const openEditModal = useCallback(
    (combo: ComboBackend) => {
      setEditingCombo(combo)
      abrirFormulario(toFormState(combo))
    },
    [abrirFormulario],
  )

  const openDeleteModal = useCallback((combo: ComboBackend) => {
    setComboToDelete(combo)
    setDeleteError('')
  }, [])

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return
    setComboToDelete(null)
    setDeleteError('')
  }, [isDeleting])

  const addPrograma = (programaId: string) => {
    if (!programaId || form.programa_ids.includes(programaId)) return
    setForm((current) => ({
      ...current,
      programa_ids: [...current.programa_ids, programaId],
    }))
    limpiarError('programa_ids')
  }

  const movePrograma = (index: number, direction: -1 | 1) => {
    setForm((current) => ({
      ...current,
      programa_ids: moverEnLista(current.programa_ids, index, direction),
    }))
  }

  const removePrograma = (id: string) => {
    setForm((current) => ({
      ...current,
      programa_ids: current.programa_ids.filter((programaId) => programaId !== id),
    }))
  }

  const columns = useMemo<TableColumn<ComboBackend>[]>(() => {
    const baseColumns: TableColumn<ComboBackend>[] = [
      {
        key: 'nombre',
        header: 'Combo',
        sortValue: (combo) => combo.nombre,
        render: (combo) => (
          <div className="min-w-56">
            <p className="font-semibold text-dark">{combo.nombre}</p>
            {combo.descripcion && (
              <p className="truncate text-xs text-slate-500" title={combo.descripcion}>
                {combo.descripcion}
              </p>
            )}
          </div>
        ),
      },
      {
        // Antes esta columna era solo el número de programas. El nombre del paquete no
        // dice qué lleva dentro, y "3" tampoco.
        key: 'programas',
        header: 'Programas incluidos',
        sortValue: (combo) => combo.programa_ids.length,
        render: (combo) => (
          <div className="min-w-56">
            <p className="text-sm text-slate-700">
              {combo.programa_nombres.length > 0
                ? combo.programa_nombres.join(' + ')
                : `${combo.programa_ids.length} programa(s)`}
            </p>
          </div>
        ),
      },
      {
        key: 'precio',
        header: 'Precio',
        sortValue: (combo) => (combo.monto ? Number(combo.monto) : null),
        render: (combo) =>
          combo.monto ? (
            <span className="whitespace-nowrap tabular-nums">{formatMonto(combo.monto)}</span>
          ) : (
            // El precio sale del concepto de cobro con destino Combo. Sin él no se puede
            // cobrar, y hasta ahora eso no se veía en ninguna parte del panel.
            <Badge variant="amber">Sin concepto de cobro</Badge>
          ),
      },
      {
        key: 'vigencia',
        header: 'Vigencia',
        sortValue: (combo) => combo.vigencia_inicio,
        render: (combo) => {
          const vigencia = estadoVigencia(combo.vigencia_inicio, combo.vigencia_fin)
          return (
            <div className="whitespace-nowrap">
              <p>
                {formatDate(combo.vigencia_inicio)} – {formatDate(combo.vigencia_fin)}
              </p>
              {combo.estado === 'activo' && vigencia !== 'vigente' && (
                <p className="mt-0.5 text-xs font-semibold text-amber-700">
                  {vigencia === 'vencido' ? 'Fuera de fecha: no se ofrece' : 'Aún no empieza'}
                </p>
              )}
            </div>
          )
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        sortValue: (combo) => ESTADO_LABELS[combo.estado],
        render: (combo) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[combo.estado]}>
            {ESTADO_LABELS[combo.estado]}
          </Badge>
        ),
      },
    ]

    if (canManage) {
      baseColumns.push({
        key: 'acciones',
        header: '',
        headerClassName: 'w-12',
        render: (combo) => (
          <RowActions
            etiquetaAccesible={`Acciones de ${combo.nombre}`}
            acciones={[
              { etiqueta: 'Editar', onSelect: () => openEditModal(combo) },
              combo.estado === 'activo'
                ? {
                    // Se llamaba "Eliminar", pero el endpoint da de baja y el registro
                    // sigue ahí: el nombre prometía un borrado que nunca ocurría.
                    etiqueta: 'Desactivar',
                    onSelect: () => openDeleteModal(combo),
                    destructiva: true,
                  }
                : {
                    etiqueta: 'Reactivar',
                    onSelect: () => void handleActivate(combo),
                    disabled: activatingComboId === combo.id,
                  },
            ]}
          />
        ),
      })
    }

    return baseColumns
  }, [activatingComboId, canManage, handleActivate, openDeleteModal, openEditModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    const nuevosErrores = validarCombo(form, combos, editingCombo?.id)
    setErrores(nuevosErrores)
    if (Object.keys(nuevosErrores).length > 0) return

    setIsSaving(true)

    const payload: ComboCreate = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      vigencia_inicio: form.vigencia_inicio,
      vigencia_fin: form.vigencia_fin,
      programa_ids: form.programa_ids,
    }

    try {
      const saved = editingCombo
        ? await actualizarCombo(editingCombo.id, payload)
        : await crearCombo(payload)

      syncCombo(saved)
      addToast(
        'success',
        editingCombo ? 'Combo actualizado' : 'Combo creado',
        saved.monto
          ? `${saved.nombre} · ${formatMonto(saved.monto)}`
          : `${saved.nombre}. Todavía no tiene precio: créale un concepto de cobro con destino Combo.`,
      )
      cerrarFormulario()
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setFormError(getErrorMessage(error, 'No se pudo guardar el combo.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!comboToDelete) return
    setDeleteError('')
    setIsDeleting(true)

    try {
      const deleted = await eliminarCombo(comboToDelete.id)
      syncCombo(deleted)
      addToast(
        'success',
        'Combo desactivado',
        `${deleted.nombre} deja de ofrecerse. Puedes reactivarlo cuando quieras.`,
      )
      setComboToDelete(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setDeleteError(getErrorMessage(error, 'No se pudo dar de baja el combo.'))
    } finally {
      setIsDeleting(false)
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
        {!isLoading && !loadError && (
          <dl className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { etiqueta: 'Total', valor: resumen.total, destacado: true },
              { etiqueta: 'Activos', valor: resumen.activos },
              {
                etiqueta: 'Activos fuera de fecha',
                valor: resumen.fueraDeFecha,
                alerta: resumen.fueraDeFecha > 0,
              },
              {
                etiqueta: 'Sin concepto de cobro',
                valor: resumen.sinPrecio,
                alerta: resumen.sinPrecio > 0,
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
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <Input
              label="Buscar"
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Nombre del combo o de un programa"
            />
            <Select
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) => setEstadoFilter(event.target.value as ComboEstado | '')}
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
              disabled={combosFiltrados.length === 0}
            >
              Exportar CSV
            </Button>
            {canManage && <Button onClick={openCreateModal}>Nuevo combo</Button>}
          </div>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <LoadingSpinner />
              <p className="mt-3 text-slate-600">Cargando combos…</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-center gap-3 text-sm text-slate-600">
              <p>
                {hayFiltrosActivos
                  ? `${combosFiltrados.length} de ${combos.length} combos`
                  : `${combos.length} combos`}
              </p>
              {hayFiltrosActivos && (
                <Button size="sm" variant="ghost" onClick={limpiarFiltros}>
                  Quitar filtros
                </Button>
              )}
            </div>
            <Table
              columns={columns}
              data={combosFiltrados}
              getRowKey={(combo) => combo.id}
              caption="Listado de combos y paquetes académicos"
              emptyMessage={
                hayFiltrosActivos
                  ? 'Ningún combo coincide con los filtros.'
                  : 'Todavía no se creó ningún combo.'
              }
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingCombo ? `Editar ${editingCombo.nombre}` : 'Nuevo combo'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            {/* Sin `disabled`: un botón muerto no dice qué falta. Al pulsarlo, la
                validación señala el campo incompleto. */}
            <Button type="submit" form="combo-form" isLoading={isSaving}>
              {editingCombo ? 'Guardar cambios' : 'Crear combo'}
            </Button>
          </>
        }
      >
        {/* noValidate: si valida el navegador, salta su globo nativo antes que nuestros
            mensajes por campo y estos no llegan a verse nunca. */}
        <form
          id="combo-form"
          onSubmit={handleSubmit}
          noValidate
          className="grid gap-5 sm:grid-cols-2"
        >
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {formError}
            </div>
          )}

          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => {
              setForm((current) => ({ ...current, nombre: event.target.value }))
              limpiarError('nombre')
            }}
            error={errores.nombre}
            maxLength={255}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Textarea
            label="Descripción"
            rows={4}
            value={form.descripcion}
            onChange={(event) =>
              setForm((current) => ({ ...current, descripcion: event.target.value }))
            }
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Inicio de vigencia"
            type="date"
            value={form.vigencia_inicio}
            onChange={(event) => {
              setForm((current) => ({ ...current, vigencia_inicio: event.target.value }))
              limpiarError('vigencia_inicio', 'vigencia_fin')
            }}
            error={errores.vigencia_inicio}
            required
            disabled={isSaving}
          />
          <Input
            label="Fin de vigencia"
            type="date"
            min={form.vigencia_inicio || undefined}
            value={form.vigencia_fin}
            onChange={(event) => {
              setForm((current) => ({ ...current, vigencia_fin: event.target.value }))
              limpiarError('vigencia_fin')
            }}
            error={errores.vigencia_fin}
            required
            disabled={isSaving}
          />

          <fieldset className="sm:col-span-2" disabled={isSaving}>
            <legend className="mb-1.5 text-sm font-semibold text-dark">
              Programas incluidos <span className="text-red-600">*</span>
            </legend>
            <SearchSelect
              label="Agregar programa"
              // El valor vuelve a vacío tras cada alta: este campo no "tiene" un programa,
              // sirve para ir añadiendo uno tras otro sin volver a pulsar un botón.
              value=""
              onChange={addPrograma}
              options={availableProgramas}
              disabled={isSaving || availableProgramas.length === 0}
              placeholder={
                availableProgramas.length === 0
                  ? 'Ya agregaste todos los programas'
                  : 'Busca por nombre o código…'
              }
              emptyMessage="No hay más programas disponibles."
              hint="Al elegir uno se agrega a la lista. Escribe para filtrar."
            />

            <p
              className={`mt-3 text-xs ${errores.programa_ids ? 'font-semibold text-red-600' : 'text-slate-500'}`}
              role={errores.programa_ids ? 'alert' : undefined}
            >
              {errores.programa_ids ??
                `Selecciona al menos ${PROGRAMAS_MINIMOS} programas. El orden mostrado será el orden guardado en el combo.`}
            </p>

            {form.programa_ids.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
                Aún no has agregado programas.
              </p>
            ) : (
              <ol className="mt-3 space-y-2">
                {form.programa_ids.map((id, index) => (
                  <li
                    key={id}
                    className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span className="font-medium text-dark">
                      {index + 1}. {programaNames.get(id) ?? `Programa ${id}`}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => movePrograma(index, -1)}
                        disabled={index === 0 || isSaving}
                        aria-label={`Subir ${programaNames.get(id) ?? id}`}
                      >
                        Subir
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => movePrograma(index, 1)}
                        disabled={index === form.programa_ids.length - 1 || isSaving}
                        aria-label={`Bajar ${programaNames.get(id) ?? id}`}
                      >
                        Bajar
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => removePrograma(id)}
                        disabled={isSaving}
                        aria-label={`Quitar ${programaNames.get(id) ?? id}`}
                      >
                        Quitar
                      </Button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </fieldset>
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
        isOpen={Boolean(comboToDelete)}
        onClose={closeDeleteModal}
        title="Desactivar combo"
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
          ¿Desactivar <strong>{comboToDelete?.nombre}</strong>? Dejará de ofrecerse en la web,
          pero el registro se conserva y puedes reactivarlo cuando quieras.
        </p>
        {deleteError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deleteError}
          </div>
        )}
      </Modal>
    </main>
  )
}
