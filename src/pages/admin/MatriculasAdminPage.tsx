import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import AdminModuleNav from '@/components/admin/AdminModuleNav'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import Textarea from '@/components/ui/Textarea'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import { listarCuentasAlumno } from '@/services/cuentasAlumnoApi'
import { anularMatricula, listarMatriculas } from '@/services/matriculasApi'
import { listarProgramas } from '@/services/programasApi'
import type {
  CuentaAlumnoBackend,
  MatriculaBackend,
  MatriculaEstado,
  MatriculaTipo,
  ProgramaBackend,
  UsuarioRol,
} from '@/types/backend'

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const TIPO_LABELS: Record<MatriculaTipo, string> = {
  nueva: 'Nueva',
  retorno: 'Retorno',
}

const TIPO_BADGE_VARIANTS = {
  nueva: 'sky',
  retorno: 'violet',
} as const

const ESTADO_LABELS: Record<MatriculaEstado, string> = {
  pendiente: 'Pendiente',
  activa: 'Activa',
  anulada: 'Anulada',
}

const ESTADO_BADGE_VARIANTS = {
  pendiente: 'amber',
  activa: 'emerald',
  anulada: 'red',
} as const

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMATTER.format(date)
}

function truncateId(id: string): string {
  return `${id.slice(0, 8)}…`
}

function getAlumnoFullName(alumno: CuentaAlumnoBackend): string {
  return `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno ?? ''}`.trim()
}

