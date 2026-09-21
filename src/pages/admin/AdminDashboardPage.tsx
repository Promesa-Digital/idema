import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiCheck, FiCheckCircle, FiCreditCard } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getAdminModule } from '@/components/admin/adminModules'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  describirPendientes,
  useAdminPendientes,
} from '@/context/AdminPendientesContextType'
import { useAuth } from '@/context/AuthContextType'
import { listarOrdenes } from '@/services/ordenesApi'

interface TotalesOrdenes {
  registradas: number
  pagadas: number
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { porRuta, total, cargando } = useAdminPendientes()
  const [ordenes, setOrdenes] = useState<TotalesOrdenes | null>(null)

  // Solo Órdenes: los demás totales que se mostraban aquí ya los cuenta el contexto de
  // pendientes, y pedirlos otra vez era repetir cuatro llamadas en cada entrada al panel.
  const puedeVerOrdenes = user
    ? (['administracion', 'admin_sistema'] as const).some((r) => r === user.rol)
    : false

  useEffect(() => {
    if (!puedeVerOrdenes) return
    let vigente = true

    void listarOrdenes()
      .then((lista) => {
        if (!vigente) return
        setOrdenes({
          registradas: lista.length,
          pagadas: lista.filter((o) => o.estado === 'pagada' || o.estado === 'conciliada').length,
        })
      })
      .catch(() => {
        // Sin totales de órdenes el panel sigue siendo útil: no se muestra la tira y ya.
      })

    return () => {
      vigente = false
    }
  }, [puedeVerOrdenes])

  /** Módulos con trabajo esperando, de más urgente a menos. */
  const atencion = useMemo(
    () =>
      Object.entries(porRuta)
        .sort(([, a], [, b]) => b - a)
        .map(([ruta, cantidad]) => ({ ruta, cantidad, modulo: getAdminModule(ruta) })),
    [porRuta],
  )

  return (
    <main className="px-4 py-7 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-br from-dark to-deep p-6 text-white shadow-xl sm:p-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">Resumen operativo</p>
        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Hola, {user?.nombre}</h2>
            <p className="mt-2 max-w-2xl text-white/70">
              {cargando
                ? 'Revisando qué quedó pendiente en tus módulos…'
                : total > 0
                  ? `Tienes ${total} ${total === 1 ? 'asunto' : 'asuntos'} esperando una decisión tuya.`
                  : 'No hay nada esperando una decisión tuya en este momento.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Pendientes</p>
            <p className="mt-1 text-3xl font-bold">{cargando ? '—' : total}</p>
          </div>
        </div>
      </section>

      <section className="mt-6" aria-label="Requiere tu atención">
        <h2 className="text-xl font-bold text-dark">Requiere tu atención</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ordenado por volumen. Cada fila abre el módulo donde se resuelve.
        </p>

        {cargando ? (
          <div className="mt-4 grid min-h-40 place-items-center rounded-2xl border border-slate-200 bg-white">
            <LoadingSpinner />
          </div>
        ) : atencion.length === 0 ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <FiCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="font-bold text-emerald-900">Todo al día</p>
              <p className="mt-0.5 text-sm text-emerald-800/80">
                Ningún módulo de tu área tiene trabajo esperando.
              </p>
            </div>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {atencion.map(({ ruta, cantidad, modulo }) => {
              const Icon = modulo.icon
              return (
                <li key={ruta}>
                  <Link
                    to={ruta}
                    className="group flex min-h-16 items-center gap-4 px-5 transition hover:bg-primary/5"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-bold text-dark">{modulo.label}</span>
                      <span className="block truncate text-sm text-slate-500">
                        {describirPendientes(ruta, cantidad)}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-bold tabular-nums text-primary">
                      {cantidad}
                    </span>
                    <FiArrowRight
                      aria-hidden="true"
                      className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {ordenes && (
        <section aria-label="Totales de cobranza" className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: 'Órdenes registradas',
              value: ordenes.registradas,
              icon: FiCreditCard,
              color: 'bg-sky-50 text-sky-700',
            },
            {
              label: 'Pagos confirmados',
              value: ordenes.pagadas,
              icon: FiCheckCircle,
              color: 'bg-emerald-50 text-emerald-700',
            },
          ].map((card) => {
            const Icon = card.icon
            return (
              <article
                key={card.label}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.color}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-dark">{card.value}</p>
                  <p className="mt-0.5 text-sm font-semibold text-slate-500">{card.label}</p>
                </div>
              </article>
            )
          })}
        </section>
      )}
    </main>
  )
}
