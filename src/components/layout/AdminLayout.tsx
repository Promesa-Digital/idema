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
import {
  Users,
  DollarSign,
  BookOpen,
  Package,
  Percent,
  Image,
  UserPlus,
  UserCheck,
  ShoppingCart,
  FileText,
  CheckSquare,
  BarChart3,
  ListChecks,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../types/auth'
import type { UserRole } from '../../types/auth'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const USUARIOS: NavItem = { label: 'Usuarios', to: '/admin/usuarios', icon: Users }
const CONCEPTOS: NavItem = { label: 'Conceptos de Cobro', to: '/admin/conceptos-cobro', icon: DollarSign }
const PROGRAMAS: NavItem = { label: 'Programas', to: '/admin/programas', icon: BookOpen }
const COMBOS: NavItem = { label: 'Combos', to: '/admin/combos', icon: Package }
const DESCUENTOS: NavItem = { label: 'Descuentos', to: '/admin/descuentos', icon: Percent }
const LEADS: NavItem = { label: 'Leads', to: '/admin/leads', icon: UserPlus }
const POPUPS: NavItem = { label: 'Popups', to: '/admin/popups', icon: Image }
const REPORTES: NavItem = { label: 'Reportes', to: '/admin/reportes', icon: BarChart3 }
const ORDENES: NavItem = { label: 'Órdenes', to: '/admin/ordenes', icon: ShoppingCart }
const COMPROBANTES: NavItem = { label: 'Comprobantes', to: '/admin/comprobantes', icon: FileText }
const CONCILIACIONES: NavItem = { label: 'Conciliaciones', to: '/admin/conciliaciones', icon: CheckSquare }
const CUENTAS_ALUMNOS: NavItem = { label: 'Cuentas de Alumnos', to: '/admin/cuentas-alumnos', icon: UserCheck }
const MATRICULAS: NavItem = { label: 'Matrículas', to: '/admin/matriculas', icon: BookOpen }
const ELECTIVOS: NavItem = { label: 'Electivos', to: '/admin/electivos', icon: ListChecks }

/** Grupos del sidebar por rol. admin_sistema ve todo; el resto solo su área. */
const NAV_GROUPS_BY_ROLE: Partial<Record<UserRole, NavGroup[]>> = {
  admin_sistema: [
    { label: 'GESTIÓN', items: [USUARIOS, CONCEPTOS] },
    { label: 'ACADÉMICO', items: [PROGRAMAS] },
    { label: 'VENTAS', items: [COMBOS, DESCUENTOS, LEADS] },
    { label: 'MARKETING', items: [POPUPS, REPORTES] },
    { label: 'FINANZAS', items: [ORDENES, COMPROBANTES, CONCILIACIONES] },
    { label: 'ALUMNOS', items: [CUENTAS_ALUMNOS] },
  ],
  academico: [
    { label: 'ACADÉMICO', items: [PROGRAMAS, ELECTIVOS] },
  ],
  marketing: [
    { label: 'MARKETING', items: [POPUPS, REPORTES] },
    { label: 'VENTAS', items: [LEADS, COMBOS, DESCUENTOS] },
  ],
  // Mismo set que marketing: además de navegar estas secciones, director_marketing
  // es el único que ve los botones Aprobar/Rechazar dentro de la pantalla de Popups.
  director_marketing: [
    { label: 'MARKETING', items: [POPUPS, REPORTES] },
    { label: 'VENTAS', items: [LEADS, COMBOS, DESCUENTOS] },
  ],
  ventas: [
    { label: 'VENTAS', items: [LEADS, COMBOS, DESCUENTOS] },
  ],
  administracion: [
    { label: 'FINANZAS', items: [ORDENES, COMPROBANTES, CONCILIACIONES, REPORTES] },
    { label: 'ALUMNOS', items: [CUENTAS_ALUMNOS, MATRICULAS, ELECTIVOS] },
  ],
}

/** CTA principal del sidebar por rol — la acción de creación más común de su área. */
const CTA_BY_ROLE: Partial<Record<UserRole, { label: string; to: string }>> = {
  admin_sistema: { label: '+ Nuevo Usuario', to: '/admin/usuarios' },
  academico: { label: '+ Nuevo Programa', to: '/admin/programas/nuevo' },
  marketing: { label: '+ Nuevo Popup', to: '/admin/popups/nuevo' },
  director_marketing: { label: '+ Nuevo Popup', to: '/admin/popups/nuevo' },
  ventas: { label: '+ Nuevo Lead', to: '/admin/leads' },
  administracion: { label: '+ Nueva Conciliación', to: '/admin/conciliaciones' },
}

/** Título de página + (opcional) sección padre, resuelto por ruta. Cubre las
 * sub-rutas nuevo/editar que no aparecen directamente en el sidebar. */
function resolvePageTitle(pathname: string): { title: string; section?: string } {
  const KNOWN: Record<string, string> = {
    '/admin': 'Dashboard',
    '/admin/usuarios': 'Usuarios',
    '/admin/conceptos-cobro': 'Conceptos de Cobro',
    '/admin/programas': 'Programas',
    '/admin/combos': 'Combos',
    '/admin/descuentos': 'Descuentos',
    '/admin/leads': 'Leads',
    '/admin/popups': 'Popups',
    '/admin/reportes': 'Reportes',
    '/admin/ordenes': 'Órdenes',
    '/admin/comprobantes': 'Comprobantes',
    '/admin/conciliaciones': 'Conciliaciones',
    '/admin/cuentas-alumnos': 'Cuentas de Alumnos',
    '/admin/matriculas': 'Matrículas',
    '/admin/electivos': 'Electivos',
  }
  if (KNOWN[pathname]) return { title: KNOWN[pathname] }

  if (pathname === '/admin/programas/nuevo') return { title: 'Nuevo Programa', section: 'Programas' }
  if (pathname === '/admin/popups/nuevo') return { title: 'Nuevo Popup', section: 'Popups' }
  if (/^\/admin\/programas\/.+\/editar$/.test(pathname)) return { title: 'Editar Programa', section: 'Programas' }
  if (/^\/admin\/popups\/.+\/editar$/.test(pathname)) return { title: 'Editar Popup', section: 'Popups' }

  return { title: 'Panel admin' }
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const navGroups = (user && NAV_GROUPS_BY_ROLE[user.role]) ?? []
  const cta = user && CTA_BY_ROLE[user.role]
  const { title, section } = resolvePageTitle(location.pathname)
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
          <p className="mt-0.5 text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Academic Management</p>
        </div>

        {cta && (
          <NavLink
            to={cta.to}
            className="mx-4 mb-2 flex items-center justify-center rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {cta.label}
          </NavLink>
        )}

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p
                className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider uppercase"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
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
            </div>
          ))}
        </nav>

        <div className="border-t px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--color-primary)' }}
              aria-hidden
            >
              {inicial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{user?.nombre ?? 'Usuario'}</p>
              <p className="truncate text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {user ? ROLE_LABELS[user.role] : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 rounded-[var(--radius-sm)] p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="h-[18px] w-[18px]" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col pl-60">
        <header
          className="sticky top-0 z-10 flex h-16 items-center justify-between border-b px-8"
          style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
        >
          <div>
            {section && (
              <p className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {section} <span className="mx-1">/</span> {title}
              </p>
            )}
            <h1
              className="text-lg font-bold"
              style={{ color: 'var(--color-text-main)', fontFamily: 'var(--font-headline)' }}
            >
              {title}
            </h1>
          </div>

          <div className="text-right leading-tight">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-main)' }}>
              {user?.nombre ?? 'Usuario'}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {user ? ROLE_LABELS[user.role] : ''}
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
