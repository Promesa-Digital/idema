import { useState } from 'react'
import { FiChevronRight, FiLogOut, FiMenu, FiX } from 'react-icons/fi'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SystemStatusBadge from '@/components/ui/SystemStatusBadge'
import { useAuth } from '@/context/AuthContextType'
import AdminModuleNav from './AdminModuleNav'
import { getAdminModule, ROLE_LABELS } from './adminModules'

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const currentModule = getAdminModule(location.pathname)

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {isMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-dark/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-dark text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-white/10 px-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">IDEMA</p>
            <p className="mt-1 text-lg font-bold">Panel administrativo</p>
          </div>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded-lg text-white/80 hover:bg-white/10 lg:hidden"
            aria-label="Cerrar menú de navegación"
            onClick={() => setIsMenuOpen(false)}
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5">
          <AdminModuleNav role={user?.rol} onNavigate={() => setIsMenuOpen(false)} />
        </div>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 rounded-xl bg-white/5 px-3 py-3">
            <p className="truncate text-sm font-bold">{user?.nombre}</p>
            <p className="mt-0.5 truncate text-xs text-white/60">
              {user ? ROLE_LABELS[user.rol] : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold text-white/75 transition hover:bg-red-500/15 hover:text-red-200"
          >
            <FiLogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="flex min-h-20 items-center gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-dark hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menú de navegación"
              onClick={() => setIsMenuOpen(true)}
            >
              <FiMenu className="h-6 w-6" />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                <span>Panel</span>
                <FiChevronRight aria-hidden="true" />
                <span className="truncate text-primary">{currentModule.label}</span>
              </div>
              <h1 className="mt-1 truncate text-xl font-bold text-dark sm:text-2xl">
                {currentModule.label}
              </h1>
            </div>

            <div className="hidden sm:block">
              <SystemStatusBadge />
            </div>
            <div className="sm:hidden">
              <SystemStatusBadge compact />
            </div>
          </div>
        </header>

        <div className="admin-shell-content min-h-[calc(100vh-5rem)] [&>main]:min-h-0 [&>main]:bg-transparent [&>main>header]:hidden">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
