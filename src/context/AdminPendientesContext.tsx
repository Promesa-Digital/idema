import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getAvailableAdminModules } from '@/components/admin/adminModules'
import { listarComprobantes } from '@/services/comprobantesApi'
import { listarConciliaciones } from '@/services/conciliacionesApi'
import { listarLeads } from '@/services/leadsApi'
import { listarMatriculas } from '@/services/matriculasApi'
import { listarOrdenes } from '@/services/ordenesApi'
import { listarPopups } from '@/services/popupsApi'
import type { UsuarioRol } from '@/types/backend'
import { AdminPendientesContext } from './AdminPendientesContextType'

/**
 * Qué cuenta como "pendiente" en cada módulo: lo que espera una acción humana.
 *
 * Una orden pagada no es pendiente aunque sea reciente; una observada sí, porque
 * alguien tiene que resolverla. El contador solo sirve si significa "hay trabajo aquí".
 */
const CONTADORES: { ruta: string; contar: () => Promise<number> }[] = [
  {
    ruta: '/admin/leads',
    contar: async () => (await listarLeads()).filter((l) => l.estado === 'nuevo').length,
  },
  {
    ruta: '/admin/popups',
    // Solo los que esperan aprobación; los borradores son trabajo de su autor.
    contar: async () => (await listarPopups({ estado: 'pendiente' })).length,
  },
  {
    ruta: '/admin/ordenes',
    contar: async () =>
      (await listarOrdenes()).filter(
        (o) => o.estado === 'pendiente' || o.estado === 'pendiente_confirmacion',
      ).length,
  },
  {
    ruta: '/admin/comprobantes',
    contar: async () =>
      (await listarComprobantes()).filter((c) => c.estado === 'observado').length,
  },
  {
    ruta: '/admin/matriculas',
    contar: async () => (await listarMatriculas()).filter((m) => m.estado === 'pendiente').length,
  },
  {
    ruta: '/admin/conciliaciones',
    contar: async () =>
      (await listarConciliaciones()).filter(
        (c) => c.estado === 'abierta' || c.estado === 'en_revision',
      ).length,
  },
]

interface Conteo {
  role: UsuarioRol | undefined
  porRuta: Record<string, number>
}

interface AdminPendientesProviderProps {
  role?: UsuarioRol
  children: ReactNode
}

export function AdminPendientesProvider({ role, children }: AdminPendientesProviderProps) {
  // El rol viaja dentro del estado, no aparte: así un conteo que llegó para el rol
  // anterior no se pinta sobre el nuevo mientras el siguiente está en vuelo.
  const [datos, setDatos] = useState<Conteo>({ role: undefined, porRuta: {} })
  const [version, setVersion] = useState(0)

  const refrescar = useCallback(() => setVersion((v) => v + 1), [])

  // Permisos: se derivan del propio registro de módulos. Si el rol no ve el módulo,
  // no se pide su conteo, y así no se dispara un 403 por cada carga del panel.
  const aplicables = useMemo(() => {
    const visibles = new Set(getAvailableAdminModules(role).map((m) => m.path))
    return CONTADORES.filter((c) => visibles.has(c.ruta))
  }, [role])

  useEffect(() => {
    if (!role || aplicables.length === 0) return

    let vigente = true

    void Promise.allSettled(aplicables.map((c) => c.contar())).then((resultados) => {
      if (!vigente) return
      const porRuta: Record<string, number> = {}
      resultados.forEach((resultado, i) => {
        // Un módulo que falla simplemente no muestra contador. Poner 0 mentiría:
        // "no hay nada pendiente" y "no pude averiguarlo" no son lo mismo.
        if (resultado.status === 'fulfilled' && resultado.value > 0) {
          porRuta[aplicables[i].ruta] = resultado.value
        }
      })
      setDatos({ role, porRuta })
    })

    return () => {
      vigente = false
    }
  }, [role, aplicables, version])

  const valor = useMemo(() => {
    const listo = datos.role === role
    const porRuta = listo ? datos.porRuta : {}
    return {
      porRuta,
      total: Object.values(porRuta).reduce((suma, n) => suma + n, 0),
      cargando: !listo && aplicables.length > 0,
      refrescar,
    }
  }, [datos, role, aplicables, refrescar])

  return (
    <AdminPendientesContext.Provider value={valor}>{children}</AdminPendientesContext.Provider>
  )
}
