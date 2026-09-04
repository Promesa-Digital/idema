import { NavLink } from 'react-router-dom'
import type { UsuarioRol } from '@/types/backend'

interface AdminModuleNavProps {
  role?: UsuarioRol
}

export default function AdminModuleNav({ role }: AdminModuleNavProps) {
  if (role !== 'admin_sistema') return null

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `rounded-md px-3 py-1.5 text-sm font-semibold transition ${
      isActive ? 'bg-white text-dark' : 'text-white/80 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav aria-label="Módulos de administración" className="mt-3 flex flex-wrap gap-2">
      <NavLink to="/admin/programas" className={linkClasses}>
        Programas
      </NavLink>
      <NavLink to="/admin/popups" className={linkClasses}>
        Popups
      </NavLink>
    </nav>
  )
}
