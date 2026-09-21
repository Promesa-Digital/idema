import { useEffect, useId, useRef, useState } from 'react'
import { FiChevronDown, FiLogOut } from 'react-icons/fi'
import type { UsuarioBackend } from '@/types/backend'
import { ROLE_LABELS } from './adminModules'

interface AdminUserMenuProps {
  user: UsuarioBackend
  onLogout: () => void
}

/** "Rosa María Quispe" -> "RQ". Con un solo nombre, la primera letra basta. */
function iniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  if (palabras.length === 0) return '?'
  const primera = palabras[0][0]
  const ultima = palabras.length > 1 ? palabras[palabras.length - 1][0] : ''
  return (primera + ultima).toUpperCase()
}

/**
 * Identidad y cierre de sesión, arriba a la derecha.
 *
 * Antes vivían fijos al pie de la barra lateral, donde ocupaban ~120px permanentes:
 * los mismos que le faltaban a la lista de módulos para no cortarse en los roles que
 * ven 15. Aquí ocupan cero y están donde todo el mundo los busca.
 */
export default function AdminUserMenu({ user, onLogout }: AdminUserMenuProps) {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false)
    }
    const alPulsarEscape = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('mousedown', alPulsarFuera)
    document.addEventListener('keydown', alPulsarEscape)
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera)
      document.removeEventListener('keydown', alPulsarEscape)
    }
  }, [abierto])

  return (
    <div ref={contenedor} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? menuId : undefined}
        aria-label={`Cuenta de ${user.nombre}`}
        className="flex min-h-11 items-center gap-2.5 rounded-xl border border-transparent px-2 transition hover:border-slate-200 hover:bg-slate-50 sm:px-3"
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {iniciales(user.nombre)}
        </span>
        <span className="hidden min-w-0 text-left lg:block">
          <span className="block truncate text-sm font-bold text-dark">{user.nombre}</span>
          <span className="block truncate text-xs text-slate-500">{ROLE_LABELS[user.rol]}</span>
        </span>
        <FiChevronDown
          aria-hidden="true"
          className={`hidden shrink-0 text-slate-400 transition sm:block ${abierto ? 'rotate-180' : ''}`}
        />
      </button>

      {abierto && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-bold text-dark">{user.nombre}</p>
            <p className="mt-0.5 truncate text-xs text-slate-500">{user.correo}</p>
            <p className="mt-2 inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
              {ROLE_LABELS[user.rol]}
            </p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setAbierto(false)
              onLogout()
            }}
            className="flex min-h-11 w-full items-center gap-3 px-4 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
          >
            <FiLogOut aria-hidden="true" className="h-4 w-4 shrink-0" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
