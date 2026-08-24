import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { FiX } from 'react-icons/fi'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidthClassName?: string
}

/** Contenedor de diálogo genérico (selectores, formularios, detalle) — distinto de
 * ConfirmModal, que es específicamente para confirmaciones sí/no. */
export default function Modal({ isOpen, onClose, title, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true">
      <div className="idema-admin-overlay-in absolute inset-0 bg-[#001F2A]/50" onClick={onClose} aria-hidden />

      <div
        className={`idema-admin-modal-in relative w-full ${maxWidthClassName} max-h-[85vh] overflow-y-auto rounded-[var(--admin-radius-lg)] bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-lg)]`}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 transition-colors hover:bg-[var(--admin-color-bg)]"
            style={{ color: 'var(--admin-color-text-secondary)' }}
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}
