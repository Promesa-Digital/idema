import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
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
} from '@/types/backend'

type DestinoTipo = 'programa' | 'combo'

interface ConceptoFormState {
  tipo: ConceptoCobroTipo
  monto: string
  descripcion: string
  destinoTipo: DestinoTipo
  destinoId: string
}

const EMPTY_FORM: ConceptoFormState = {
  tipo: 'matricula',
  monto: '',
  descripcion: '',
  destinoTipo: 'programa',
  destinoId: '',
}

const TIPO_LABELS: Record<ConceptoCobroTipo, string> = {
  matricula: 'Matrícula',
  inscripcion: 'Inscripción',
  curso: 'Curso',
  pension: 'Pensión',
  gratuito: 'Gratuito',
}

const ESTADO_LABELS: Record<ConceptoCobroEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
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
    destinoTipo: concepto.programa_id ? 'programa' : 'combo',
    destinoId: concepto.programa_id ?? concepto.combo_id ?? '',
  }
}

function formatMonto(value: string): string {
  const monto = Number(value)
  if (!Number.isFinite(monto)) return `S/ ${value}`

  return `S/ ${monto.toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default function ConceptosAdminPage() {
  const { user, logout } = useAuth()
  const [conceptos, setConceptos] = useState<ConceptoCobroBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [combos, setCombos] = useState<ComboBackend[]>([])
  const [tipoFilter, setTipoFilter] = useState<ConceptoCobroTipo | ''>('')
  const [estadoFilter, setEstadoFilter] = useState<ConceptoCobroEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingConcepto, setEditingConcepto] = useState<ConceptoCobroBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ConceptoFormState>({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [conceptoToToggle, setConceptoToToggle] = useState<ConceptoCobroBackend | null>(null)
  const [toggleError, setToggleError] = useState('')
  const [isToggling, setIsToggling] = useState(false)
  const canManage = user?.rol === 'admin_sistema'

  useEffect(() => {
    let isActive = true

    const filtros = {
      ...(tipoFilter ? { tipo: tipoFilter } : {}),
      ...(estadoFilter ? { estado: estadoFilter } : {}),
    }

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

    Promise.all([listarConceptos(filtros), cargarProgramas(), cargarCombos()])
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
  }, [estadoFilter, logout, reloadKey, tipoFilter])

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

  const syncConcepto = useCallback(
    (updated: ConceptoCobroBackend) => {
      setConceptos((current) => {
        if (
          (tipoFilter && updated.tipo !== tipoFilter) ||
          (estadoFilter && updated.estado !== estadoFilter)
        ) {
          return current.filter((concepto) => concepto.id !== updated.id)
        }

        const exists = current.some((concepto) => concepto.id === updated.id)
        return exists
          ? current.map((concepto) => (concepto.id === updated.id ? updated : concepto))
          : [updated, ...current]
      })
    },
    [estadoFilter, tipoFilter],
  )

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingConcepto(null)
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingConcepto(null)
    setForm({ ...EMPTY_FORM })
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((concepto: ConceptoCobroBackend) => {
    setEditingConcepto(concepto)
    setForm(toFormState(concepto))
    setFormError('')
    setIsFormOpen(true)
  }, [])

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
        render: (concepto) => (
          <span className="font-semibold text-dark">{TIPO_LABELS[concepto.tipo]}</span>
        ),
      },
      {
        key: 'monto',
        header: 'Monto',
        render: (concepto) => <span className="whitespace-nowrap">{formatMonto(concepto.monto)}</span>,
      },
      {
        key: 'destino',
        header: 'Destino',
        render: (concepto) => getDestinoNombre(concepto),
      },
      {
        key: 'estado',
        header: 'Estado',
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
        header: 'Acciones',
        render: (concepto) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(concepto)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant={concepto.estado === 'activo' ? 'danger' : 'primary'}
              onClick={() => openToggleModal(concepto)}
            >
              {concepto.estado === 'activo' ? 'Desactivar' : 'Activar'}
            </Button>
          </div>
        ),
      })
    }

    return baseColumns
  }, [canManage, getDestinoNombre, openEditModal, openToggleModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setActionError('')

    const montoValue = form.monto.trim()
    const monto = Number(montoValue)

    if (!montoValue || !Number.isFinite(monto)) {
      setFormError('Ingresa un monto válido.')
      return
    }
    if (form.tipo === 'gratuito' && monto !== 0) {
      setFormError('El monto debe ser S/ 0.00 para un concepto gratuito.')
      return
    }
    if (form.tipo !== 'gratuito' && monto <= 0) {
      setFormError('El monto debe ser mayor que S/ 0.00 para este tipo de concepto.')
      return
    }
    if (!form.destinoId) {
      setFormError(`Selecciona un ${form.destinoTipo}.`)
      return
    }

    setIsSaving(true)
    const descripcion = form.descripcion.trim() || null

    try {
      let saved: ConceptoCobroBackend

      if (editingConcepto) {
        const payload: ConceptoCobroUpdate = {}

        if (form.tipo !== editingConcepto.tipo) payload.tipo = form.tipo
        if (monto !== Number(editingConcepto.monto)) payload.monto = monto
        if (descripcion !== editingConcepto.descripcion) payload.descripcion = descripcion

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
          setFeedback('No se realizaron cambios en el concepto de cobro.')
          setIsFormOpen(false)
          setEditingConcepto(null)
          return
        }

        saved = await actualizarConcepto(editingConcepto.id, payload)
      } else {
        const payload: ConceptoCobroCreate = {
          tipo: form.tipo,
          monto,
          descripcion,
          ...(form.destinoTipo === 'programa'
            ? { programa_id: form.destinoId }
            : { combo_id: form.destinoId }),
        }
        saved = await crearConcepto(payload)
      }

      syncConcepto(saved)
      setFeedback(
        editingConcepto
          ? `El concepto de ${TIPO_LABELS[saved.tipo]} se actualizó correctamente.`
          : `El concepto de ${TIPO_LABELS[saved.tipo]} se creó correctamente.`,
      )
      setIsFormOpen(false)
      setEditingConcepto(null)
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
    setFeedback('')
    setActionError('')
    setIsToggling(true)

    const shouldActivate = conceptoToToggle.estado === 'inactivo'

    try {
      const updated = shouldActivate
        ? await activarConcepto(conceptoToToggle.id)
        : await desactivarConcepto(conceptoToToggle.id)

      syncConcepto(updated)
      setFeedback(
        `El concepto de ${TIPO_LABELS[updated.tipo]} fue ${
          shouldActivate ? 'activado' : 'desactivado'
        } correctamente.`,
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
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid w-full gap-4 sm:grid-cols-2 lg:max-w-2xl">
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => {
                setIsLoading(true)
                setLoadError('')
                setTipoFilter(event.target.value as ConceptoCobroTipo | '')
              }}
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
              onChange={(event) => {
                setIsLoading(true)
                setLoadError('')
                setEstadoFilter(event.target.value as ConceptoCobroEstado | '')
              }}
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </Select>
          </div>
          {canManage && (
            <Button size="lg" onClick={openCreateModal}>
              Nuevo concepto
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
              <p className="text-slate-600">Cargando conceptos de cobro...</p>
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
              {conceptos.length} conceptos de cobro disponibles
            </p>
            <Table
              columns={columns}
              data={conceptos}
              getRowKey={(concepto) => concepto.id}
              caption="Listado de conceptos de cobro"
              emptyMessage="No hay conceptos de cobro para los filtros seleccionados."
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
              setFormError('')
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
            onChange={(event) =>
              setForm((current) => ({ ...current, monto: event.target.value }))
            }
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
          <Select
            label="Tipo de destino"
            value={form.destinoTipo}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                destinoTipo: event.target.value as DestinoTipo,
                destinoId: '',
              }))
            }
            required
            disabled={isSaving}
          >
            <option value="programa">Programa</option>
            <option value="combo">Combo</option>
          </Select>
          <Select
            label={form.destinoTipo === 'programa' ? 'Programa' : 'Combo'}
            value={form.destinoId}
            onChange={(event) =>
              setForm((current) => ({ ...current, destinoId: event.target.value }))
            }
            required
            disabled={isSaving}
          >
            <option value="">
              {form.destinoTipo === 'programa'
                ? programasOrdenados.length === 0
                  ? 'No hay programas disponibles'
                  : 'Selecciona un programa'
                : combosOrdenados.length === 0
                  ? 'No hay combos disponibles'
                  : 'Selecciona un combo'}
            </option>
            {form.destinoTipo === 'programa'
              ? programasOrdenados.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.nombre} ({programa.codigo})
                  </option>
                ))
              : combosOrdenados.map((combo) => (
                  <option key={combo.id} value={combo.id}>
                    {combo.nombre}
                  </option>
                ))}
          </Select>
        </form>
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
