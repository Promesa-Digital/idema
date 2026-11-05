import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  containerClassName?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, id, className = '', containerClassName = '', required, ...props },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const descriptionId = error || hint ? `${textareaId}-description` : undefined

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={textareaId} className="mb-1.5 block text-sm font-semibold text-dark">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descriptionId}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-dark outline-none transition placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-100'
            : 'border-slate-300 focus:border-primary focus:ring-2 focus:ring-primary/15'
        } ${className}`}
        {...props}
      />
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

export default Textarea
