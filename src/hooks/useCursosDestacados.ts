import { useQuery } from '@tanstack/react-query'
import { fetchCursosDestacados } from '../api/programsApi'

export function useCursosDestacados() {
  return useQuery({
    queryKey: ['programas', 'cursos-destacados'],
    queryFn: fetchCursosDestacados,
  })
}
