import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  FiAlertTriangle,
  FiArrowRight,
  FiCheck,
  FiCheckCircle,
  FiCreditCard,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getAdminModule, getAvailableAdminModules } from '@/components/admin/adminModules'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { describirPendientes, useAdminPendientes } from '@/context/AdminPendientesContextType'
import { useAuth } from '@/context/AuthContextType'
import { listarCombosAdmin } from '@/services/combosApi'
import { listarConceptos } from '@/services/conceptosApi'
import { listarDescuentos } from '@/services/descuentosApi'
import { listarOrdenes } from '@/services/ordenesApi'
import { listarPopups } from '@/services/popupsApi'
import { detectarAvisos } from '@/utils/avisos'
import type { AvisoPanel, DatosAvisos } from '@/utils/avisos'
import { formatMonto } from '@/utils/conceptoCobro'

/** Rutas desde las que se empieza algo, para el bloque de accesos rápidos. */
const ATAJOS: { ruta: string; etiqueta: string }[] = [
  { ruta: '/admin/programas', etiqueta: 'Nuevo programa' },
  { ruta: '/admin/popups', etiqueta: 'Nuevo popup' },
  { ruta: '/admin/combos', etiqueta: 'Nuevo combo' },
  { ruta: '/admin/descuentos', etiqueta: 'Nuevo descuento' },
]

interface TotalesOrdenes {
  registradas: number
  pagadas: number
  cobrado: number
}

