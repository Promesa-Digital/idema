import { useEffect, useMemo, useState } from 'react'
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiClock, FiCreditCard } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getAvailableAdminModules } from '@/components/admin/adminModules'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/context/AuthContextType'
import { listarComprobantes } from '@/services/comprobantesApi'
import { listarLeads } from '@/services/leadsApi'
import { listarMatriculas } from '@/services/matriculasApi'
import { listarOrdenes } from '@/services/ordenesApi'

interface DashboardMetrics {
  ordenes: number | null
  pagosConfirmados: number | null
  leadsNuevos: number | null
  matriculasPendientes: number | null
  pendientes: number | null
}

const EMPTY_METRICS: DashboardMetrics = {
  ordenes: null,
  pagosConfirmados: null,
  leadsNuevos: null,
  matriculasPendientes: null,
  pendientes: null,
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS)
  const [isLoading, setIsLoading] = useState(true)
  const availableModules = useMemo(
    () => getAvailableAdminModules(user?.rol).filter((module) => module.path !== '/admin'),
    [user?.rol],
  )

  useEffect(() => {
    if (!user) return
    let active = true

    async function loadMetrics() {
      const canReadOrders = ['administracion', 'admin_sistema'].includes(user!.rol)
      const canReadLeads = ['marketing', 'director_marketing', 'ventas', 'administracion', 'admin_sistema'].includes(user!.rol)
      const canReadMatriculas = ['academico', 'administracion', 'admin_sistema'].includes(user!.rol)
      const next = { ...EMPTY_METRICS }
      let pending = 0

      const [ordersResult, leadsResult, matriculasResult, receiptsResult] = await Promise.allSettled([
        canReadOrders ? listarOrdenes() : Promise.resolve(null),
        canReadLeads ? listarLeads() : Promise.resolve(null),
        canReadMatriculas ? listarMatriculas() : Promise.resolve(null),
        canReadOrders ? listarComprobantes() : Promise.resolve(null),
      ])

      if (ordersResult.status === 'fulfilled' && ordersResult.value) {
        next.ordenes = ordersResult.value.length
        next.pagosConfirmados = ordersResult.value.filter((item) => item.estado === 'pagada' || item.estado === 'conciliada').length
        pending += ordersResult.value.filter((item) => item.estado === 'pendiente' || item.estado === 'pendiente_confirmacion').length
      }
      if (leadsResult.status === 'fulfilled' && leadsResult.value) {
        next.leadsNuevos = leadsResult.value.filter((item) => item.estado === 'nuevo').length
        pending += next.leadsNuevos
      }
      if (matriculasResult.status === 'fulfilled' && matriculasResult.value) {
        next.matriculasPendientes = matriculasResult.value.filter((item) => item.estado === 'pendiente').length
        pending += next.matriculasPendientes
      }
      if (receiptsResult.status === 'fulfilled' && receiptsResult.value) {
        pending += receiptsResult.value.filter((item) => item.estado === 'observado').length
      }
      next.pendientes = pending

      if (active) {
        setMetrics(next)
        setIsLoading(false)
      }
    }

    void loadMetrics()
    return () => {
      active = false
    }
  }, [user])

  const cards = [
    { label: 'Órdenes registradas', value: metrics.ordenes, icon: FiCreditCard, color: 'bg-sky-50 text-sky-700' },
    { label: 'Pagos confirmados', value: metrics.pagosConfirmados, icon: FiCheckCircle, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Leads nuevos', value: metrics.leadsNuevos, icon: FiAlertCircle, color: 'bg-fuchsia-50 text-fuchsia-700' },
    { label: 'Matrículas pendientes', value: metrics.matriculasPendientes, icon: FiClock, color: 'bg-amber-50 text-amber-800' },
  ].filter((card) => card.value !== null)

  return (
    <main className="px-4 py-7 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-br from-dark to-deep p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Resumen operativo</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Hola, {user?.nombre}</h2>
            <p className="mt-2 max-w-2xl text-white/70">
              Revisa el estado de la operación y continúa con las tareas de tu área.
            </p>
          </div>
          {metrics.pendientes !== null && (
            <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-wider text-white/60">Pendientes</p>
              <p className="mt-1 text-3xl font-bold">{metrics.pendientes}</p>
            </div>
          )}
        </div>
      </section>

      {isLoading ? (
        <div className="grid min-h-48 place-items-center"><LoadingSpinner /></div>
      ) : cards.length > 0 ? (
        <section aria-label="Indicadores principales" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon
            return (
              <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${card.color}`}><Icon className="h-5 w-5" /></div>
                <p className="mt-5 text-3xl font-bold text-dark">{card.value}</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">{card.label}</p>
              </article>
            )
          })}
        </section>
      ) : null}

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-dark">Módulos disponibles</h2>
          <p className="mt-1 text-sm text-slate-500">Accesos habilitados según tu rol.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {availableModules.map((module) => {
            const Icon = module.icon
            return (
              <Link key={module.path} to={module.path} className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                  <FiArrowRight className="mt-2 text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-4 font-bold text-dark">{module.label}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">{module.description}</p>
              </Link>
            )
          })}
        </div>
      </section>
    </main>
  )
}
