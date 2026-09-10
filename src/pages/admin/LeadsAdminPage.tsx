import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Table from '@/components/ui/Table'
import type { TableColumn } from '@/components/ui/Table'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import {
  asignarAsesor,
  cambiarEstadoLead,
  listarLeads,
  obtenerLead,
} from '@/services/leadsApi'
import { listarUsuarios } from '@/services/usuariosApi'
import type {
  LeadBackend,
  LeadEstado,
  LeadOrigen,
  UsuarioDirectorio,
  UsuarioRol,
} from '@/types/backend'

interface DetailItemProps {
  label: string
  children: ReactNode
  fullWidth?: boolean
}

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const ORIGEN_LABELS: Record<LeadOrigen, string> = {
  popup: 'Popup',
  formulario: 'Formulario',
}

const ESTADO_LABELS: Record<LeadEstado, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  pago: 'Pago',
  descartado: 'Descartado',
}

const ESTADO_BADGES = {
  nuevo: 'slate',
  contactado: 'sky',
  pago: 'emerald',
  descartado: 'red',
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

function getLeadName(lead: LeadBackend): string {
  return lead.nombre?.trim() || 'Lead sin nombre'
}

function DetailItem({ label, children, fullWidth = false }: DetailItemProps) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-dark">{children}</dd>
    </div>
  )
}

function EstadoBadge({ estado }: { estado: LeadEstado }) {
  return <Badge variant={ESTADO_BADGES[estado]}>{ESTADO_LABELS[estado]}</Badge>
}