function saludo(hora: number): string {
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

export default function AdminDashboardPage() {
  const { user } = useAuth()
  const { porRuta, total, cargando, refrescar } = useAdminPendientes()
  const [ordenes, setOrdenes] = useState<TotalesOrdenes | null>(null)
  const [avisos, setAvisos] = useState<AvisoPanel[]>([])
  const [revisando, setRevisando] = useState(true)
  const [recarga, setRecarga] = useState(0)

  const rutasVisibles = useMemo(
    () => new Set(getAvailableAdminModules(user?.rol).map((modulo) => modulo.path)),
    [user?.rol],
  )

  const puedeVerOrdenes = rutasVisibles.has('/admin/ordenes')

  useEffect(() => {
    if (!user) return
    let vigente = true

    // Cada lista se pide solo si el rol ve ese módulo, y un fallo aislado no tumba el
    // resto: el panel con tres de cuatro avisos sigue siendo más útil que sin ninguno.
    const pedir = <T,>(puede: boolean, promesa: () => Promise<T[]>): Promise<T[] | undefined> =>
      puede ? promesa().catch(() => undefined) : Promise.resolve(undefined)

    void Promise.all([
      pedir(rutasVisibles.has('/admin/conceptos-cobro'), listarConceptos),
      pedir(rutasVisibles.has('/admin/popups'), () => listarPopups()),
      pedir(rutasVisibles.has('/admin/combos'), listarCombosAdmin),
      pedir(rutasVisibles.has('/admin/descuentos'), () => listarDescuentos()),
      pedir(puedeVerOrdenes, () => listarOrdenes()),
    ]).then(([conceptos, popups, combos, descuentos, listaOrdenes]) => {
      if (!vigente) return

      const datos: DatosAvisos = { conceptos, popups, combos, descuentos }
      setAvisos(detectarAvisos(datos))

      setOrdenes(
        listaOrdenes
          ? {
              registradas: listaOrdenes.length,
              pagadas: listaOrdenes.filter(
                (orden) => orden.estado === 'pagada' || orden.estado === 'conciliada',
              ).length,
              cobrado: listaOrdenes
                .filter((orden) => orden.estado === 'pagada' || orden.estado === 'conciliada')
                // `|| 0`: un monto ilegible suma cero en vez de convertir el total
                // entero en "S/ NaN".
                .reduce((suma, orden) => suma + (Number(orden.monto) || 0), 0),
            }
          : null,
      )
      setRevisando(false)
    })

    return () => {
      vigente = false
    }
  }, [puedeVerOrdenes, recarga, rutasVisibles, user])

  const actualizar = useCallback(() => {
    setRevisando(true)
    setRecarga((valor) => valor + 1)
    refrescar()
  }, [refrescar])

  /** Módulos con trabajo esperando, de más volumen a menos. */
  const atencion = useMemo(
    () =>
      Object.entries(porRuta)
        .sort(([, a], [, b]) => b - a)
        .map(([ruta, cantidad]) => ({ ruta, cantidad, modulo: getAdminModule(ruta) })),
    [porRuta],
  )

  const atajos = useMemo(
    () => ATAJOS.filter((atajo) => rutasVisibles.has(atajo.ruta)),
    [rutasVisibles],
  )

  const ocupado = cargando || revisando

  return (
    <main className="px-4 py-7 sm:px-6 lg:px-8">
      <section className="rounded-2xl bg-gradient-to-br from-dark to-deep p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
            {new Date().toLocaleDateString('es-PE', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <button
            type="button"
            onClick={actualizar}
            disabled={ocupado}
            className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/20 px-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
          >
            <FiRefreshCw aria-hidden="true" className={ocupado ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>

        <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              {saludo(new Date().getHours())}, {user?.nombre}
            </h2>
            <p className="mt-2 max-w-2xl text-white/70">
              {ocupado
                ? 'Revisando tus módulos…'
                : total === 0 && avisos.length === 0
                  ? 'No hay nada esperando una decisión tuya ni nada mal configurado.'
                  : [
                      total > 0 && `${total} ${total === 1 ? 'asunto' : 'asuntos'} por resolver`,
                      avisos.length > 0 &&
                        `${avisos.length} ${avisos.length === 1 ? 'aviso' : 'avisos'} de configuración`,
                    ]
                      .filter(Boolean)
                      .join(' y ') + '.'}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-white/60">Pendientes</p>
            <p className="mt-1 text-3xl font-bold">{cargando ? '—' : total}</p>
          </div>
        </div>

        {atajos.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5">
            {atajos.map((atajo) => (
              <Link
                key={atajo.ruta}
                to={atajo.ruta}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/10 px-3 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                <FiPlus aria-hidden="true" />
                {atajo.etiqueta}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Avisos antes que pendientes: un pendiente lo ve quien abre el módulo, pero un
          combo sin precio parece correcto en su tabla y no lo descubre nadie. */}
      {!revisando && avisos.length > 0 && (
        <section className="mt-6" aria-label="Avisos de configuración">
          <h2 className="text-xl font-bold text-dark">Revisa esto</h2>
          <p className="mt-1 text-sm text-slate-500">
            Nadie está esperando, pero mientras siga así algo no se cobra o no se muestra.
          </p>
          <ul className="mt-4 space-y-3">
            {avisos.map((aviso) => (
              <li key={aviso.id}>
                <Link
                  to={aviso.ruta}
                  className="group flex items-center gap-4 rounded-2xl border border-amber-200 bg-amber-50/60 px-5 py-4 transition hover:border-amber-300 hover:bg-amber-50"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <FiAlertTriangle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-amber-900">{aviso.titulo}</span>
                    <span className="block text-sm text-amber-800/80">{aviso.consecuencia}</span>
                  </span>
                  <FiArrowRight
                    aria-hidden="true"
                    className="shrink-0 text-amber-500 transition group-hover:translate-x-1"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

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
        <section aria-label="Totales de cobranza" className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: 'Órdenes registradas',
              value: String(ordenes.registradas),
              icon: FiCreditCard,
              color: 'bg-sky-50 text-sky-700',
            },
            {
              label: 'Pagos confirmados',
              value: String(ordenes.pagadas),
              icon: FiCheckCircle,
              color: 'bg-emerald-50 text-emerald-700',
            },
            {
              label: 'Cobrado',
              value: formatMonto(String(ordenes.cobrado)),
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
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${card.color}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-2xl font-bold text-dark">{card.value}</p>
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
