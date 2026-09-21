import { NavLink } from 'react-router-dom'
import { useAdminPendientes } from '@/context/AdminPendientesContextType'
import type { UsuarioRol } from '@/types/backend'
import { getAdminModuleSections } from './adminModules'

interface AdminModuleNavProps {
  role?: UsuarioRol
  onNavigate?: () => void
}

export default function AdminModuleNav({ role, onNavigate }: AdminModuleNavProps) {
  const secciones = getAdminModuleSections(role)
  const { porRuta } = useAdminPendientes()

  if (secciones.length === 0) return null

  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition lg:min-h-10 ${
      isActive
        ? 'bg-primary text-white shadow-lg shadow-primary/20'
        : 'text-white/70 hover:bg-white/10 hover:text-white'
    }`

  return (
    <nav aria-label="Módulos de administración" className="space-y-3">
      {secciones.map((seccion) => (
        <div key={seccion.group} className="space-y-1">
          {seccion.label && (
            <p
              // aria-hidden: el rótulo ya viaja en el aria-label del grupo, y repetirlo
              // obliga al lector de pantalla a oírlo dos veces seguidas.
              aria-hidden="true"
              className="px-3 pt-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-white/35"
            >
              {seccion.label}
            </p>
          )}
          <div role="group" aria-label={seccion.label ?? undefined} className="space-y-1">
            {seccion.modules.map((module) => {
              const Icon = module.icon
              const pendientes = porRuta[module.path]
              return (
                <NavLink
                  key={module.path}
                  to={module.path}
                  end={module.path === '/admin'}
                  className={linkClasses}
                  onClick={onNavigate}
                  // El nombre accesible se arma aquí y no con texto oculto dentro de la
                  // insignia: concatenado, el lector leía "Órdenes de pago3pendientes".
                  aria-label={
                    pendientes ? `${module.label}, ${pendientes} pendientes` : undefined
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                      <span className="flex-1 truncate">{module.label}</span>
                      {pendientes ? (
                        <span
                          aria-hidden="true"
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                            isActive ? 'bg-white/25 text-white' : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {pendientes > 99 ? '99+' : pendientes}
                        </span>
                      ) : null}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      ))}
    </nav>
  )
}
