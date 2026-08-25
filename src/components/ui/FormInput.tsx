import { useId, type InputHTMLAttributes } from 'react'

interface FormInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  readonly?: boolean
  type?: InputHTMLAttributes<HTMLInputElement>['type']
  hint?: string
}

export default function FormInput({
  label,
  value,
  onChange,
  error,
  disabled = false,
  readonly = false,
  type = 'text',
  hint,
  id,
  ...inputProps
}: FormInputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      <label htmlFor={inputId} className="mb-1.5 block text-[13px] font-semibold text-[var(--color-text-secondary)]">
        {label}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={readonly}
        aria-invalid={!!error}
        className={`w-full rounded-[var(--radius-sm)] border px-[14px] py-[10px] text-sm text-[var(--color-text-main)] outline-none transition-colors disabled:opacity-50 ${
          readonly ? 'cursor-default bg-[var(--color-bg-page)]' : 'bg-[var(--color-bg-card)]'
        } ${
          error
            ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:shadow-[0_0_0_3px_rgba(0,175,240,0.1)]'
        }`}
        {...inputProps}
      />
      {error ? (
        <p className="mt-1.5 text-xs text-[var(--color-error)]">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-[var(--color-text-tertiary)]">{hint}</p>
      ) : null}
    </div>
  )
}