export default function LeadsAdminPage() {
  const { logout } = useAuth()
  const [leads, setLeads] = useState<LeadBackend[]>([])
  const [estadoFiltro, setEstadoFiltro] = useState<LeadEstado | ''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const [feedback, setFeedback] = useState('')

  const [usuarios, setUsuarios] = useState<UsuarioDirectorio[]>([])
  const [isUsuariosLoading, setIsUsuariosLoading] = useState(true)
  const [usuariosError, setUsuariosError] = useState('')
  const [usuariosReloadKey, setUsuariosReloadKey] = useState(0)

  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [detailLead, setDetailLead] = useState<LeadBackend | null>(null)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const detailRequestId = useRef(0)

  const [leadToChange, setLeadToChange] = useState<LeadBackend | null>(null)
  const [nextEstado, setNextEstado] = useState<LeadEstado>('nuevo')
  const [estadoError, setEstadoError] = useState('')
  const [isChangingEstado, setIsChangingEstado] = useState(false)

  const [leadToAssign, setLeadToAssign] = useState<LeadBackend | null>(null)
  const [selectedAsesorId, setSelectedAsesorId] = useState('')
  const [asignacionError, setAsignacionError] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)

  useEffect(() => {
    let isActive = true

    listarLeads(estadoFiltro ? { estado: estadoFiltro } : {})
      .then((data) => {
        if (isActive) setLeads(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setLoadError(getErrorMessage(error, 'No se pudieron cargar los leads.'))
      })
      .finally(() => {
        if (isActive) setIsLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [estadoFiltro, logout, reloadKey])

  useEffect(() => {
    let isActive = true

    listarUsuarios()
      .then((data) => {
        if (isActive) setUsuarios(data)
      })
      .catch((error: unknown) => {
        if (!isActive) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setUsuariosError(getErrorMessage(error, 'No se pudo cargar el directorio de usuarios.'))
      })
      .finally(() => {
        if (isActive) setIsUsuariosLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [logout, usuariosReloadKey])

  const usuariosOrdenados = useMemo(
    () => [...usuarios].sort((first, second) => first.nombre.localeCompare(second.nombre, 'es')),
    [usuarios],
  )

  const usuariosPorId = useMemo(
    () => new Map(usuarios.map((usuario) => [usuario.id, usuario])),
    [usuarios],
  )

  const getAsesorLabel = useCallback(
    (asesorId: string | null) => {
      if (!asesorId) return 'Sin asignar'
      return usuariosPorId.get(asesorId)?.nombre ?? `Usuario ${truncateId(asesorId)}`
    },
    [usuariosPorId],
  )

  const syncLead = useCallback(
    (updated: LeadBackend) => {
      setLeads((current) => {
        if (estadoFiltro && updated.estado !== estadoFiltro) {
          return current.filter((lead) => lead.id !== updated.id)
        }
        return current.map((lead) => (lead.id === updated.id ? updated : lead))
      })
      setDetailLead((current) => (current?.id === updated.id ? updated : current))
    },
    [estadoFiltro],
  )

  const closeDetail = useCallback(() => {
    detailRequestId.current += 1
    setIsDetailOpen(false)
    setDetailError('')
  }, [])

  const openDetail = useCallback(
    async (lead: LeadBackend) => {
      const requestId = detailRequestId.current + 1
      detailRequestId.current = requestId
      setIsDetailOpen(true)
      setDetailLead(lead)
      setDetailError('')
      setIsDetailLoading(true)

      try {
        const currentLead = await obtenerLead(lead.id)
        if (detailRequestId.current === requestId) setDetailLead(currentLead)
      } catch (error) {
        if (detailRequestId.current !== requestId) return
        if (error instanceof ApiError && error.status === 401) {
          logout()
          return
        }
        setDetailError(getErrorMessage(error, 'No se pudo cargar el detalle del lead.'))
      } finally {
        if (detailRequestId.current === requestId) setIsDetailLoading(false)
      }
    },
    [logout],
  )

  const openEstado = useCallback((lead: LeadBackend) => {
    setLeadToChange(lead)
    setNextEstado(lead.estado)
    setEstadoError('')
  }, [])

  const closeEstado = useCallback(() => {
    if (isChangingEstado) return
    setLeadToChange(null)
    setEstadoError('')
  }, [isChangingEstado])

  const openAsignacion = useCallback(
    (lead: LeadBackend) => {
      setLeadToAssign(lead)
      setSelectedAsesorId(
        lead.asesor_asignado_id && usuariosPorId.has(lead.asesor_asignado_id)
          ? lead.asesor_asignado_id
          : '',
      )
      setAsignacionError('')
    },
    [usuariosPorId],
  )

  const closeAsignacion = useCallback(() => {
    if (isAssigning) return
    setLeadToAssign(null)
    setSelectedAsesorId('')
    setAsignacionError('')
  }, [isAssigning])

  const columns = useMemo<TableColumn<LeadBackend>[]>(
    () => [
      {
        key: 'nombre',
        header: 'Nombre',
        render: (lead) => (
          <span className={lead.nombre ? 'font-semibold text-dark' : 'text-slate-500'}>
            {lead.nombre || 'Sin nombre'}
          </span>
        ),
      },
      {
        key: 'correo',
        header: 'Correo',
        render: (lead) => lead.correo || <span className="text-slate-500">—</span>,
      },
      {
        key: 'telefono',
        header: 'Teléfono',
        render: (lead) => lead.telefono || <span className="text-slate-500">—</span>,
      },
      {
        key: 'origen',
        header: 'Origen',
        render: (lead) => ORIGEN_LABELS[lead.origen],
      },
      {
        key: 'estado',
        header: 'Estado',
        render: (lead) => <EstadoBadge estado={lead.estado} />,
      },
      {
        key: 'asesor',
        header: 'Asesor asignado',
        render: (lead) => (
          <span
            className={lead.asesor_asignado_id ? 'text-dark' : 'text-slate-500'}
            title={lead.asesor_asignado_id ?? undefined}
          >
            {getAsesorLabel(lead.asesor_asignado_id)}
          </span>
        ),
      },
      {
        key: 'acciones',
        header: 'Acciones',
        render: (lead) => (
          <div className="flex min-w-max flex-wrap items-center gap-2">
            <Button size="sm" variant="ghost" onClick={() => void openDetail(lead)}>
              Ver detalle
            </Button>
            <Button size="sm" variant="secondary" onClick={() => openEstado(lead)}>
              Cambiar estado
            </Button>
            <Button size="sm" onClick={() => openAsignacion(lead)}>
              Asignar asesor
            </Button>
          </div>
        ),
      },
    ],
    [getAsesorLabel, openAsignacion, openDetail, openEstado],
  )

  const handleEstadoChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leadToChange || nextEstado === leadToChange.estado) return

    setEstadoError('')
    setFeedback('')
    setIsChangingEstado(true)

    try {
      const updated = await cambiarEstadoLead(leadToChange.id, nextEstado)
      syncLead(updated)
      setFeedback(
        `El estado de ${getLeadName(updated)} cambió a ${ESTADO_LABELS[updated.estado].toLowerCase()}.`,
      )
      setLeadToChange(null)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setEstadoError(getErrorMessage(error, 'No se pudo cambiar el estado del lead.'))
    } finally {
      setIsChangingEstado(false)
    }
  }

  const handleAsignacion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!leadToAssign) return
    if (!selectedAsesorId) {
      setAsignacionError('Selecciona un asesor.')
      return
    }

    setAsignacionError('')
    setFeedback('')
    setIsAssigning(true)

    try {
      const updated = await asignarAsesor(leadToAssign.id, selectedAsesorId)
      syncLead(updated)
      setFeedback(
        `${getLeadName(updated)} fue asignado a ${getAsesorLabel(updated.asesor_asignado_id)}.`,
      )
      setLeadToAssign(null)
      setSelectedAsesorId('')
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        logout()
        return
      }
      setAsignacionError(getErrorMessage(error, 'No se pudo asignar el asesor.'))
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRetry = () => {
    setIsLoading(true)
    setLoadError('')
    setReloadKey((current) => current + 1)
  }

  const handleUsuariosRetry = () => {
    setIsUsuariosLoading(true)
    setUsuariosError('')
    setUsuariosReloadKey((current) => current + 1)
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-dark">Leads registrados</h2>
            <p className="mt-1 text-sm text-slate-600">
              Consulta los datos, actualiza el seguimiento y asigna responsables.
            </p>
          </div>
          <Select
            label="Filtrar por estado"
            value={estadoFiltro}
            onChange={(event) => {
              setEstadoFiltro(event.target.value as LeadEstado | '')
              setIsLoading(true)
              setLoadError('')
              setFeedback('')
            }}
            containerClassName="w-full sm:w-64"
          >
            <option value="">Todos los estados</option>
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="pago">Pago</option>
            <option value="descartado">Descartado</option>
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

        {usuariosError && (
          <div
            role="alert"
            className="mb-5 flex flex-col gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>
              {usuariosError} Los asesores asignados se mostrarán por identificador hasta reintentar.
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0 text-amber-800 hover:bg-amber-100"
              onClick={handleUsuariosRetry}
            >
              Reintentar
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
              <p className="text-slate-600">Cargando leads...</p>
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
              {leads.length} {leads.length === 1 ? 'lead disponible' : 'leads disponibles'}
            </p>
            <Table
              columns={columns}
              data={leads}
              getRowKey={(lead) => lead.id}
              caption="Listado de leads"
              emptyMessage="No hay leads para el filtro seleccionado."
            />
          </>
        )}
      </div>

      <Modal
        isOpen={isDetailOpen}
        onClose={closeDetail}
        title="Detalle del lead"
        size="lg"
        footer={
          <Button variant="ghost" onClick={closeDetail}>
            Cerrar
          </Button>
        }
      >
        {isDetailLoading && (
          <div className="mb-4 flex items-center gap-3 text-sm text-slate-600" role="status">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
            Actualizando detalle...
          </div>
        )}

        {detailError && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {detailError}
          </div>
        )}

        {detailLead && (
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <DetailItem label="ID" fullWidth>
              <span className="font-mono text-xs">{detailLead.id}</span>
            </DetailItem>
            <DetailItem label="Nombre">{detailLead.nombre || '—'}</DetailItem>
            <DetailItem label="Origen">{ORIGEN_LABELS[detailLead.origen]}</DetailItem>
            <DetailItem label="Correo">{detailLead.correo || '—'}</DetailItem>
            <DetailItem label="Teléfono">{detailLead.telefono || '—'}</DetailItem>
            <DetailItem label="Estado">
              <EstadoBadge estado={detailLead.estado} />
            </DetailItem>
            <DetailItem label="Asesor asignado">
              {getAsesorLabel(detailLead.asesor_asignado_id)}
              {detailLead.asesor_asignado_id && (
                <span className="mt-1 block font-mono text-xs text-slate-500">
                  {detailLead.asesor_asignado_id}
                </span>
              )}
            </DetailItem>
            <DetailItem label="Fecha de creación">{formatDate(detailLead.created_at)}</DetailItem>
            <DetailItem label="Última actualización">{formatDate(detailLead.updated_at)}</DetailItem>
          </dl>
        )}
      </Modal>

      <Modal
        isOpen={Boolean(leadToChange)}
        onClose={closeEstado}
        title="Cambiar estado"
        size="sm"
        closeOnBackdrop={!isChangingEstado}
        footer={
          <>
            <Button variant="ghost" onClick={closeEstado} disabled={isChangingEstado}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="change-lead-status-form"
              isLoading={isChangingEstado}
              disabled={!leadToChange || nextEstado === leadToChange.estado}
            >
              Guardar estado
            </Button>
          </>
        }
      >
        <form id="change-lead-status-form" onSubmit={handleEstadoChange}>
          <p className="mb-4 text-sm text-slate-600">
            Selecciona el nuevo estado de{' '}
            <span className="font-semibold text-dark">
              {leadToChange ? getLeadName(leadToChange) : ''}
            </span>
            .
          </p>
          <Select
            label="Estado"
            value={nextEstado}
            onChange={(event) => {
              setNextEstado(event.target.value as LeadEstado)
              setEstadoError('')
            }}
            disabled={isChangingEstado}
            required
          >
            <option value="nuevo">Nuevo</option>
            <option value="contactado">Contactado</option>
            <option value="pago">Pago</option>
            <option value="descartado">Descartado</option>
          </Select>

          {estadoError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {estadoError}
            </div>
          )}
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(leadToAssign)}
        onClose={closeAsignacion}
        title="Asignar asesor"
        size="sm"
        closeOnBackdrop={!isAssigning}
        footer={
          <>
            <Button variant="ghost" onClick={closeAsignacion} disabled={isAssigning}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form="assign-lead-advisor-form"
              isLoading={isAssigning}
              disabled={
                isUsuariosLoading || Boolean(usuariosError) || !selectedAsesorId || isAssigning
              }
            >
              Asignar
            </Button>
          </>
        }
      >
        <form id="assign-lead-advisor-form" onSubmit={handleAsignacion}>
          <p className="mb-4 text-sm text-slate-600">
            Selecciona el responsable del seguimiento de{' '}
            <span className="font-semibold text-dark">
              {leadToAssign ? getLeadName(leadToAssign) : ''}
            </span>
            .
          </p>
          <Select
            label="Asesor"
            value={selectedAsesorId}
            onChange={(event) => {
              setSelectedAsesorId(event.target.value)
              setAsignacionError('')
            }}
            hint={
              isUsuariosLoading
                ? 'Cargando usuarios...'
                : usuariosOrdenados.length === 0 && !usuariosError
                  ? 'No hay usuarios disponibles.'
                  : undefined
            }
            disabled={isAssigning || isUsuariosLoading || Boolean(usuariosError)}
            required
          >
            <option value="">
              {isUsuariosLoading ? 'Cargando...' : 'Selecciona un asesor'}
            </option>
            {usuariosOrdenados.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre} ({ROL_LABELS[usuario.rol]})
                {usuario.estado === 'inactivo' ? ' · Inactivo' : ''}
              </option>
            ))}
          </Select>

          {usuariosError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <p>{usuariosError}</p>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 text-red-700 hover:bg-red-100"
                onClick={handleUsuariosRetry}
              >
                Reintentar
              </Button>
            </div>
          )}

          {asignacionError && (
            <div
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {asignacionError}
            </div>
          )}
        </form>
      </Modal>
    </main>
  )
}
