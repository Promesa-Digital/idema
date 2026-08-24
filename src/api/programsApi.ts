import { httpClient } from './httpClient'
import type { Carrera, ProgramaPublico } from '../types'

export async function fetchCursosDestacados(): Promise<Carrera[]> {
  const { data } = await httpClient.get<Carrera[]>('/programas/cursos-destacados')
  return data
}

/** Único listado de programas al que un alumno tiene acceso (el resto de /programas exige rol staff). */
export async function fetchProgramasPublicos(): Promise<ProgramaPublico[]> {
  const { data } = await httpClient.get<ProgramaPublico[]>('/programas/publicos')
  return data
}
