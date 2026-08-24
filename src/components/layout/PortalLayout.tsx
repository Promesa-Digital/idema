import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '@fontsource/hanken-grotesk/400.css'
import '@fontsource/hanken-grotesk/500.css'
import '@fontsource/hanken-grotesk/600.css'
import '../../styles/admin.css'

import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Home, BookOpen, List, CreditCard, FileText, User, LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

const PORTAL_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/portal', icon: Home, end: true },
  { label: 'Mis Matrículas', to: '/portal/matriculas', icon: BookOpen },
  { label: 'Mis Electivos', to: '/portal/electivos', icon: List },
  { label: 'Mis Pagos', to: '/portal/pagos', icon: CreditCard },
  { label: 'Mis Comprobantes', to: '/portal/comprobantes', icon: FileText },
  { label: 'Mi Cuenta', to: '/portal/mi-cuenta', icon: User },
]

const PAGE_TITLES: Record<string, string> = {
  '/portal': 'Dashboard',
  '/portal/matriculas': 'Mis Matrículas',
  '/portal/checkout': 'Procesar Pago',
  '/portal/electivos': 'Mis Electivos',
  '/portal/pagos': 'Mis Pagos',
  '/portal/comprobantes': 'Mis Comprobantes',
  '/portal/mi-cuenta': 'Mi Cuenta',
}

export default function PortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const title = PAGE_TITLES[location.pathname] ?? 'Portal del Estudiante'
  const inicial = (user?.nombre ?? '?').charAt(0).toUpperCase()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="idema-admin flex min-h-screen" style={{ fontFamily: 'var(--font-body)' }}>
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col" style={{ backgroundColor: 'var(--color-secondary)' }}>
        <div className="px-6 py-6">
          <p className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-headline)' }}>IDEMA</p>
          <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Portal del Estudiante</p>
        </div>

        <div className="px-6 pb-4">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white"
            style={{ backgroundColor: 'var(--color-primary)' }}
            aria-hidden
          >
            {inicial}
          </span>
          <p className="mt-3 truncate text-sm font-semibold text-white">{user?.nombre ?? 'Alumno'}</p>
          <span
            className="mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
            style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderColor: 'rgba(34,197,94,0.4)', color: '#4ADE80' }}
          >
            Estudiante Activo
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {PORTAL_NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium text-white transition-colors',
                      isActive ? '' : 'hover:bg-white/10',
                    ].join(' ')
                  }
                  style={({ isActive }) => (isActive ? { backgroundColor: 'var(--color-primary)' } : undefined)}
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-60">
        <header
          className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-8"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-headline)' }}>
            {title}
          </h1>

          <div className="text-right leading-tight">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
              {user?.nombre ?? 'Alumno'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Estudiante
            </p>
          </div>
        </header>

        <main className="flex-1 p-8" style={{ backgroundColor: 'var(--color-bg-page)', fontFamily: 'var(--font-body)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
