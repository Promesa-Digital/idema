import { httpClient } from './httpClient'
import type { Carrera } from '../types'

export async function fetchCursosDestacados(): Promise<Carrera[]> {
  const { data } = await httpClient.get<Carrera[]>('/programas/cursos-destacados')
  return data
}
