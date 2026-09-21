import { useState } from 'react'
import { FiMenu, FiX } from 'react-icons/fi'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import SystemStatusBadge from '@/components/ui/SystemStatusBadge'
import ToastContainer from '@/components/ui/ToastContainer'
import { AdminPendientesProvider } from '@/context/AdminPendientesContext'
import { useAuth } from '@/context/AuthContextType'
import AdminModuleNav from './AdminModuleNav'
import AdminUserMenu from './AdminUserMenu'
import { getAdminModule } from './adminModules'

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
    <AdminPendientesProvider role={user?.rol}>
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

          {/* La barra ya no lleva pie: la identidad y el cierre de sesión se mudaron a la
              cabecera para devolverle a la lista los ~120px que la hacían cortarse. */}
          <div
            // Barra de scroll siempre visible cuando la lista desborda: el problema anterior
            // no era el scroll sino que nada avisaba de que quedaban módulos debajo.
            className="flex-1 overflow-y-auto px-4 py-4 [scrollbar-color:rgba(255,255,255,0.2)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1.5"
          >
            <AdminModuleNav role={user?.rol} onNavigate={() => setIsMenuOpen(false)} />
          </div>
        </aside>

        <div className="lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="flex min-h-20 items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
              <button
                type="button"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200 text-dark hover:bg-slate-50 lg:hidden"
                aria-label="Abrir menú de navegación"
                onClick={() => setIsMenuOpen(true)}
              >
                <FiMenu className="h-6 w-6" />
              </button>

              {/* Sin miga de pan: tenía dos niveles y el segundo repetía este mismo título. */}
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-xl font-bold text-dark sm:text-2xl">
                  {currentModule.label}
                </h1>
                <p className="mt-0.5 hidden truncate text-sm text-slate-500 sm:block">
                  {currentModule.description}
                </p>
              </div>

              <div className="hidden sm:block">
                <SystemStatusBadge />
              </div>
              <div className="sm:hidden">
                <SystemStatusBadge compact />
              </div>

              {user && (
                <>
                  <span aria-hidden="true" className="hidden h-9 w-px bg-slate-200 sm:block" />
                  <AdminUserMenu user={user} onLogout={handleLogout} />
                </>
              )}
            </div>
          </header>

          <div className="admin-shell-content min-h-[calc(100vh-5rem)] [&>main]:min-h-0 [&>main]:bg-transparent [&>main>header]:hidden">
            <Outlet />
          </div>
        </div>

        {/* El ToastProvider envuelve toda la app, pero hasta ahora solo el layout público
            montaba el contenedor: en el panel los avisos se creaban y nunca se veían. */}
        <ToastContainer offsetClassName="top-24" />
      </div>
    </AdminPendientesProvider>
  )
}
