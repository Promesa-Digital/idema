import type { IconType } from 'react-icons'
import {
  FiBarChart2,
  FiBookOpen,
  FiCreditCard,
  FiFileText,
  FiGift,
  FiGrid,
  FiLayers,
  FiMessageSquare,
  FiPercent,
  FiRefreshCw,
  FiShield,
  FiTag,
  FiUserCheck,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import type { UsuarioRol } from '@/types/backend'

/**
 * Familias de módulos. Existen porque Administración ve 11 módulos y el Administrador
 * del Sistema los 15: en una lista plana de ese largo nadie encuentra nada, y los tres
 * módulos de dinero quedaban repartidos entre las posiciones 6 y 14.
 */
export type AdminModuleGroup =
  | 'general'
  | 'oferta'
  | 'comercial'
  | 'estudiantes'
  | 'finanzas'
  | 'sistema'

/** `null` = bloque sin título. Inicio y Reportes encabezan la barra y no necesitan rótulo. */
export const ADMIN_GROUP_LABELS: Record<AdminModuleGroup, string | null> = {
  general: null,
  oferta: 'Oferta académica',
  comercial: 'Comercial',
  estudiantes: 'Estudiantes',
  finanzas: 'Finanzas',
  sistema: 'Sistema',
}

const ADMIN_GROUP_ORDER: AdminModuleGroup[] = [
  'general',
  'oferta',
  'comercial',
  'estudiantes',
  'finanzas',
  'sistema',
]

export interface AdminModule {
  /** Un solo nombre por módulo: el mismo en la barra, en el título y en el buscador. */
  label: string
  path: string
  description: string
  icon: IconType
  group: AdminModuleGroup
  allowedRoles: UsuarioRol[]
}

export interface AdminModuleSection {
  group: AdminModuleGroup
  label: string | null
  modules: AdminModule[]
}

export const ALL_ADMIN_ROLES: UsuarioRol[] = [
  'marketing',
  'director_marketing',
  'ventas',
  'academico',
  'administracion',
  'admin_sistema',
]

export const ROLE_LABELS: Record<UsuarioRol, string> = {
  marketing: 'Marketing',
  director_marketing: 'Dirección de Marketing',
  ventas: 'Ventas',
  academico: 'Área Académica',
  administracion: 'Administración',
  admin_sistema: 'Administrador del Sistema',
}

/** El orden del array es el orden de la barra lateral: primero por grupo, luego por uso. */
export const ADMIN_MODULES: AdminModule[] = [
  {
    label: 'Inicio',
    path: '/admin',
    description: 'Resumen de la operación y accesos rápidos.',
    icon: FiGrid,
    group: 'general',
    allowedRoles: ALL_ADMIN_ROLES,
  },
  {
    label: 'Reportes',
    path: '/admin/reportes',
    description: 'Indicadores y exportaciones operativas.',
    icon: FiBarChart2,
    group: 'general',
    allowedRoles: [
      'marketing',
      'director_marketing',
      'ventas',
      'administracion',
      'admin_sistema',
    ],
  },

  {
    label: 'Programas',
    path: '/admin/programas',
    description: 'Oferta académica y publicación de programas.',
    icon: FiBookOpen,
    group: 'oferta',
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Electivos',
    path: '/admin/electivos',
    description: 'Selección y seguimiento de electivos.',
    icon: FiGift,
    group: 'oferta',
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    // Es tarifa, pero se define al armar el programa y no al cobrarlo: vive con el catálogo.
    label: 'Conceptos de cobro',
    path: '/admin/conceptos-cobro',
    description: 'Tarifas y conceptos facturables.',
    icon: FiTag,
    group: 'oferta',
    allowedRoles: ['academico', 'administracion', 'ventas', 'admin_sistema'],
  },

  {
    label: 'Leads',
    path: '/admin/leads',
    description: 'Prospectos, asignación y seguimiento comercial.',
    icon: FiZap,
    group: 'comercial',
    allowedRoles: [
      'marketing',
      'director_marketing',
      'ventas',
      'administracion',
      'admin_sistema',
    ],
  },
  {
    label: 'Popups',
    path: '/admin/popups',
    description: 'Campañas emergentes y aprobaciones de Marketing.',
    icon: FiMessageSquare,
    group: 'comercial',
    allowedRoles: ['marketing', 'ventas', 'director_marketing', 'admin_sistema'],
  },
  {
    label: 'Combos y paquetes',
    path: '/admin/combos',
    description: 'Paquetes comerciales de programas.',
    icon: FiLayers,
    group: 'comercial',
    allowedRoles: ['ventas', 'marketing', 'admin_sistema'],
  },
  {
    label: 'Descuentos',
    path: '/admin/descuentos',
    description: 'Promociones y reglas de descuento.',
    icon: FiPercent,
    group: 'comercial',
    allowedRoles: ['ventas', 'admin_sistema'],
  },

  {
    label: 'Matrículas',
    path: '/admin/matriculas',
    description: 'Matrículas y estados académicos.',
    icon: FiUserCheck,
    group: 'estudiantes',
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Cuentas de alumnos',
    path: '/admin/alumnos',
    description: 'Directorio y soporte de cuentas estudiantiles.',
    icon: FiUsers,
    group: 'estudiantes',
    allowedRoles: ['ventas', 'academico', 'administracion', 'admin_sistema'],
  },

  {
    label: 'Órdenes de pago',
    path: '/admin/ordenes',
    description: 'Seguimiento de cobros y pagos pendientes.',
    icon: FiCreditCard,
    group: 'finanzas',
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Comprobantes',
    path: '/admin/comprobantes',
    description: 'Emisión y seguimiento de comprobantes.',
    icon: FiFileText,
    group: 'finanzas',
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Conciliación de pagos',
    path: '/admin/conciliaciones',
    description: 'Cruce de pagos y abonos de Culqi.',
    icon: FiRefreshCw,
    group: 'finanzas',
    allowedRoles: ['administracion', 'admin_sistema'],
  },

  {
    // Escudo y no personas: comparte pantalla con "Cuentas de alumnos" y antes
    // ambos usaban el mismo icono, que es como no tener icono.
    label: 'Usuarios y roles',
    path: '/admin/usuarios',
    description: 'Cuentas institucionales y permisos.',
    icon: FiShield,
    group: 'sistema',
    allowedRoles: ['admin_sistema'],
  },
]

export function getAvailableAdminModules(role?: UsuarioRol): AdminModule[] {
  if (!role) return []
  return ADMIN_MODULES.filter((module) => module.allowedRoles.includes(role))
}

/** Los módulos del rol, ya repartidos en secciones. Las secciones vacías no se devuelven. */
export function getAdminModuleSections(role?: UsuarioRol): AdminModuleSection[] {
  const disponibles = getAvailableAdminModules(role)
  return ADMIN_GROUP_ORDER.map((group) => ({
    group,
    label: ADMIN_GROUP_LABELS[group],
    modules: disponibles.filter((module) => module.group === group),
  })).filter((section) => section.modules.length > 0)
}

export function getAdminModule(pathname: string): AdminModule {
  return (
    ADMIN_MODULES.find(
      (module) => module.path !== '/admin' && pathname.startsWith(module.path),
    ) ?? ADMIN_MODULES[0]
  )
}
