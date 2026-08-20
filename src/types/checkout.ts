export type MetodoPago = 'tarjeta' | 'yape' | 'transferencia'

export type EstadoPago = 'aprobado' | 'pendiente' | 'en_revision'

export interface ResumenPago {
  ordenId: string
  concepto: string
  monto: number
  moneda: string
}

export interface ConfirmacionPago {
  ordenId: string
  estado: EstadoPago
  mensaje: string
}
