import type { IconType } from 'react-icons'
import { FiCreditCard, FiFileText, FiGrid, FiUser, FiUsers } from 'react-icons/fi'

export type AlumnoPortalTab = 'resumen' | 'matriculas' | 'pagos' | 'comprobantes' | 'perfil'

interface TabItem {
  id: AlumnoPortalTab
  label: string
  shortLabel: string
  icon: IconType
}

export const ALUMNO_PORTAL_TABS: TabItem[] = [
  { id: 'resumen', label: 'Resumen', shortLabel: 'Inicio', icon: FiGrid },
  { id: 'matriculas', label: 'Matrículas y electivos', shortLabel: 'Matrículas', icon: FiUsers },
  { id: 'pagos', label: 'Pagos', shortLabel: 'Pagos', icon: FiCreditCard },
  { id: 'comprobantes', label: 'Comprobantes', shortLabel: 'Comprob.', icon: FiFileText },
  { id: 'perfil', label: 'Perfil y seguridad', shortLabel: 'Perfil', icon: FiUser },
]
