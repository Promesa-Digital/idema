import { isAxiosError } from 'axios'
import { httpClient } from './httpClient'
import type { ConfirmacionPago, EstadoPago, ResumenPago } from '../types/checkout'

const BASE_URL = '/portal/pagos'

interface ResumenPagoResponse {
  orden_id: string
  concepto: string
  monto: number
  moneda: string
}

function mapResumen(data: ResumenPagoResponse): ResumenPago {
  return {
    ordenId: data.orden_id,
    concepto: data.concepto,
    monto: data.monto,
    moneda: data.moneda,
  }
}

interface ConfirmacionResponse {
  orden_id: string
  estado: EstadoPago
  mensaje: string
}

function mapConfirmacion(data: ConfirmacionResponse): ConfirmacionPago {
  return {
    ordenId: data.orden_id,
    estado: data.estado,
    mensaje: data.mensaje,
  }
}

export async function fetchResumenPago(): Promise<ResumenPago | null> {
  try {
    const { data } = await httpClient.get<ResumenPagoResponse>(`${BASE_URL}/pendiente`)
    return mapResumen(data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) return null
    throw error
  }
}

export async function pagarConTarjeta(ordenId: string, culqiToken: string): Promise<ConfirmacionPago> {
  const { data } = await httpClient.post<ConfirmacionResponse>(`${BASE_URL}/tarjeta`, {
    orden_id: ordenId,
    token: culqiToken,
  })
  return mapConfirmacion(data)
}

export async function pagarConYape(ordenId: string, celular: string): Promise<ConfirmacionPago> {
  const { data } = await httpClient.post<ConfirmacionResponse>(`${BASE_URL}/yape`, {
    orden_id: ordenId,
    celular,
  })
  return mapConfirmacion(data)
}

export async function pagarConTransferencia(ordenId: string, voucher: File): Promise<ConfirmacionPago> {
  const formData = new FormData()
  formData.append('orden_id', ordenId)
  formData.append('voucher', voucher)

  const { data } = await httpClient.post<ConfirmacionResponse>(`${BASE_URL}/transferencia`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return mapConfirmacion(data)
}
