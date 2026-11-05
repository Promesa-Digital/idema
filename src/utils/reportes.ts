import type { UsuarioRol } from '@/types/backend'

export type ReporteTipo = 'leads' | 'popups' | 'ordenes'

export const REPORTE_LABELS: Record<ReporteTipo, string> = {
  leads: 'Leads',
  popups: 'Analítica de popups',
  ordenes: 'Reporte contable de órdenes',
}

/**
 * Qué reportes puede ver cada rol.
 *
 * Debe coincidir con los permisos del backend (ROLES_REPORTE_* en app/api/reportes.py):
 * si aquí sobra uno, el usuario lo elige y recibe un 403 sin entender por qué; si falta,
 * no puede llegar a un reporte al que sí tiene derecho.
 */
export const REPORTES_POR_ROL: Record<UsuarioRol, ReporteTipo[]> = {
  marketing: ['leads', 'popups'],
  director_marketing: ['leads', 'popups'],
  // Ventas trabaja los leads pero no mide campañas.
  ventas: ['leads'],
  academico: [],
  administracion: ['ordenes'],
  admin_sistema: ['leads', 'popups', 'ordenes'],
}

export function reportesDeRol(rol?: UsuarioRol): ReporteTipo[] {
  return rol ? REPORTES_POR_ROL[rol] : []
}

/**
 * Vistas mínimas para que una tasa signifique algo.
 *
 * Con dos vistas y dos clics sale "100%", que parece una campaña perfecta y es ruido.
 * Un porcentaje con aire de certeza sobre cuatro datos lleva a decidir mal.
 */
export const MINIMO_PARA_TASA = 30

/** Muestra la tasa solo si hay datos suficientes para que quiera decir algo. */
export function tasaFiable(tasa: string, base: number): string {
  return base >= MINIMO_PARA_TASA ? `${tasa}%` : 'Pocos datos'
}
