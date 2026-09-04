import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AdminModuleNav from '@/components/admin/AdminModuleNav'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  actualizarPrograma,
  archivarPrograma,
  crearPrograma,
  listarProgramas,
} from '@/services/programasApi'
import type {
  ProgramaBackend,
  ProgramaCreate,
  ProgramaEstado,
  ProgramaTipo,
  ProgramaUpdate,
  UsuarioRol,
} from '@/types/backend'

interface ProgramaFormState {
  codigo: string
  abreviatura: string
  nombre: string
  tipo: ProgramaTipo
  categoria: string
  malla: string
  descripcion: string
  anio: string
  num_lecciones: string
  certificado: boolean
  tutor: string
  estado: ProgramaEstado
  publicacion_programada: string
}

const TIPO_LABELS: Record<ProgramaTipo, string> = {
  carrera: 'Carrera',
  auxiliar: 'Auxiliar',
  especializacion: 'Especialización',
  curso: 'Curso',
}

const ESTADO_LABELS: Record<ProgramaEstado, string> = {
  no_publicado: 'No publicado',
  publicado: 'Publicado',
  archivado: 'Archivado',
}

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const EMPTY_FORM: ProgramaFormState = {
  codigo: '',
  abreviatura: '',
  nombre: '',
  tipo: 'carrera',
  categoria: '',
  malla: '',
  descripcion: '',
  anio: String(new Date().getFullYear()),
  num_lecciones: '0',
  certificado: false,
  tutor: '',
  estado: 'no_publicado',
  publicacion_programada: '',
}

