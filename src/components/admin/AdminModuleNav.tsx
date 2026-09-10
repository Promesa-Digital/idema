import { NavLink } from 'react-router-dom'
import type { UsuarioRol } from '@/types/backend'
import { getAvailableAdminModules } from './adminModules'

interface AdminModuleNavProps {
  role?: UsuarioRol
  onNavigate?: () => void
}

export default function AdminModuleNav({ role, onNavigate }: AdminModuleNavProps) {
  const availableModules = getAvailableAdminModules(role)

  if (availableModules.length === 0) return null

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav aria-label="Módulos de administración" className="space-y-1.5">
      {availableModules.map((module) => {
        const Icon = module.icon
        return (
          <NavLink
            key={module.path}
            to={module.path}
            end={module.path === '/admin'}
            className={linkClasses}
            onClick={onNavigate}
          >
            <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
            <span>{module.shortLabel}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
