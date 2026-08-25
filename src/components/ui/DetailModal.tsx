import type { ReactNode } from 'react'
import Modal from './Modal'
import Badge from './Badge'
import Button from './Button'

type DetailFieldType = 'text' | 'badge' | 'date' | 'money' | 'readonly'

interface DetailField {
  label: string
  value: string | number | null | undefined
  type?: DetailFieldType
}

interface DetailModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  fields: DetailField[]
  /** Contenido extra debajo de la grilla de campos (p. ej. una sub-lista de registros relacionados). */
  children?: ReactNode
  /** Botones de acción del footer, a la izquierda de "Cerrar" (p. ej. "Anular", "Confirmar transferencia"). */
  actions?: ReactNode
}

function formatFecha(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatMonto(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  const n = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(n)) return String(value)
  return `S/ ${n.toFixed(2)}`
}

function FieldValue({ value, type = 'text' }: { value: DetailField['value']; type?: DetailFieldType }) {
  if (type === 'badge') {
    return value ? <Badge value={String(value)} /> : <span className="text-[var(--color-text-tertiary)]">—</span>
  }
  if (type === 'date') {
    return <span className="text-sm text-[var(--color-text-main)]">{formatFecha(value)}</span>
  }
  if (type === 'money') {
    return <span className="text-sm text-[var(--color-text-main)]">{formatMonto(value)}</span>
  }
  if (type === 'readonly') {
    return (
      <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-bg-page)] px-3 py-2 text-sm text-[var(--color-text-main)]">
        {value === null || value === undefined || value === '' ? '—' : value}
      </div>
    )
  }
  return <span className="text-sm text-[var(--color-text-main)]">{value === null || value === undefined || value === '' ? '—' : value}</span>
}

export default function DetailModal({ isOpen, onClose, title, fields, children, actions }: DetailModalProps) {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidthClassName="max-w-2xl">
      <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2" style={{ fontFamily: 'var(--font-body)' }}>
        {fields.map((field) => (
          <div key={field.label}>
            <dt className="mb-1 text-[13px] font-semibold text-[var(--color-text-secondary)]">{field.label}</dt>
            <dd>
              <FieldValue value={field.value} type={field.type} />
            </dd>
          </div>
        ))}
      </div>

      {children && <div className="mt-6 border-t border-[var(--color-border)] pt-4">{children}</div>}

      <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
        <div className="flex flex-wrap gap-2">{actions}</div>
        <Button variant="ghost" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  )
}
