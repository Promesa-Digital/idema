import { httpClient } from './httpClient'
import type { Comprobante, ComprobanteEmitir } from '../types'

const BASE_URL = '/comprobantes'

/** El backend filtra según quién pregunta: alumno ve los suyos, admin ve todos. */
export async function getComprobantes(): Promise<Comprobante[]> {
  const { data } = await httpClient.get<Comprobante[]>(`${BASE_URL}/`)
  return data
}

export async function getComprobante(id: string): Promise<Comprobante> {
  const { data } = await httpClient.get<Comprobante>(`${BASE_URL}/${id}`)
  return data
}

/** Solo de una orden pagada; si `tipo` es "factura", `ruc` y `razon_social` son obligatorios. */
export async function emitirComprobante(values: ComprobanteEmitir): Promise<Comprobante> {
  const { data } = await httpClient.post<Comprobante>(`${BASE_URL}/emitir`, values)
  return data
}

/**
 * El backend exige `motivo` en el body (genera la nota de crédito con esa referencia),
 * así que este cliente lo pide como parámetro aunque no estaba en la lista original.
 */
export async function anularComprobante(id: string, motivo: string): Promise<Comprobante> {
  const { data } = await httpClient.post<Comprobante>(`${BASE_URL}/${id}/anular`, { motivo })
  return data
}
