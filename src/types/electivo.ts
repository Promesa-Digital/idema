export interface Electivo {
  id: string
  nombre: string
  creditos: number
  activo: boolean
}

export interface ElectivosResumen {
  cuposUsados: number
  cuposTotal: number
  electivos: Electivo[]
}
