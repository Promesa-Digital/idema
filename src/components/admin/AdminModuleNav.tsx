import { NavLink } from 'react-router-dom'
import type { UsuarioRol } from '@/types/backend'

interface AdminModuleNavProps {
  role?: UsuarioRol
}

interface AdminModule {
  label: string
  path: string
  allowedRoles: UsuarioRol[]
}

const ADMIN_MODULES: AdminModule[] = [
  {
    label: 'Programas',
    path: '/admin/programas',
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Popups',
    path: '/admin/popups',
    allowedRoles: ['marketing', 'director_marketing', 'admin_sistema'],
  },
  {
    label: 'Combos',
    path: '/admin/combos',
    allowedRoles: ['ventas', 'marketing', 'admin_sistema'],
  },
  {
    label: 'Descuentos',
    path: '/admin/descuentos',
    allowedRoles: ['ventas', 'admin_sistema'],
  },
  {
    label: 'Órdenes',
    path: '/admin/ordenes',
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Comprobantes',
    path: '/admin/comprobantes',
    allowedRoles: ['administracion', 'admin_sistema'],
  },
]

export default function AdminModuleNav({ role }: AdminModuleNavProps) {
  const availableModules = role
    ? ADMIN_MODULES.filter((module) => module.allowedRoles.includes(role))
    : []

  if (availableModules.length === 0) return null

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      isActive ? 'bg-white text-dark' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav aria-label="Módulos de administración" className="mt-3 flex flex-wrap gap-2">
      {availableModules.map((module) => (
        <NavLink key={module.path} to={module.path} className={linkClasses}>
          {module.label}
        </NavLink>
      ))}
    </nav>
  )
}
