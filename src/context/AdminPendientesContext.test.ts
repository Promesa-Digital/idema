import { describe, expect, it } from 'vitest'
import { ADMIN_MODULES } from '@/components/admin/adminModules'
import { PENDIENTE_ETIQUETAS, describirPendientes } from './AdminPendientesContextType'

describe('describirPendientes', () => {
  it('usa el singular con uno solo', () => {
    expect(describirPendientes('/admin/comprobantes', 1)).toBe('1 comprobante observado')
  })

  it('usa el plural con varios', () => {
    expect(describirPendientes('/admin/leads', 4)).toBe('4 leads nuevos sin contactar')
  })

  it('cae en un texto genérico si el módulo no declaró etiqueta, en vez de romperse', () => {
    expect(describirPendientes('/admin/inventado', 2)).toBe('2 pendientes')
    expect(describirPendientes('/admin/inventado', 1)).toBe('1 pendiente')
  })
})

describe('etiquetas de pendientes', () => {
  it('toda ruta con etiqueta corresponde a un módulo real', () => {
    const rutas = new Set(ADMIN_MODULES.map((m) => m.path))
    for (const ruta of Object.keys(PENDIENTE_ETIQUETAS)) {
      expect(rutas.has(ruta), `${ruta} no es la ruta de ningún módulo`).toBe(true)
    }
  })

  it('ninguna etiqueta arrastra el número dentro del texto', () => {
    for (const [ruta, etiqueta] of Object.entries(PENDIENTE_ETIQUETAS)) {
      expect(etiqueta.uno, ruta).not.toMatch(/\d/)
      expect(etiqueta.varios, ruta).not.toMatch(/\d/)
    }
  })
})
