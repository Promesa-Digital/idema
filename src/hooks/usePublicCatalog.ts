import { useEffect, useState } from 'react'
import { carreras } from '@/data/programs/carreras'
import { auxiliares } from '@/data/programs/auxiliares'
import { especializaciones } from '@/data/programs/especializaciones'
import { cursos } from '@/data/programs/cursos'
import { cargarCatalogoPublico } from '@/services/catalogoPublico'
import type { Carrera } from '@/types'

const fallbackCatalog = [...carreras, ...auxiliares, ...especializaciones, ...cursos]
let cachedCatalog: Carrera[] | null = null
let catalogRequest: Promise<Carrera[]> | null = null

export function usePublicCatalog() {
  const [programs, setPrograms] = useState<Carrera[]>(cachedCatalog || fallbackCatalog)
  const [isLoading, setIsLoading] = useState(cachedCatalog === null)

  useEffect(() => {
    let active = true
    catalogRequest ??= cargarCatalogoPublico()
    catalogRequest
      .then((catalog) => {
        cachedCatalog = catalog
        if (active) setPrograms(catalog)
      })
      .catch(() => {
      })
      .finally(() => {
        catalogRequest = null
        if (active) setIsLoading(false)
      })
    return () => { active = false }
  }, [])

  return { programs, isLoading }
}
