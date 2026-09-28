import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [posicion, setPosicion] = useState({ top: 0, right: 0 })
  const contenedor = useRef<HTMLDivElement>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const menuId = useId()

  /**
   * El menu se dibuja fuera de la tabla, en un portal, y se posiciona a mano.
   *
   * Dentro no cabe: el contenedor de la tabla lleva `overflow-hidden` y el envoltorio
   * `overflow-x-auto`, y los dos recortan a un hijo posicionado en absoluto. Con una o
   * dos filas solo se veian unos pixeles del menu y sus opciones eran inalcanzables.
   */
  useLayoutEffect(() => {
    if (!abierto || !boton.current) return
    const caja = boton.current.getBoundingClientRect()
    setPosicion({ top: caja.bottom + 4, right: window.innerWidth - caja.right })
  }, [abierto])

  // Al desplazar la pagina el menu quedaria flotando lejos de su fila: se cierra.
  useEffect(() => {
    if (!abierto) return
    const cerrar = () => setAbierto(false)
    window.addEventListener('scroll', cerrar, true)
    window.addEventListener('resize', cerrar)
    return () => {
      window.removeEventListener('scroll', cerrar, true)
      window.removeEventListener('resize', cerrar)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return

    const alPulsarFuera = (evento: MouseEvent) => {
      const destino = evento.target as Node
      // El menu vive en un portal, fuera de `contenedor`: si no se comprueba aparte,
      // pulsar una opcion cuenta como "fuera", el menu se desmonta en el mousedown y
      // el clic nunca llega al boton.
      if (contenedor.current?.contains(destino) || menu.current?.contains(destino)) return
      setAbierto(false)
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
        ref={boton}
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

      {abierto &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            role="menu"
            style={{ top: posicion.top, right: posicion.right }}
            className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
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
          </div>,
          document.body,
        )}
    </div>
  )
}
