import type { ReactNode } from 'react'

type BadgeVariant = 'slate' | 'amber' | 'sky' | 'red' | 'emerald' | 'violet'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  slate: 'bg-slate-200 text-slate-700',
  amber: 'bg-amber-100 text-amber-800',
  sky: 'bg-sky-100 text-sky-800',
  red: 'bg-red-100 text-red-800',
  emerald: 'bg-emerald-100 text-emerald-800',
  violet: 'bg-violet-100 text-violet-800',
}

export default function Badge({ children, variant = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
