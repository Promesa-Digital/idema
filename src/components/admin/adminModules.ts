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
  FiTag,
  FiUserCheck,
  FiUsers,
  FiZap,
} from 'react-icons/fi'
import type { UsuarioRol } from '@/types/backend'

export interface AdminModule {
  label: string
  shortLabel: string
  path: string
  description: string
  icon: IconType
  allowedRoles: UsuarioRol[]
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

export const ADMIN_MODULES: AdminModule[] = [
  {
    label: 'Inicio',
    shortLabel: 'Inicio',
    path: '/admin',
    description: 'Resumen de la operación y accesos rápidos.',
    icon: FiGrid,
    allowedRoles: ALL_ADMIN_ROLES,
  },
  {
    label: 'Programas',
    shortLabel: 'Programas',
    path: '/admin/programas',
    description: 'Oferta académica y publicación de programas.',
    icon: FiBookOpen,
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Popups',
    shortLabel: 'Popups',
    path: '/admin/popups',
    description: 'Campañas emergentes y aprobaciones de Marketing.',
    icon: FiMessageSquare,
    allowedRoles: ['marketing', 'director_marketing', 'admin_sistema'],
  },
  {
    label: 'Combos y paquetes',
    shortLabel: 'Combos',
    path: '/admin/combos',
    description: 'Paquetes comerciales de programas.',
    icon: FiLayers,
    allowedRoles: ['ventas', 'marketing', 'admin_sistema'],
  },
  {
    label: 'Descuentos',
    shortLabel: 'Descuentos',
    path: '/admin/descuentos',
    description: 'Promociones y reglas de descuento.',
    icon: FiPercent,
    allowedRoles: ['ventas', 'admin_sistema'],
  },
  {
    label: 'Órdenes de pago',
    shortLabel: 'Órdenes',
    path: '/admin/ordenes',
    description: 'Seguimiento de cobros y pagos pendientes.',
    icon: FiCreditCard,
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Comprobantes',
    shortLabel: 'Comprobantes',
    path: '/admin/comprobantes',
    description: 'Emisión y seguimiento de comprobantes.',
    icon: FiFileText,
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Leads',
    shortLabel: 'Leads',
    path: '/admin/leads',
    description: 'Prospectos, asignación y seguimiento comercial.',
    icon: FiZap,
    allowedRoles: [
      'marketing',
      'director_marketing',
      'ventas',
      'administracion',
      'admin_sistema',
    ],
  },
  {
    label: 'Usuarios y roles',
    shortLabel: 'Usuarios',
    path: '/admin/usuarios',
    description: 'Cuentas institucionales y permisos.',
    icon: FiUsers,
    allowedRoles: ['admin_sistema'],
  },
  {
    label: 'Conceptos de cobro',
    shortLabel: 'Conceptos',
    path: '/admin/conceptos-cobro',
    description: 'Tarifas y conceptos facturables.',
    icon: FiTag,
    allowedRoles: ['academico', 'administracion', 'ventas', 'admin_sistema'],
  },
  {
    label: 'Matrículas',
    shortLabel: 'Matrículas',
    path: '/admin/matriculas',
    description: 'Matrículas y estados académicos.',
    icon: FiUserCheck,
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Electivos',
    shortLabel: 'Electivos',
    path: '/admin/electivos',
    description: 'Selección y seguimiento de electivos.',
    icon: FiGift,
    allowedRoles: ['academico', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Reportes',
    shortLabel: 'Reportes',
    path: '/admin/reportes',
    description: 'Indicadores y exportaciones operativas.',
    icon: FiBarChart2,
    allowedRoles: ['marketing', 'director_marketing', 'administracion', 'admin_sistema'],
  },
  {
    label: 'Conciliación de pagos',
    shortLabel: 'Conciliación',
    path: '/admin/conciliaciones',
    description: 'Cruce de pagos y abonos de Culqi.',
    icon: FiRefreshCw,
    allowedRoles: ['administracion', 'admin_sistema'],
  },
  {
    label: 'Cuentas de alumnos',
    shortLabel: 'Alumnos',
    path: '/admin/alumnos',
    description: 'Directorio y soporte de cuentas estudiantiles.',
    icon: FiUsers,
    allowedRoles: ['ventas', 'academico', 'administracion', 'admin_sistema'],
  },
]

export function getAvailableAdminModules(role?: UsuarioRol): AdminModule[] {
  if (!role) return []
  return ADMIN_MODULES.filter((module) => module.allowedRoles.includes(role))
}

export function getAdminModule(pathname: string): AdminModule {
  return (
    ADMIN_MODULES.find(
      (module) => module.path !== '/admin' && pathname.startsWith(module.path),
    ) ?? ADMIN_MODULES[0]
  )
}
