import { useEffect } from 'react'
import { FiAlertTriangle } from 'react-icons/fi'
import Button from './Button'

interface ConfirmModalProps {
  isOpen: boolean
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
  variant?: 'default' | 'destructive'
  confirmText?: string
  cancelText?: string
  isConfirming?: boolean
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  variant = 'default',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
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

  return (
    // Sin la clase `.idema-admin` aquí: ese selector fija su propio `background`
    // opaco, lo que taparía la página real detrás del overlay oscuro. Los tokens
    // (--color-*) ya se heredan de AdminLayout/PortalLayout, que envuelven
    // cualquier pantalla donde este modal se use.
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="ds-overlay-in absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} aria-hidden />

      <div className="ds-modal-in relative w-full max-w-[440px] rounded-[var(--radius-lg)] bg-[var(--color-bg-card)] p-6 shadow-[var(--shadow-modal)]">
        <div className="flex items-start gap-3">
          {variant === 'destructive' && (
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[var(--color-error)]">
              <FiAlertTriangle className="h-5 w-5" />
            </span>
          )}
          <div>
            <h2
              id="confirm-modal-title"
              className="text-lg font-bold text-[var(--color-text-main)]"
              style={{ fontFamily: 'var(--font-headline)' }}
            >
              {title}
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]" style={{ fontFamily: 'var(--font-body)' }}>
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button variant={variant === 'destructive' ? 'destructive' : 'primary'} onClick={onConfirm} disabled={isConfirming}>
            {isConfirming ? 'Procesando...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