export default function MatriculasAdminPage() {
  const { user, logout } = useAuth()
  const [matriculas, setMatriculas] = useState<MatriculaBackend[]>([])
  const [alumnos, setAlumnos] = useState<CuentaAlumnoBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [estadoFilter, setEstadoFilter] = useState<MatriculaEstado | ''>('')
  const [tipoFilter, setTipoFilter] = useState<MatriculaTipo | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [matriculaToCancel, setMatriculaToCancel] = useState<MatriculaBackend | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [cancellationError, setCancellationError] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    let isActive = true

    Promise.all([listarMatriculas(), listarCuentasAlumno(), listarProgramas()])
      .then(([matriculaData, alumnoData, programaData]) => {
        if (!isActive) return
        setMatriculas(matriculaData)
        setAlumnos(alumnoData)
        setProgramas(programaData)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudo cargar la gestión de matrículas.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, reloadKey])

  const alumnosPorId = useMemo(
    () => new Map(alumnos.map((alumno) => [alumno.id, alumno])),
    [alumnos],
  )

  const programasPorId = useMemo(
    () => new Map(programas.map((programa) => [programa.id, programa])),
    [programas],
  )

  const matriculasFiltradas = useMemo(
    () =>
      matriculas.filter(
        (matricula) =>
          (!estadoFilter || matricula.estado === estadoFilter) &&
          (!tipoFilter || matricula.tipo === tipoFilter),
      ),
    [estadoFilter, matriculas, tipoFilter],
  )

  const openCancellation = useCallback((matricula: MatriculaBackend) => {
    setMatriculaToCancel(matricula)
    setCancellationReason('')
    setCancellationError('')
  }, [])

  const closeCancellation = useCallback(() => {
    if (isCancelling) return
    setMatriculaToCancel(null)
    setCancellationReason('')
    setCancellationError('')
  }, [isCancelling])

  const columns = useMemo<TableColumn<MatriculaBackend>[]>(
    () => [
      {
        key: 'alumno_id',
        header: 'Alumno',
        render: (matricula) => {
          const alumno = alumnosPorId.get(matricula.alumno_id)

          return alumno ? (
            <div>
              <p className="font-semibold text-dark">{getAlumnoFullName(alumno)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{alumno.correo || alumno.dni}</p>
            </div>
          ) : (
            <span title={matricula.alumno_id}>Alumno {truncateId(matricula.alumno_id)}</span>
          )
        },
      },
      {
        key: 'programa_id',
        header: 'Programa',
        render: (matricula) => {
          const programa = programasPorId.get(matricula.programa_id)
          return programa ? (
            <span className="font-semibold text-dark">{programa.nombre}</span>
          ) : (
            <span title={matricula.programa_id}>Programa {truncateId(matricula.programa_id)}</span>
          )
        },
      },
      {
        key: 'tipo',
        header: 'Tipo',
        render: (matricula) => (
          <Badge variant={TIPO_BADGE_VARIANTS[matricula.tipo]}>
            {TIPO_LABELS[matricula.tipo]}
          </Badge>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (matricula) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[matricula.estado]}>
            {ESTADO_LABELS[matricula.estado]}
          </Badge>
        ),
      },
      {
        key: 'fecha_activacion',
        header: 'Fecha de activación',
        render: (matricula) => (
          <span className="whitespace-nowrap">{formatDate(matricula.fecha_activacion)}</span>
        ),
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (matricula) =>
          matricula.estado !== 'anulada' ? (
            <Button size="sm" variant="danger" onClick={() => openCancellation(matricula)}>
              Anular
            </Button>
          ) : (
            <span className="text-slate-400">—</span>
          ),
      },
    ],
    [alumnosPorId, openCancellation, programasPorId],
  )

  const handleCancellation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!matriculaToCancel) return

    const reason = cancellationReason.trim()
    if (!reason) {
      setCancellationError('Ingresa el motivo de la anulación.')
      return
    }

    setCancellationError('')
    setFeedback('')
    setIsCancelling(true)

    try {
      const cancelled = await anularMatricula(matriculaToCancel.id, reason)
      setMatriculas((current) =>
        current.map((matricula) => (matricula.id === cancelled.id ? cancelled : matricula)),
      )
      setFeedback(`La matrícula ${truncateId(cancelled.id)} fue anulada correctamente.`)
      setMatriculaToCancel(null)
      setCancellationReason('')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setCancellationError(getErrorMessage(error, 'No se pudo anular la matrícula.'))
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
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Matrículas</h1>
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
        <div className="mb-6 grid w-full gap-4 sm:grid-cols-2 lg:max-w-2xl">
          <Select
            label="Filtrar por estado"
            value={estadoFilter}
            onChange={(event) => setEstadoFilter(event.target.value as MatriculaEstado | '')}
          >
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="activa">Activa</option>
            <option value="anulada">Anulada</option>
          </Select>
          <Select
            label="Filtrar por tipo"
            value={tipoFilter}
            onChange={(event) => setTipoFilter(event.target.value as MatriculaTipo | '')}
          >
            <option value="">Todos</option>
            <option value="nueva">Nueva</option>
            <option value="retorno">Retorno</option>
          </Select>
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
              <p className="text-slate-600">Cargando matrículas...</p>
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
              {matriculasFiltradas.length}{' '}
              {matriculasFiltradas.length === 1
                ? 'matrícula disponible'
                : 'matrículas disponibles'}
            </p>
            <Table
              columns={columns}
              data={matriculasFiltradas}
              getRowKey={(matricula) => matricula.id}
              caption="Listado de matrículas"
              emptyMessage="No hay matrículas que coincidan con los filtros seleccionados."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={Boolean(matriculaToCancel)}
        onClose={closeCancellation}
        title="Anular matrícula"
        size="sm"
        closeOnBackdrop={!isCancelling}
        footer={
          <>
            <Button variant="ghost" onClick={closeCancellation} disabled={isCancelling}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="cancel-enrollment-form"
              variant="danger"
              isLoading={isCancelling}
            >
              Sí, anular
            </Button>
          </>
        }
      >
        <form id="cancel-enrollment-form" onSubmit={handleCancellation} noValidate>
          <p className="mb-4 text-sm text-slate-700">
            Esta acción anulará la matrícula <strong>{matriculaToCancel?.id}</strong>.
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
