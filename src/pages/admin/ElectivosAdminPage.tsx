import { useEffect, useMemo, useState } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import { listarCuentasAlumno } from '@/services/cuentasAlumnoApi'
import { listarElectivos } from '@/services/electivosApi'
import { listarMatriculas } from '@/services/matriculasApi'
import { listarProgramas } from '@/services/programasApi'
import type {
  CuentaAlumnoBackend,
  ElectivoBackend,
  ElectivoEstado,
  MatriculaBackend,
  ProgramaBackend,
} from '@/types/backend'

const ESTADO_LABELS: Record<ElectivoEstado, string> = {
  activado: 'Activado',
  en_curso: 'En curso',
  completado: 'Completado',
  cancelado: 'Cancelado',
}

const ESTADO_BADGE_VARIANTS = {
  activado: 'sky',
  en_curso: 'amber',
  completado: 'emerald',
  cancelado: 'red',
} as const

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_TIME_FORMATTER.format(date)
}

function truncateId(id: string): string {
  return `${id.slice(0, 8)}…`
}

function getAlumnoFullName(alumno: CuentaAlumnoBackend): string {
  return `${alumno.nombres} ${alumno.apellido_paterno} ${alumno.apellido_materno ?? ''}`.trim()
}

export default function ElectivosAdminPage() {
  const { logout } = useAuth()
  const [electivos, setElectivos] = useState<ElectivoBackend[]>([])
  const [matriculas, setMatriculas] = useState<MatriculaBackend[]>([])
  const [alumnos, setAlumnos] = useState<CuentaAlumnoBackend[]>([])
  const [programas, setProgramas] = useState<ProgramaBackend[]>([])
  const [estadoFilter, setEstadoFilter] = useState<ElectivoEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isActive = true

    Promise.all([
      listarElectivos(),
      listarMatriculas(),
      listarCuentasAlumno(),
      listarProgramas(),
    ])
      .then(([electivoData, matriculaData, alumnoData, programaData]) => {
        if (!isActive) return
        setElectivos(electivoData)
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
        setLoadError(getErrorMessage(error, 'No se pudo cargar la gestión de electivos.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, reloadKey])

  const matriculasPorId = useMemo(
    () => new Map(matriculas.map((matricula) => [matricula.id, matricula])),
    [matriculas],
  )

  const alumnosPorId = useMemo(
    () => new Map(alumnos.map((alumno) => [alumno.id, alumno])),
    [alumnos],
  )

  const programasPorId = useMemo(
    () => new Map(programas.map((programa) => [programa.id, programa])),
    [programas],
  )

  const electivosFiltrados = useMemo(
    () => electivos.filter((electivo) => !estadoFilter || electivo.estado === estadoFilter),
    [electivos, estadoFilter],
  )

  const columns = useMemo<TableColumn<ElectivoBackend>[]>(
    () => [
      {
        key: 'alumno',
        header: 'Alumno',
        render: (electivo) => {
          const matricula = matriculasPorId.get(electivo.matricula_id)
          const alumno = matricula ? alumnosPorId.get(matricula.alumno_id) : undefined

          if (alumno) {
            return (
              <div>
                <p className="font-semibold text-dark">{getAlumnoFullName(alumno)}</p>
                <p className="mt-0.5 text-xs text-slate-500">{alumno.correo || alumno.dni}</p>
              </div>
            )
          }

          return matricula ? (
            <span title={matricula.alumno_id}>Alumno {truncateId(matricula.alumno_id)}</span>
          ) : (
            <span className="text-slate-400">—</span>
          )
        },
      },
      {
        key: 'programa_electivo',
        header: 'Programa (electivo)',
        render: (electivo) => {
          const programa = programasPorId.get(electivo.programa_id)
          return programa ? (
            <span className="font-semibold text-dark">{programa.nombre}</span>
          ) : (
            <span title={electivo.programa_id}>Programa {truncateId(electivo.programa_id)}</span>
          )
        },
      },
      {
        key: 'programa_base',
        header: 'Programa base',
        render: (electivo) => {
          const matricula = matriculasPorId.get(electivo.matricula_id)
          if (!matricula) return <span className="text-slate-400">—</span>

          const programa = programasPorId.get(matricula.programa_id)
          return programa ? (
            <span className="font-semibold text-dark">{programa.nombre}</span>
          ) : (
            <span title={matricula.programa_id}>Programa {truncateId(matricula.programa_id)}</span>
          )
        },
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (electivo) => (
          <Badge variant={ESTADO_BADGE_VARIANTS[electivo.estado]}>
            {ESTADO_LABELS[electivo.estado]}
          </Badge>
        ),
      },
      {
        key: 'gratuito',
        header: 'Gratuito',
        render: (electivo) =>
          electivo.gratuito ? (
            <Badge variant="violet">Sí</Badge>
          ) : (
            <span className="text-slate-400">No</span>
          ),
      },
      {
        key: 'fecha_activacion',
        header: 'Fecha de activación',
        render: (electivo) => (
          <span className="whitespace-nowrap">{formatDate(electivo.fecha_activacion)}</span>
        ),
      },
    ],
    [alumnosPorId, matriculasPorId, programasPorId],
  )

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 w-full sm:max-w-sm">
          <Select
            label="Filtrar por estado"
            value={estadoFilter}
            onChange={(event) => setEstadoFilter(event.target.value as ElectivoEstado | '')}
          >
            <option value="">Todos</option>
            <option value="activado">Activado</option>
            <option value="en_curso">En curso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </div>

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando electivos...</p>
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
              {electivosFiltrados.length}{' '}
              {electivosFiltrados.length === 1 ? 'electivo disponible' : 'electivos disponibles'}
            </p>
            <Table
              columns={columns}
              data={electivosFiltrados}
              getRowKey={(electivo) => electivo.id}
              caption="Listado de electivos"
              emptyMessage="No hay electivos que coincidan con el filtro seleccionado."
            />
          </>
        )}
      </div>
    </main>
  )
}
