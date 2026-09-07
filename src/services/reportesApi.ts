import { apiRequest } from '@/services/apiClient'
import type {
  OrdenPagoEstado,
  OrdenPagoMedioPago,
  ReporteOrdenesBackend,
  ReportePopupsBackend,
} from '@/types/backend'

const REPORTES_PATH = '/api/v1/reportes'

export interface RangoReporte {
  fecha_desde: string
  fecha_hasta: string
}

export interface ReportePopupsFiltros extends RangoReporte {
  popup_id?: string
}

export interface ReporteOrdenesFiltros extends RangoReporte {
  estado?: OrdenPagoEstado
  medio_pago?: OrdenPagoMedioPago
}

function crearParametros(filtros: object): string {
  const params = new URLSearchParams()
  Object.entries(filtros).forEach(([key, value]) => {
    if (typeof value === 'string' && value) params.set(key, value)
  })
  return params.toString()
}

function descargarCsv(path: string): Promise<Blob> {
  return apiRequest<string>(path).then(
    (contenido) => new Blob([`\ufeff${contenido}`], { type: 'text/csv;charset=utf-8' }),
  )
}

export function consultarReportePopups(
  filtros: ReportePopupsFiltros,
): Promise<ReportePopupsBackend> {
  const query = crearParametros(filtros)
  return apiRequest<ReportePopupsBackend>(`${REPORTES_PATH}/popups?${query}`)
}

export function exportarReportePopups(filtros: ReportePopupsFiltros): Promise<Blob> {
  const query = crearParametros(filtros)
  return descargarCsv(`${REPORTES_PATH}/popups/exportar?${query}`)
}

export function consultarReporteOrdenes(
  filtros: ReporteOrdenesFiltros,
): Promise<ReporteOrdenesBackend> {
  const query = crearParametros(filtros)
  return apiRequest<ReporteOrdenesBackend>(`${REPORTES_PATH}/ordenes?${query}`)
}

export function exportarReporteOrdenes(filtros: ReporteOrdenesFiltros): Promise<Blob> {
  const query = crearParametros(filtros)
  return descargarCsv(`${REPORTES_PATH}/ordenes/exportar?${query}`)
}
