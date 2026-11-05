import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, id, className = '', containerClassName = '', required, children, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const descriptionId = error || hint ? `${selectId}-description` : undefined

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-semibold text-dark">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        className={`min-h-11 w-full rounded-lg border bg-white px-3 py-2 text-dark outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-100'
            : 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {(error || hint) && (
        <p
          id={descriptionId}
          role={error ? 'alert' : undefined}
          className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-500'}`}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  )
})

export default Select
