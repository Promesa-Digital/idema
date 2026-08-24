import { useEffect } from 'react'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'destructive'
  confirmLabel?: string
  cancelLabel?: string
  isConfirming?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  isConfirming = false,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const confirmClasses =
    variant === 'destructive'
      ? 'bg-red-600 hover:bg-red-700 text-white'
      : 'bg-[var(--admin-color-primary)] hover:bg-[var(--admin-color-primary-hover)] text-white'

  return (
    // Sin la clase `.idema-admin` aquí: ese selector fija su propio `background`
    // opaco, lo que taparía la página real detrás del overlay oscuro. Los tokens
    // (--admin-color-*) ya se heredan de AdminLayout/PortalLayout, que envuelven
    // cualquier pantalla donde este modal se use.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="idema-admin-overlay-in absolute inset-0 bg-[#001F2A]/50"
        onClick={onCancel}
        aria-hidden
      />

      <div
        className="idema-admin-modal-in relative w-full max-w-sm rounded-[var(--admin-radius-lg)] bg-[var(--admin-color-surface)] p-6 shadow-[var(--admin-shadow-lg)]"
      >
        <h2 id="confirm-modal-title" className="text-lg font-bold" style={{ color: 'var(--admin-color-text-primary)' }}>
          {title}
        </h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--admin-color-text-secondary)' }}>
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isConfirming}
            className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-50"
            style={{ borderColor: 'var(--admin-color-border)', color: 'var(--admin-color-text-secondary)' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isConfirming}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${confirmClasses}`}
          >
            {isConfirming ? 'Procesando...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
