import { createContext, useContext } from 'react'

/**
 * Trabajo pendiente por módulo, indexado por la ruta del módulo.
 *
 * La clave es la ruta y no un nombre propio para que la barra lateral pueda pintar el
 * contador de cualquier módulo sin conocer de qué entidad se trata: si mañana aparece
 * un módulo nuevo con pendientes, basta con añadir su ruta aquí.
 */
export interface AdminPendientes {
  porRuta: Record<string, number>
  total: number
  cargando: boolean
  /** Vuelve a contar. Útil tras confirmar un pago o aprobar un popup. */
  refrescar: () => void
}

/**
 * Cómo se lee un pendiente en cada módulo. Un número suelto ("3") no dice qué hacer;
 * "3 comprobantes observados" sí.
 */
export const PENDIENTE_ETIQUETAS: Record<string, { uno: string; varios: string }> = {
  '/admin/leads': { uno: 'lead nuevo sin contactar', varios: 'leads nuevos sin contactar' },
  '/admin/popups': { uno: 'popup esperando aprobación', varios: 'popups esperando aprobación' },
  '/admin/ordenes': {
    uno: 'orden de pago sin resolver',
    varios: 'órdenes de pago sin resolver',
  },
  '/admin/comprobantes': { uno: 'comprobante observado', varios: 'comprobantes observados' },
  '/admin/matriculas': { uno: 'matrícula por activar', varios: 'matrículas por activar' },
  '/admin/conciliaciones': { uno: 'conciliación sin cerrar', varios: 'conciliaciones sin cerrar' },
}

/** "3 leads nuevos sin contactar" / "1 comprobante observado". */
export function describirPendientes(ruta: string, cantidad: number): string {
  const etiqueta = PENDIENTE_ETIQUETAS[ruta]
  if (!etiqueta) return cantidad === 1 ? '1 pendiente' : `${cantidad} pendientes`
  return `${cantidad} ${cantidad === 1 ? etiqueta.uno : etiqueta.varios}`
}

export const AdminPendientesContext = createContext<AdminPendientes | undefined>(undefined)

const SIN_DATOS: AdminPendientes = {
  porRuta: {},
  total: 0,
  cargando: false,
  refrescar: () => {},
}

/**
 * Fuera del proveedor devuelve cero pendientes en vez de lanzar: el contador es un
 * adorno informativo y ninguna pantalla debería caerse por no poder pintarlo.
 */
export function useAdminPendientes(): AdminPendientes {
  return useContext(AdminPendientesContext) ?? SIN_DATOS
}
