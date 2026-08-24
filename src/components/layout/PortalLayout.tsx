import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '../../styles/admin.css'

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import { FiHome, FiBookOpen, FiList, FiCreditCard, FiFileText, FiUser, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'

interface NavItem {
  label: string
  to: string
  icon: IconType
  end?: boolean
}

const PORTAL_NAV: NavItem[] = [
  { label: 'Dashboard', to: '/portal', icon: FiHome, end: true },
  { label: 'Mis Matrículas', to: '/portal/matriculas', icon: FiBookOpen },
  { label: 'Mis Electivos', to: '/portal/electivos', icon: FiList },
  { label: 'Mis Pagos', to: '/portal/pagos', icon: FiCreditCard },
  { label: 'Mis Comprobantes', to: '/portal/comprobantes', icon: FiFileText },
  { label: 'Mi Cuenta', to: '/portal/mi-cuenta', icon: FiUser },
]

export default function PortalLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="idema-admin flex min-h-screen">
      <aside
        className="fixed inset-y-0 left-0 flex w-60 flex-col bg-[var(--admin-color-surface)] border-r"
        style={{ borderColor: 'var(--admin-color-border)' }}
      >
        <div className="flex items-center gap-2 px-6 py-6">
          <span
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--admin-color-text-primary)' }}
          >
            IDEMA
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
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? '' : 'hover:bg-[var(--admin-color-bg)]',
                    ].join(' ')
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { backgroundColor: 'var(--admin-color-highlight)', color: 'var(--admin-color-primary)' }
                      : { color: 'var(--admin-color-text-secondary)' }
                  }
                >
                  <item.icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="flex flex-1 flex-col pl-60">
        <header
          className="sticky top-0 z-10 flex h-16 items-center justify-end gap-4 border-b bg-[var(--admin-color-surface)] px-6"
          style={{ borderColor: 'var(--admin-color-border)' }}
        >
          <p className="text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
            {user?.nombre ?? 'Alumno'}
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--admin-color-bg)]"
            style={{ color: 'var(--admin-color-text-secondary)' }}
          >
            <FiLogOut aria-hidden />
            Cerrar sesión
          </button>
        </header>

        <main className="flex-1 p-6" style={{ backgroundColor: 'var(--admin-color-bg)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
