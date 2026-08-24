import '@fontsource/manrope/400.css'
import '@fontsource/manrope/500.css'
import '@fontsource/manrope/600.css'
import '@fontsource/manrope/700.css'
import '../../styles/admin.css'

import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import type { IconType } from 'react-icons'
import {
  FiUsers,
  FiDollarSign,
  FiBookOpen,
  FiPackage,
  FiPercent,
  FiImage,
  FiUserPlus,
  FiUserCheck,
  FiShoppingCart,
  FiFileText,
  FiCheckSquare,
  FiBarChart2,
  FiLogOut,
} from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../types/auth'
import type { UserRole } from '../../types/auth'

interface NavItem {
  label: string
  to: string
  icon: IconType
}

/** Ítems del sidebar por rol, en el orden pedido. Los que aún no tienen pantalla
 * (todo lo salvo Programas y Popups) quedan igual enlazados a su ruta convencional
 * /admin/<recurso> — hoy caen en el 404 hasta que se construya esa pantalla. */
const ADMIN_NAV_BY_ROLE: Partial<Record<UserRole, NavItem[]>> = {
  admin_sistema: [
    { label: 'Usuarios', to: '/admin/usuarios', icon: FiUsers },
    { label: 'Conceptos de Cobro', to: '/admin/conceptos-cobro', icon: FiDollarSign },
    { label: 'Programas', to: '/admin/programas', icon: FiBookOpen },
    { label: 'Combos', to: '/admin/combos', icon: FiPackage },
    { label: 'Descuentos', to: '/admin/descuentos', icon: FiPercent },
    { label: 'Popups', to: '/admin/popups', icon: FiImage },
    { label: 'Leads', to: '/admin/leads', icon: FiUserPlus },
    { label: 'Cuentas de Alumnos', to: '/admin/cuentas-alumnos', icon: FiUserCheck },
    { label: 'Órdenes', to: '/admin/ordenes', icon: FiShoppingCart },
    { label: 'Comprobantes', to: '/admin/comprobantes', icon: FiFileText },
    { label: 'Conciliaciones', to: '/admin/conciliaciones', icon: FiCheckSquare },
    { label: 'Reportes', to: '/admin/reportes', icon: FiBarChart2 },
  ],
  academico: [
    { label: 'Programas', to: '/admin/programas', icon: FiBookOpen },
  ],
  marketing: [
    { label: 'Popups', to: '/admin/popups', icon: FiImage },
    { label: 'Reportes', to: '/admin/reportes', icon: FiBarChart2 },
  ],
  ventas: [
    { label: 'Leads', to: '/admin/leads', icon: FiUserPlus },
    { label: 'Combos', to: '/admin/combos', icon: FiPackage },
    { label: 'Descuentos', to: '/admin/descuentos', icon: FiPercent },
  ],
  administracion: [
    { label: 'Órdenes', to: '/admin/ordenes', icon: FiShoppingCart },
    { label: 'Comprobantes', to: '/admin/comprobantes', icon: FiFileText },
    { label: 'Conciliaciones', to: '/admin/conciliaciones', icon: FiCheckSquare },
    { label: 'Reportes', to: '/admin/reportes', icon: FiBarChart2 },
  ],
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const navItems = (user && ADMIN_NAV_BY_ROLE[user.role]) ?? []

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
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
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
          <div className="text-right leading-tight">
            <p className="text-sm font-semibold" style={{ color: 'var(--admin-color-text-primary)' }}>
              {user?.nombre ?? 'Usuario'}
            </p>
            <p className="text-xs" style={{ color: 'var(--admin-color-text-secondary)' }}>
              {user ? ROLE_LABELS[user.role] : ''}
            </p>
          </div>
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
