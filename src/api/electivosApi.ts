import { httpClient } from './httpClient'
import type { Electivo, ElectivosResumen } from '../types/electivo'

const BASE_URL = '/portal/electivos'

interface ElectivoResponse {
  id: string
  nombre: string
  creditos: number
  activo: boolean
}

interface ElectivosResumenResponse {
  cupos_usados: number
  cupos_total: number
  electivos: ElectivoResponse[]
}

function mapElectivo(data: ElectivoResponse): Electivo {
  return {
    id: data.id,
    nombre: data.nombre,
    creditos: data.creditos,
    activo: data.activo,
  }
}

function mapResumen(data: ElectivosResumenResponse): ElectivosResumen {
  return {
    cuposUsados: data.cupos_usados,
    cuposTotal: data.cupos_total,
    electivos: data.electivos.map(mapElectivo),
  }
}

export async function fetchMisElectivos(): Promise<ElectivosResumen> {
  const { data } = await httpClient.get<ElectivosResumenResponse>(BASE_URL)
  return mapResumen(data)
}

export async function activarElectivo(id: string): Promise<ElectivosResumen> {
  const { data } = await httpClient.patch<ElectivosResumenResponse>(`${BASE_URL}/${id}/activar`)
  return mapResumen(data)
}

export async function desactivarElectivo(id: string): Promise<ElectivosResumen> {
  const { data } = await httpClient.patch<ElectivosResumenResponse>(`${BASE_URL}/${id}/desactivar`)
  return mapResumen(data)
}
