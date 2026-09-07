import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import AdminModuleNav from '@/components/admin/AdminModuleNav'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContextType'
import { ApiError } from '@/services/apiClient'
import { listarPopups } from '@/services/popupsApi'
import {
  consultarReporteOrdenes,
  consultarReportePopups,
  exportarReporteOrdenes,
  exportarReportePopups,
} from '@/services/reportesApi'
import type {
  OrdenPagoEstado,
  OrdenPagoMedioPago,
  PopupBackend,
  ReporteOrdenesBackend,
  ReportePopupsBackend,
  UsuarioRol,
} from '@/types/backend'

type ReporteTipo = 'popups' | 'ordenes'

interface FormState {
  tipo: ReporteTipo
  fecha_desde: string
  fecha_hasta: string
  estado: OrdenPagoEstado | ''
  medio_pago: OrdenPagoMedioPago | ''
  popup_id: string
}

const ROL_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Director de marketing',
  ventas: 'Ventas',
  academico: 'Académico',
  administracion: 'Administración',
  admin_sistema: 'Administrador del sistema',
}

const ESTADO_LABELS: Record<OrdenPagoEstado, string> = {
  pendiente: 'Pendiente',
  pagada: 'Pagada',
  fallida: 'Fallida',
  anulada: 'Anulada',
  conciliada: 'Conciliada',
  pendiente_confirmacion: 'Pendiente de confirmación',
}

const MEDIO_LABELS: Record<OrdenPagoMedioPago, string> = {
  tarjeta: 'Tarjeta',
  yape: 'Yape',
  transferencia: 'Transferencia',
}

const ESTADO_BADGES = {
  pendiente: 'amber',
  pagada: 'emerald',
  fallida: 'red',
  anulada: 'red',
  conciliada: 'sky',
  pendiente_confirmacion: 'amber',
} as const

const DATE_FORMATTER = new Intl.DateTimeFormat('es-PE', {
  dateStyle: 'medium',
  timeStyle: 'short',
})

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
})

function inputDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function createInitialForm(role?: UsuarioRol): FormState {
  const today = new Date()
  const monthAgo = new Date(today)
  monthAgo.setDate(today.getDate() - 29)
  return {
    tipo: role === 'administracion' ? 'ordenes' : 'popups',
    fecha_desde: inputDate(monthAgo),
    fecha_hasta: inputDate(today),
    estado: '',
    medio_pago: '',
    popup_id: '',
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo generar el reporte.'
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : DATE_FORMATTER.format(date)
}

function formatCurrency(value: string): string {
  const amount = Number(value)
  return Number.isFinite(amount) ? CURRENCY_FORMATTER.format(amount) : `S/ ${value}`
}

function shortText(value: string): string {
  return value.length > 72 ? `${value.slice(0, 72)}…` : value
}

function SummaryCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-dark">{value}</p>
    </div>
  )
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export default function ReportesAdminPage() {
  const { user, logout } = useAuth()
  const [form, setForm] = useState<FormState>(() => createInitialForm(user?.rol))
  const [applied, setApplied] = useState<FormState>(() => createInitialForm(user?.rol))
  const [popupReport, setPopupReport] = useState<ReportePopupsBackend | null>(null)
  const [orderReport, setOrderReport] = useState<ReporteOrdenesBackend | null>(null)
  const [popups, setPopups] = useState<PopupBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  const canChooseType = user?.rol === 'admin_sistema'

  useEffect(() => {
    if (user?.rol === 'administracion') return
    let active = true
    listarPopups()
      .then((data) => {
        if (active) setPopups(data)
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof ApiError && requestError.status === 401) logout()
      })
    return () => {
      active = false
    }
  }, [logout, user?.rol])

  useEffect(() => {
    let active = true

    const request =
      applied.tipo === 'popups'
        ? consultarReportePopups({
            fecha_desde: applied.fecha_desde,
            fecha_hasta: applied.fecha_hasta,
            popup_id: applied.popup_id || undefined,
          })
        : consultarReporteOrdenes({
            fecha_desde: applied.fecha_desde,
            fecha_hasta: applied.fecha_hasta,
            estado: applied.estado || undefined,
            medio_pago: applied.medio_pago || undefined,
          })

    request
      .then((data) => {
        if (!active) return
        if (applied.tipo === 'popups') {
          setPopupReport(data as ReportePopupsBackend)
        } else {
          setOrderReport(data as ReporteOrdenesBackend)
        }
      })
      .catch((requestError: unknown) => {
        if (!active) return
        if (requestError instanceof ApiError && requestError.status === 401) {
          logout()
          return
        }
        setError(getErrorMessage(requestError))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [applied, logout])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (form.fecha_desde > form.fecha_hasta) {
      setError('La fecha desde no puede ser posterior a la fecha hasta.')
      return
    }
    setIsLoading(true)
    setError('')
    setApplied({ ...form })
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError('')
    try {
      if (applied.tipo === 'popups') {
        const blob = await exportarReportePopups({
          fecha_desde: applied.fecha_desde,
          fecha_hasta: applied.fecha_hasta,
          popup_id: applied.popup_id || undefined,
        })
        saveBlob(blob, 'reporte-popups.csv')
      } else {
        const blob = await exportarReporteOrdenes({
          fecha_desde: applied.fecha_desde,
          fecha_hasta: applied.fecha_hasta,
          estado: applied.estado || undefined,
          medio_pago: applied.medio_pago || undefined,
        })
        saveBlob(blob, 'reporte-ordenes-contabilidad.csv')
      }
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        logout()
        return
      }
      setError(getErrorMessage(requestError))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <main className="min-h-screen bg-surface">
      <header className="border-b border-white/10 bg-dark text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">IDEMA Admin</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Gestión de Reportes</h1>
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
        <form
          onSubmit={handleSubmit}
          className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-5"
        >
          {canChooseType && (
            <Select
              label="Tipo de reporte"
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({ ...current, tipo: event.target.value as ReporteTipo }))
              }
            >
              <option value="popups">Analítica de popups</option>
              <option value="ordenes">Exportación de órdenes</option>
            </Select>
          )}
          <Input
            label="Fecha desde"
            type="date"
            required
            value={form.fecha_desde}
            onChange={(event) =>
              setForm((current) => ({ ...current, fecha_desde: event.target.value }))
            }
          />
          <Input
            label="Fecha hasta"
            type="date"
            required
            value={form.fecha_hasta}
            onChange={(event) =>
              setForm((current) => ({ ...current, fecha_hasta: event.target.value }))
            }
          />
          {form.tipo === 'popups' && (
            <Select
              label="Popup"
              value={form.popup_id}
              onChange={(event) =>
                setForm((current) => ({ ...current, popup_id: event.target.value }))
              }
            >
              <option value="">Todos</option>
              {popups.map((popup) => (
                <option key={popup.id} value={popup.id}>
                  {shortText(popup.texto)}
                </option>
              ))}
            </Select>
          )}
          {form.tipo === 'ordenes' && (
            <>
              <Select
                label="Estado"
                value={form.estado}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    estado: event.target.value as OrdenPagoEstado | '',
                  }))
                }
              >
                <option value="">Todos</option>
                {Object.entries(ESTADO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
              <Select
                label="Medio de pago"
                value={form.medio_pago}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    medio_pago: event.target.value as OrdenPagoMedioPago | '',
                  }))
                }
              >
                <option value="">Todos</option>
                {Object.entries(MEDIO_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </>
          )}
          <div className="flex items-end">
            <Button type="submit" fullWidth>Consultar</Button>
          </div>
        </form>

        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </p>
        )}

        {isLoading ? (
          <div className="grid min-h-72 place-items-center rounded-xl border border-slate-200 bg-white">
            <p className="text-slate-600">Generando reporte...</p>
          </div>
        ) : (
          <section aria-live="polite">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold text-dark">
                {applied.tipo === 'popups' ? 'Analítica de popups' : 'Reporte contable de órdenes'}
              </h2>
              <Button variant="secondary" isLoading={isExporting} onClick={() => void handleExport()}>
                Exportar CSV
              </Button>
            </div>
            {applied.tipo === 'popups' && popupReport && (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Popups" value={popupReport.resumen.total_popups} />
                  <SummaryCard label="Vistas" value={popupReport.resumen.vistas} />
                  <SummaryCard label="Clics" value={popupReport.resumen.clics} />
                  <SummaryCard label="Tasa de clics" value={`${popupReport.resumen.tasa_clics}%`} />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <caption className="sr-only">Resultados de analítica de popups</caption>
                    <thead className="bg-dark text-white">
                      <tr>
                        <th className="px-4 py-3">Popup</th>
                        <th className="px-4 py-3">Tipo</th>
                        <th className="px-4 py-3">Vistas</th>
                        <th className="px-4 py-3">Clics</th>
                        <th className="px-4 py-3">Tasa de clics</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {popupReport.items.map((item) => (
                        <tr key={item.popup_id}>
                          <td className="max-w-md px-4 py-3" title={item.texto}>{shortText(item.texto)}</td>
                          <td className="px-4 py-3 capitalize">{item.tipo}</td>
                          <td className="px-4 py-3">{item.vistas}</td>
                          <td className="px-4 py-3">{item.clics}</td>
                          <td className="px-4 py-3">{item.tasa_clics}%</td>
                        </tr>
                      ))}
                      {popupReport.items.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500">No hay popups para mostrar.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {applied.tipo === 'ordenes' && orderReport && (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-3">
                  <SummaryCard label="Órdenes" value={orderReport.resumen.total_ordenes} />
                  <SummaryCard label="Monto total" value={formatCurrency(orderReport.resumen.monto_total)} />
                  <SummaryCard label="Monto confirmado" value={formatCurrency(orderReport.resumen.monto_confirmado)} />
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <caption className="sr-only">Resultados del reporte de órdenes</caption>
                    <thead className="bg-dark text-white">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Alumno</th>
                        <th className="px-4 py-3">Concepto</th>
                        <th className="px-4 py-3">Medio</th>
                        <th className="px-4 py-3">Estado</th>
                        <th className="px-4 py-3">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {orderReport.items.map((item) => (
                        <tr key={item.orden_id}>
                          <td className="whitespace-nowrap px-4 py-3">{formatDate(item.fecha)}</td>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-dark">{item.alumno}</p>
                            <p className="text-xs text-slate-500">{item.dni}</p>
                          </td>
                          <td className="px-4 py-3">{item.concepto}</td>
                          <td className="px-4 py-3">{MEDIO_LABELS[item.medio_pago]}</td>
                          <td className="px-4 py-3"><Badge variant={ESTADO_BADGES[item.estado]}>{ESTADO_LABELS[item.estado]}</Badge></td>
                          <td className="whitespace-nowrap px-4 py-3 font-semibold text-dark">{formatCurrency(item.monto)}</td>
                        </tr>
                      ))}
                      {orderReport.items.length === 0 && (
                        <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No hay órdenes para el periodo seleccionado.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
