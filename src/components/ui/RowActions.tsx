import { useEffect, useId, useRef, useState } from 'react'
import { FiMoreVertical } from 'react-icons/fi'
import type { ReactNode } from 'react'

export interface AccionFila {
  etiqueta: string
  onSelect: () => void
  icono?: ReactNode
  /** Marca la acción como destructiva: se pinta en rojo dentro del menú. */
  destructiva?: boolean
  disabled?: boolean
}

interface RowActionsProps {
  acciones: AccionFila[]
  /** Texto para lectores de pantalla, para distinguir el menú de una fila del de otra. */
  etiquetaAccesible: string
}

/**
 * Menú de acciones secundarias de una fila.
 *
 * Existe para sacar del primer plano las acciones destructivas: repetir un botón rojo
 * en cada fila hace que el ojo vaya a lo que casi nunca hay que pulsar, y desgasta el
 * rojo hasta que deja de significar peligro.
 */
export default function RowActions({ acciones, etiquetaAccesible }: RowActionsProps) {
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

  if (acciones.length === 0) return null

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? menuId : undefined}
        aria-label={etiquetaAccesible}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 hover:text-dark"
      >
        <FiMoreVertical aria-hidden />
      </button>

      {abierto && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          {acciones.map((accion) => (
            <button
              key={accion.etiqueta}
              type="button"
              role="menuitem"
              disabled={accion.disabled}
              onClick={() => {
                setAbierto(false)
                accion.onSelect()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                accion.destructiva
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {accion.icono}
              {accion.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
