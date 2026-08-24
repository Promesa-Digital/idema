import { Helmet } from 'react-helmet-async'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FiBookOpen, FiList, FiCreditCard, FiArrowRight } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { getMatriculas } from '../../api/matriculas'
import { getElectivos } from '../../api/electivos'
import { getOrdenes } from '../../api/ordenes'
import Badge from '../../components/ui/Badge'
import { formatFecha, formatMonto } from '../../utils/format'

const cardClass =
  'rounded-[var(--admin-radius-md)] border bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-sm)]'
const cardBorder = { borderColor: 'var(--admin-color-border)' }

export default function DashboardPage() {
  const { user } = useAuth()

  const { data: matriculas, isLoading: loadingMatriculas } = useQuery({
    queryKey: ['portal', 'matriculas'],
    queryFn: getMatriculas,
  })
  const { data: electivos, isLoading: loadingElectivos } = useQuery({
    queryKey: ['portal', 'electivos'],
    queryFn: getElectivos,
  })
  const { data: ordenes, isLoading: loadingOrdenes } = useQuery({
    queryKey: ['portal', 'ordenes'],
    queryFn: () => getOrdenes(),
  })

  const matriculasActivas = matriculas?.filter((m) => m.estado === 'activa').length ?? 0
  const electivosActivados = electivos?.filter((e) => e.estado !== 'cancelado').length ?? 0
  const ultimaOrden = ordenes
    ? [...ordenes].sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    : undefined

  return (
    <>
      <Helmet>
        <title>Portal - IDEMA</title>
      </Helmet>

      <div className={`${cardClass} mb-6 bg-gradient-to-r from-[var(--admin-color-primary)] to-[var(--admin-color-primary-hover)]`} style={cardBorder}>
        <p className="text-sm font-medium text-white/80">Bienvenido de vuelta</p>
        <h1 className="mt-1 text-2xl font-bold text-white">{user?.nombre ?? 'Alumno'}</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cardClass} style={cardBorder}>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--admin-color-highlight)] p-2.5 text-[var(--admin-color-primary)]">
              <FiBookOpen className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--admin-color-text-secondary)' }}>
              Matrículas activas
            </p>
          </div>
          <p className="mt-4 text-3xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
            {loadingMatriculas ? '—' : matriculasActivas}
          </p>
        </div>

        <div className={cardClass} style={cardBorder}>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--admin-color-highlight)] p-2.5 text-[var(--admin-color-primary)]">
              <FiList className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--admin-color-text-secondary)' }}>
              Electivos activados
            </p>
          </div>
          <p className="mt-4 text-3xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
            {loadingElectivos ? '—' : electivosActivados}
          </p>
        </div>

        <div className={cardClass} style={cardBorder}>
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-[var(--admin-color-highlight)] p-2.5 text-[var(--admin-color-primary)]">
              <FiCreditCard className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium" style={{ color: 'var(--admin-color-text-secondary)' }}>
              Última orden
            </p>
          </div>
          {loadingOrdenes ? (
            <p className="mt-4 text-3xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>—</p>
          ) : ultimaOrden ? (
            <div className="mt-4">
              <p className="text-2xl font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
                {formatMonto(ultimaOrden.monto)}
              </p>
              <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>
                <Badge value={ultimaOrden.estado} />
                <span>{formatFecha(ultimaOrden.created_at)}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>
              Todavía no tienes órdenes.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/portal/matriculas"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--admin-color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-color-primary-hover)]"
        >
          Ir a Mis Matrículas <FiArrowRight />
        </Link>
      </div>
    </>
  )
}
