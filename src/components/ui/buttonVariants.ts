export type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'ghost' | 'destructive'

/**
 * Clases de color por variante, reutilizadas por Button y por cualquier control
 * no-<button> que deba verse como uno (p. ej. un <Link> de navegación o los
 * botones de ícono compactos de una fila de tabla).
 */
export const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
  secondary: 'bg-[var(--color-secondary)] text-white hover:opacity-90',
  outlined: 'bg-transparent border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-highlight)]',
  ghost: 'bg-transparent text-[var(--color-text-main)] hover:bg-[var(--color-bg-page)]',
  destructive: 'bg-[var(--color-error)] text-white hover:opacity-90',
}

/** Clases para un botón compacto de solo-ícono (acciones por fila de tabla, toolbars). */
export function iconButtonClasses(variant: ButtonVariant, className = ''): string {
  return `inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASSES[variant]} ${className}`
}
