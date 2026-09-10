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
import {
  activarCombo,
  actualizarCombo,
  crearCombo,
  eliminarCombo,
  listarCombosAdmin,
} from '@/services/combosApi'
import { listarProgramasPublicos } from '@/services/programasApi'
import type {
  ComboBackend,
  ComboCreate,
  ComboEstado,
  ProgramaBackend,
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

const ESTADO_LABELS: Record<ComboEstado, string> = {
  activo: 'Activo',
  inactivo: 'Inactivo',
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

function formatDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
}

export default function CombosAdminPage() {
  const { user, logout } = useAuth()
  const [combos, setCombos] = useState<ComboBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [actionError, setActionError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [editingCombo, setEditingCombo] = useState<ComboBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ComboFormState>({ ...EMPTY_FORM })
  const [programaToAdd, setProgramaToAdd] = useState('')
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [comboToDelete, setComboToDelete] = useState<ComboBackend | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [activatingComboId, setActivatingComboId] = useState<string | null>(null)
  const canManage =
    user?.rol === 'ventas' || user?.rol === 'marketing' || user?.rol === 'admin_sistema'

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

  const availableProgramas = useMemo(
    () => programas.filter((programa) => !form.programa_ids.includes(programa.id)),
    [form.programa_ids, programas],
  )

  const syncCombo = useCallback((updated: ComboBackend) => {
    setCombos((current) => {
      const exists = current.some((combo) => combo.id === updated.id)
      return exists
        ? current.map((combo) => (combo.id === updated.id ? updated : combo))
        : [updated, ...current]
    })
  }, [])

  const handleActivate = useCallback(async (combo: ComboBackend) => {
    setFeedback('')
    setActionError('')
    setActivatingComboId(combo.id)

    try {
      const activated = await activarCombo(combo.id)
      syncCombo(activated)
      setFeedback(`El combo ${activated.nombre} fue reactivado.`)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setActionError(getErrorMessage(error, 'No se pudo reactivar el combo.'))
    } finally {
      setActivatingComboId(null)
    }
  }, [logout, syncCombo])

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingCombo(null)
    setProgramaToAdd('')
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingCombo(null)
    setForm({ ...EMPTY_FORM, programa_ids: [] })
    setProgramaToAdd('')
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((combo: ComboBackend) => {
    setEditingCombo(combo)
    setForm(toFormState(combo))
    setProgramaToAdd('')
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openDeleteModal = useCallback((combo: ComboBackend) => {
    setComboToDelete(combo)
    setDeleteError('')
  }, [])

  const closeDeleteModal = useCallback(() => {
    if (isDeleting) return
    setComboToDelete(null)
    setDeleteError('')
  }, [isDeleting])

  const addPrograma = () => {
    if (!programaToAdd || form.programa_ids.includes(programaToAdd)) return
    setForm((current) => ({
      ...current,
      programa_ids: [...current.programa_ids, programaToAdd],
    }))
    setProgramaToAdd('')
    setFormError('')
  }

  const movePrograma = (index: number, direction: -1 | 1) => {
    setForm((current) => {
      const nextIndex = index + direction
      if (nextIndex < 0 || nextIndex >= current.programa_ids.length) return current

      const programaIds = [...current.programa_ids]
      const currentId = programaIds[index]
      programaIds[index] = programaIds[nextIndex]
      programaIds[nextIndex] = currentId
      return { ...current, programa_ids: programaIds }
    })
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
        header: 'Nombre',
        render: (combo) => <span className="font-semibold text-dark">{combo.nombre}</span>,
      },
      {
        key: 'vigencia',
        header: 'Vigencia',
        render: (combo) => (
          <span className="whitespace-nowrap">
            {formatDate(combo.vigencia_inicio)} – {formatDate(combo.vigencia_fin)}
          </span>
        ),
      },
      {
        key: 'programas',
        header: 'Programas incluidos',
        render: (combo) => combo.programa_ids.length,
      },
      {
        key: 'estado',
        header: 'Estado',
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
        header: 'Acciones',
        render: (combo) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(combo)}>
              Editar
            </Button>
            {combo.estado === 'activo' ? (
              <Button size="sm" variant="danger" onClick={() => openDeleteModal(combo)}>
                Eliminar
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => void handleActivate(combo)}
                isLoading={activatingComboId === combo.id}
              >
                Reactivar
              </Button>
            )}
          </div>
        ),
      })
    }

    return baseColumns
  }, [activatingComboId, canManage, handleActivate, openDeleteModal, openEditModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setActionError('')

    if (form.programa_ids.length < 2) {
      setFormError('Selecciona al menos 2 programas para el combo.')
      return
    }
    if (form.vigencia_inicio > form.vigencia_fin) {
      setFormError('La fecha de inicio no puede ser posterior a la fecha de fin.')
      return
    }

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
      setFeedback(
        editingCombo
          ? `El combo ${saved.nombre} se actualizó correctamente.`
          : `El combo ${saved.nombre} se creó correctamente.`,
      )
      setIsFormOpen(false)
      setEditingCombo(null)
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
    setFeedback('')
    setActionError('')
    setIsDeleting(true)

    try {
      const deleted = await eliminarCombo(comboToDelete.id)
      syncCombo(deleted)
      setFeedback(`El combo ${deleted.nombre} fue dado de baja.`)
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

  const dateRangeWarning =
    form.vigencia_inicio && form.vigencia_fin && form.vigencia_inicio > form.vigencia_fin
      ? 'La fecha de inicio debe ser anterior o igual a la fecha de fin.'
      : ''

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-end">
          {canManage && (
            <Button size="lg" onClick={openCreateModal}>
              Nuevo combo
            </Button>
          )}
        </div>

        {feedback && (
          <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        {actionError && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando combos...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">{combos.length} combos disponibles</p>
            <Table
              columns={columns}
              data={combos}
              getRowKey={(combo) => combo.id}
              caption="Listado de combos y paquetes académicos"
              emptyMessage="Todavía no se creó ningún combo."
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
            <Button
              type="submit"
              form="combo-form"
              isLoading={isSaving}
              disabled={form.programa_ids.length < 2}
            >
              {editingCombo ? 'Guardar cambios' : 'Crear combo'}
            </Button>
          </>
        }
      >
        <form id="combo-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {formError}
            </div>
          )}

          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) =>
              setForm((current) => ({ ...current, nombre: event.target.value }))
            }
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
            onChange={(event) =>
              setForm((current) => ({ ...current, vigencia_inicio: event.target.value }))
            }
            required
            disabled={isSaving}
          />
          <Input
            label="Fin de vigencia"
            type="date"
            min={form.vigencia_inicio || undefined}
            value={form.vigencia_fin}
            onChange={(event) =>
              setForm((current) => ({ ...current, vigencia_fin: event.target.value }))
            }
            required
            disabled={isSaving}
          />
          {dateRangeWarning && (
            <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:col-span-2">
              {dateRangeWarning}
            </p>
          )}

          <fieldset className="sm:col-span-2" disabled={isSaving}>
            <legend className="mb-1.5 text-sm font-semibold text-dark">
              Programas incluidos <span className="text-red-600">*</span>
            </legend>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Select
                label="Agregar programa"
                value={programaToAdd}
                onChange={(event) => setProgramaToAdd(event.target.value)}
                containerClassName="flex-1"
                disabled={isSaving || availableProgramas.length === 0}
              >
                <option value="">
                  {availableProgramas.length === 0
                    ? 'No hay más programas disponibles'
                    : 'Selecciona un programa'}
                </option>
                {availableProgramas.map((programa) => (
                  <option key={programa.id} value={programa.id}>
                    {programa.nombre}
                  </option>
                ))}
              </Select>
              <Button
                variant="secondary"
                onClick={addPrograma}
                disabled={!programaToAdd || isSaving}
              >
                Agregar
              </Button>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Selecciona al menos 2 programas. El orden mostrado será el orden guardado en el combo.
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
        isOpen={Boolean(comboToDelete)}
        onClose={closeDeleteModal}
        title="Eliminar combo"
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
          ¿Confirmas que deseas dar de baja <strong>{comboToDelete?.nombre}</strong>? El registro no
          se borrará y podrá reactivarse.
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
