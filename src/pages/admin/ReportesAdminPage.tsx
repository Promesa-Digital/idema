import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { useAuth } from '@/context/AuthContextType'
import { REPORTE_LABELS, reportesDeRol, tasaFiable } from '@/utils/reportes'
import type { ReporteTipo } from '@/utils/reportes'
import { ApiError } from '@/services/apiClient'
import { listarPopups } from '@/services/popupsApi'
import {
  consultarReporteLeads,
  consultarReporteOrdenes,
  consultarReportePopups,
  exportarReporteLeads,
  exportarReporteOrdenes,
  exportarReportePopups,
} from '@/services/reportesApi'
import type {
  OrdenPagoEstado,
  OrdenPagoMedioPago,
  PopupBackend,
  LeadOrigen,
  ReporteLeadsBackend,
  ReporteOrdenesBackend,
  ReportePopupsBackend,
  UsuarioRol,
} from '@/types/backend'

interface FormState {
  tipo: ReporteTipo
  fecha_desde: string
  fecha_hasta: string
  estado: OrdenPagoEstado | ''
  medio_pago: OrdenPagoMedioPago | ''
  popup_id: string
  origen: LeadOrigen | ''
}

const ORIGEN_LEAD_LABELS: Record<LeadOrigen, string> = {
  formulario: 'Formulario del sitio',
  popup: 'Popup',
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
    // El primero de los que puede ver: Administración entra al dinero, Ventas y
    // Marketing a los leads. Sin rol, leads, que es el reporte más común.
    tipo: reportesDeRol(role)[0] ?? 'leads',
    fecha_desde: inputDate(monthAgo),
    fecha_hasta: inputDate(today),
    estado: '',
    medio_pago: '',
    popup_id: '',
    origen: '',
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No se pudo generar el reporte.'
}

/** "2026-09-22" -> "22/09/2026". Sin hora: la fila es un día entero, no un instante. */
function formatDia(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-')
  return year && month && day ? `${day}/${month}/${year}` : value
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
  const [leadReport, setLeadReport] = useState<ReporteLeadsBackend | null>(null)
  const [popupReport, setPopupReport] = useState<ReportePopupsBackend | null>(null)
  const [orderReport, setOrderReport] = useState<ReporteOrdenesBackend | null>(null)
  const [popups, setPopups] = useState<PopupBackend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  // Antes solo el administrador del sistema podía cambiar de reporte, así que Marketing
  // se quedaba encerrado en la analítica de popups y nunca veía sus leads.
  const reportesDisponibles = reportesDeRol(user?.rol)
  const canChooseType = reportesDisponibles.length > 1

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

    const rango = { fecha_desde: applied.fecha_desde, fecha_hasta: applied.fecha_hasta }
    const request =
      applied.tipo === 'leads'
        ? consultarReporteLeads({ ...rango, origen: applied.origen || undefined })
        : applied.tipo === 'popups'
          ? consultarReportePopups({ ...rango, popup_id: applied.popup_id || undefined })
          : consultarReporteOrdenes({
              ...rango,
              estado: applied.estado || undefined,
              medio_pago: applied.medio_pago || undefined,
            })

    request
      .then((data) => {
        if (!active) return
        if (applied.tipo === 'leads') {
          setLeadReport(data as ReporteLeadsBackend)
        } else if (applied.tipo === 'popups') {
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
      const rango = { fecha_desde: applied.fecha_desde, fecha_hasta: applied.fecha_hasta }
      if (applied.tipo === 'leads') {
        const blob = await exportarReporteLeads({ ...rango, origen: applied.origen || undefined })
        saveBlob(blob, 'reporte-leads.csv')
      } else if (applied.tipo === 'popups') {
        const blob = await exportarReportePopups({
          ...rango,
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
              {reportesDisponibles.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {REPORTE_LABELS[tipo]}
                </option>
              ))}
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
          {form.tipo === 'leads' && (
            <Select
              label="Origen"
              value={form.origen}
              onChange={(event) =>
                setForm((current) => ({ ...current, origen: event.target.value as LeadOrigen | '' }))
              }
            >
              <option value="">Todos los orígenes</option>
              <option value="formulario">Formulario del sitio</option>
              <option value="popup">Popup</option>
            </Select>
          )}
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
                {applied.tipo === 'leads'
                  ? 'Leads captados'
                  : applied.tipo === 'popups'
                    ? 'Analítica de popups'
                    : 'Reporte contable de órdenes'}
              </h2>
              <Button variant="secondary" isLoading={isExporting} onClick={() => void handleExport()}>
                Exportar CSV
              </Button>
            </div>
            {applied.tipo === 'leads' && leadReport && (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Leads captados" value={leadReport.resumen.total} />
                  <SummaryCard label="Sin atender" value={leadReport.resumen.nuevos} />
                  {/* Atención mide al equipo y conversión mide la campaña: un lead sin
                      tocar no es culpa del formulario que lo trajo. */}
                  <SummaryCard
                    label="Atendidos"
                    value={tasaFiable(leadReport.resumen.tasa_atencion, leadReport.resumen.total)}
                  />
                  <SummaryCard
                    label="Llegaron a pago"
                    value={tasaFiable(leadReport.resumen.tasa_conversion, leadReport.resumen.total)}
                  />
                </div>

                {leadReport.por_origen.length > 0 && (
                  <div className="mb-5 grid gap-4 sm:grid-cols-2">
                    {leadReport.por_origen.map((fila) => (
                      <div
                        key={fila.origen}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {ORIGEN_LEAD_LABELS[fila.origen]}
                        </p>
                        <p className="mt-1 text-2xl font-bold text-dark">{fila.total}</p>
                        <p className="mt-0.5 text-sm text-slate-500">
                          {fila.pago} llegaron a pago ·{' '}
                          {tasaFiable(fila.tasa_conversion, fila.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                  <table className="min-w-full text-left text-sm">
                    <caption className="sr-only">Leads captados por día</caption>
                    <thead className="bg-dark text-white">
                      <tr>
                        <th className="px-4 py-3">Fecha</th>
                        <th className="px-4 py-3">Total</th>
                        <th className="px-4 py-3">Sin atender</th>
                        <th className="px-4 py-3">Contactados</th>
                        <th className="px-4 py-3">Pago</th>
                        <th className="px-4 py-3">Descartados</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {leadReport.items.map((item) => (
                        <tr key={item.fecha}>
                          <td className="whitespace-nowrap px-4 py-3">{formatDia(item.fecha)}</td>
                          <td className="px-4 py-3 font-semibold text-dark">{item.total}</td>
                          <td className="px-4 py-3">
                            {item.nuevos > 0 ? (
                              <span className="font-semibold text-amber-700">{item.nuevos}</span>
                            ) : (
                              item.nuevos
                            )}
                          </td>
                          <td className="px-4 py-3">{item.contactados}</td>
                          <td className="px-4 py-3">{item.pago}</td>
                          <td className="px-4 py-3">{item.descartados}</td>
                        </tr>
                      ))}
                      {leadReport.items.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                            No entró ningún lead en este periodo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            {applied.tipo === 'popups' && popupReport && (
              <>
                <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <SummaryCard label="Popups" value={popupReport.resumen.total_popups} />
                  <SummaryCard label="Vistas" value={popupReport.resumen.vistas} />
                  <SummaryCard label="Clics" value={popupReport.resumen.clics} />
                  <SummaryCard
                    label="Tasa de clics"
                    value={tasaFiable(popupReport.resumen.tasa_clics, popupReport.resumen.vistas)}
                  />
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
                          <td className="px-4 py-3">{tasaFiable(item.tasa_clics, item.vistas)}</td>
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