function toLocalDateTime(value: string | null): string {
  if (!value) return ''
  const date = new Date(value)
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toFormState(programa: ProgramaBackend): ProgramaFormState {
  return {
    codigo: programa.codigo,
    abreviatura: programa.abreviatura,
    nombre: programa.nombre,
    tipo: programa.tipo,
    categoria: programa.categoria,
    malla: programa.malla,
    descripcion: programa.descripcion ?? '',
    anio: String(programa.anio),
    num_lecciones: String(programa.num_lecciones),
    certificado: programa.certificado,
    tutor: programa.tutor ?? '',
    estado: programa.estado,
    publicacion_programada: toLocalDateTime(programa.publicacion_programada),
  }
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function StatusBadge({ estado }: { estado: ProgramaEstado }) {
  const classes: Record<ProgramaEstado, string> = {
    publicado: 'bg-emerald-100 text-emerald-800',
    no_publicado: 'bg-amber-100 text-amber-800',
    archivado: 'bg-slate-200 text-slate-700',
  }

  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${classes[estado]}`}>
      {ESTADO_LABELS[estado]}
    </span>
  )
}

export default function ProgramasAdminPage() {
  const { user, logout } = useAuth()
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<ProgramaEstado | 'todos'>('todos')
  const [tipoFilter, setTipoFilter] = useState<ProgramaTipo | 'todos'>('todos')
  const [editingPrograma, setEditingPrograma] = useState<ProgramaBackend | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [form, setForm] = useState<ProgramaFormState>(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [programaToArchive, setProgramaToArchive] = useState<ProgramaBackend | null>(null)
  const [archiveError, setArchiveError] = useState('')
  const [isArchiving, setIsArchiving] = useState(false)
  const canManage = user?.rol === 'academico' || user?.rol === 'admin_sistema'

  const fetchProgramas = useCallback(async () => {
    try {
      const data = await listarProgramas()
      setProgramas(data)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setLoadError(getErrorMessage(error, 'No se pudo cargar la lista de programas.'))
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    let isActive = true

    listarProgramas()
      .then((data) => {
        if (isActive) setProgramas(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudo cargar la lista de programas.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout])

  const filteredProgramas = useMemo(
    () =>
      programas.filter(
        (programa) =>
          (estadoFilter === 'todos' || programa.estado === estadoFilter) &&
          (tipoFilter === 'todos' || programa.tipo === tipoFilter),
      ),
    [estadoFilter, programas, tipoFilter],
  )

  const closeFormModal = useCallback(() => {
    if (isSaving) return
    setIsFormOpen(false)
    setEditingPrograma(null)
    setFormError('')
  }, [isSaving])

  const openCreateModal = useCallback(() => {
    setEditingPrograma(null)
    setForm({ ...EMPTY_FORM, anio: String(new Date().getFullYear()) })
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openEditModal = useCallback((programa: ProgramaBackend) => {
    setEditingPrograma(programa)
    setForm(toFormState(programa))
    setFormError('')
    setIsFormOpen(true)
  }, [])

  const openArchiveModal = useCallback((programa: ProgramaBackend) => {
    setProgramaToArchive(programa)
    setArchiveError('')
  }, [])

  const closeArchiveModal = useCallback(() => {
    if (isArchiving) return
    setProgramaToArchive(null)
    setArchiveError('')
  }, [isArchiving])

  const columns = useMemo<TableColumn<ProgramaBackend>[]>(() => {
    const baseColumns: TableColumn<ProgramaBackend>[] = [
      {
        key: 'codigo',
        header: 'Código',
        render: (programa) => <span className="font-bold text-dark">{programa.codigo}</span>,
      },
      {
        key: 'nombre',
        header: 'Programa',
        render: (programa) => (
          <div className="min-w-56">
            <p className="font-semibold text-dark">{programa.nombre}</p>
            <p className="text-xs text-slate-500">{programa.abreviatura}</p>
          </div>
        ),
      },
      {
        key: 'tipo',
        header: 'Tipo',
        render: (programa) => TIPO_LABELS[programa.tipo],
      },
      {
        key: 'categoria',
        header: 'Categoría',
        render: (programa) => programa.categoria,
      },
      {
        key: 'periodo',
        header: 'Año / lecciones',
        render: (programa) => `${programa.anio} / ${programa.num_lecciones}`,
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (programa) => <StatusBadge estado={programa.estado} />,
      },
    ]

    if (canManage) {
      baseColumns.push({
        key: 'acciones',
        header: 'Acciones',
        render: (programa) => (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => openEditModal(programa)}>
              Editar
            </Button>
            {programa.estado !== 'archivado' && (
              <Button size="sm" variant="danger" onClick={() => openArchiveModal(programa)}>
                Archivar
              </Button>
            )}
          </div>
        ),
      })
    }

    return baseColumns
  }, [canManage, openArchiveModal, openEditModal])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    setIsSaving(true)

    const payload: ProgramaCreate = {
      codigo: form.codigo.trim(),
      abreviatura: form.abreviatura.trim(),
      nombre: form.nombre.trim(),
      tipo: form.tipo,
      categoria: form.categoria.trim(),
      malla: form.malla.trim(),
      descripcion: form.descripcion.trim() || null,
      anio: Number(form.anio),
      num_lecciones: Number(form.num_lecciones),
      certificado: form.certificado,
      tutor: form.tutor.trim() || null,
      estado: form.estado,
      publicacion_programada: form.publicacion_programada
        ? new Date(form.publicacion_programada).toISOString()
        : null,
    }

    try {
      if (editingPrograma) {
        const updatePayload: ProgramaUpdate = {
          abreviatura: payload.abreviatura,
          nombre: payload.nombre,
          tipo: payload.tipo,
          categoria: payload.categoria,
          malla: payload.malla,
          descripcion: payload.descripcion,
          anio: payload.anio,
          num_lecciones: payload.num_lecciones,
          certificado: payload.certificado,
          tutor: payload.tutor,
          estado: payload.estado,
          publicacion_programada: payload.publicacion_programada,
        }
        const updated = await actualizarPrograma(editingPrograma.id, updatePayload)
        setProgramas((current) =>
          current.map((programa) => (programa.id === updated.id ? updated : programa)),
        )
        setFeedback(`El programa ${updated.codigo} se actualizó correctamente.`)
      } else {
        const created = await crearPrograma(payload)
        setProgramas((current) => [created, ...current])
        setFeedback(`El programa ${created.codigo} se creó correctamente.`)
      }
      setIsFormOpen(false)
      setEditingPrograma(null)
    } catch (error) {
      setFormError(getErrorMessage(error, 'No se pudo guardar el programa.'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!programaToArchive) return
    setArchiveError('')
    setFeedback('')
    setIsArchiving(true)

    try {
      const archived = await archivarPrograma(programaToArchive.id)
      setProgramas((current) =>
        current.map((programa) => (programa.id === archived.id ? archived : programa)),
      )
      setFeedback(`El programa ${archived.codigo} fue archivado.`)
      setProgramaToArchive(null)
    } catch (error) {
      setArchiveError(getErrorMessage(error, 'No se pudo archivar el programa.'))
    } finally {
      setIsArchiving(false)
    }
  }

  const handleRetry = () => {
    setLoadError('')
    setIsLoading(true)
    void fetchProgramas()
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Programas</h1>
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
              label="Filtrar por estado"
              value={estadoFilter}
              onChange={(event) =>
                setEstadoFilter(event.target.value as ProgramaEstado | 'todos')
              }
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los estados</option>
              <option value="no_publicado">No publicado</option>
              <option value="publicado">Publicado</option>
              <option value="archivado">Archivado</option>
            </Select>
            <Select
              label="Filtrar por tipo"
              value={tipoFilter}
              onChange={(event) => setTipoFilter(event.target.value as ProgramaTipo | 'todos')}
              containerClassName="min-w-52"
            >
              <option value="todos">Todos los tipos</option>
              <option value="carrera">Carrera</option>
              <option value="auxiliar">Auxiliar</option>
              <option value="especializacion">Especialización</option>
              <option value="curso">Curso</option>
            </Select>
          </div>
          {canManage && (
            <Button size="lg" onClick={openCreateModal}>
              Nuevo programa
            </Button>
          )}
        </div>

        {feedback && (
          <div role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {feedback}
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando programas...</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-red-200 bg-white p-8 text-center">
            <p role="alert" className="mb-4 text-red-700">{loadError}</p>
            <Button variant="secondary" onClick={handleRetry}>Reintentar</Button>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-600">
              {filteredProgramas.length} de {programas.length} programas
            </p>
            <Table
              columns={columns}
              data={filteredProgramas}
              getRowKey={(programa) => programa.id}
              caption="Listado de programas académicos"
              emptyMessage="No hay programas que coincidan con los filtros seleccionados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={closeFormModal}
        title={editingPrograma ? `Editar ${editingPrograma.codigo}` : 'Nuevo programa'}
        size="lg"
        closeOnBackdrop={!isSaving}
        footer={
          <>
            <Button variant="ghost" onClick={closeFormModal} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" form="programa-form" isLoading={isSaving}>
              {editingPrograma ? 'Guardar cambios' : 'Crear programa'}
            </Button>
          </>
        }
      >
        <form id="programa-form" onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
          {formError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2">
              {formError}
            </div>
          )}

          <Input
            label="Código"
            value={form.codigo}
            onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
            maxLength={10}
            required
            disabled={Boolean(editingPrograma) || isSaving}
            hint={editingPrograma ? 'El código no puede modificarse.' : 'Máximo 10 caracteres.'}
          />
          <Input
            label="Abreviatura"
            value={form.abreviatura}
            onChange={(event) => setForm((current) => ({ ...current, abreviatura: event.target.value }))}
            maxLength={50}
            required
            disabled={isSaving}
          />
          <Input
            label="Nombre"
            value={form.nombre}
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            maxLength={255}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Select
            label="Tipo"
            value={form.tipo}
            onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value as ProgramaTipo }))}
            required
            disabled={isSaving}
          >
            <option value="carrera">Carrera</option>
            <option value="auxiliar">Auxiliar</option>
            <option value="especializacion">Especialización</option>
            <option value="curso">Curso</option>
          </Select>
          <Input
            label="Categoría"
            value={form.categoria}
            onChange={(event) => setForm((current) => ({ ...current, categoria: event.target.value }))}
            maxLength={100}
            required
            disabled={isSaving}
          />
          <Input
            label="Malla curricular"
            value={form.malla}
            onChange={(event) => setForm((current) => ({ ...current, malla: event.target.value }))}
            maxLength={255}
            required
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <Input
            label="Año"
            type="number"
            min={1}
            step={1}
            value={form.anio}
            onChange={(event) => setForm((current) => ({ ...current, anio: event.target.value }))}
            required
            disabled={isSaving}
          />
          <Input
            label="Número de lecciones"
            type="number"
            min={0}
            step={1}
            value={form.num_lecciones}
            onChange={(event) => setForm((current) => ({ ...current, num_lecciones: event.target.value }))}
            required
            disabled={isSaving}
          />
          <Input
            label="Tutor"
            value={form.tutor}
            onChange={(event) => setForm((current) => ({ ...current, tutor: event.target.value }))}
            maxLength={255}
            disabled={isSaving}
          />
          <Select
            label="Estado"
            value={form.estado}
            onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value as ProgramaEstado }))}
            required
            disabled={isSaving}
          >
            <option value="no_publicado">No publicado</option>
            <option value="publicado">Publicado</option>
            <option value="archivado" disabled>Archivado</option>
          </Select>
          <Input
            label="Publicación programada"
            type="datetime-local"
            value={form.publicacion_programada}
            onChange={(event) => setForm((current) => ({ ...current, publicacion_programada: event.target.value }))}
            disabled={isSaving}
            containerClassName="sm:col-span-2"
          />
          <div className="sm:col-span-2">
            <label htmlFor="programa-descripcion" className="mb-1.5 block text-sm font-semibold text-dark">
              Descripción
            </label>
            <textarea
              id="programa-descripcion"
              rows={4}
              value={form.descripcion}
              onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
              disabled={isSaving}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-dark outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-slate-100"
            />
          </div>
          <label className="flex min-h-11 items-center gap-3 rounded-lg border border-slate-200 px-4 py-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.certificado}
              onChange={(event) => setForm((current) => ({ ...current, certificado: event.target.checked }))}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            <span className="text-sm font-semibold text-dark">Incluye certificado</span>
          </label>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(programaToArchive)}
        onClose={closeArchiveModal}
        title="Archivar programa"
        size="sm"
        closeOnBackdrop={!isArchiving}
        footer={
          <>
            <Button variant="ghost" onClick={closeArchiveModal} disabled={isArchiving}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleArchive} isLoading={isArchiving}>
              Sí, archivar
            </Button>
          </>
        }
      >
        <p className="text-slate-700">
          ¿Confirmas que deseas archivar{' '}
          <strong>{programaToArchive?.nombre}</strong>? El registro seguirá disponible en el
          historial con estado archivado.
        </p>
        {archiveError && (
          <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {archiveError}
          </div>
        )}
      </Modal>
    </main>
  )
}
