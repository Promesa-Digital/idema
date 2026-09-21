import { describe, expect, it } from 'vitest'
import {
  ADMIN_MODULES,
  ALL_ADMIN_ROLES,
  getAdminModule,
  getAdminModuleSections,
  getAvailableAdminModules,
} from './adminModules'

describe('agrupación de módulos', () => {
  it('no pierde ni duplica módulos al repartirlos en secciones', () => {
    for (const rol of ALL_ADMIN_ROLES) {
      const enSecciones = getAdminModuleSections(rol).flatMap((s) => s.modules)
      expect(enSecciones).toEqual(getAvailableAdminModules(rol))
    }
  })

  it('no devuelve secciones vacías: Marketing no debe ver el rótulo "Finanzas"', () => {
    const rotulos = getAdminModuleSections('marketing').map((s) => s.label)
    expect(rotulos).toEqual([null, 'Comercial'])
  })

  it('reparte los 15 módulos del administrador del sistema en las seis familias', () => {
    const secciones = getAdminModuleSections('admin_sistema')
    expect(secciones.map((s) => [s.label, s.modules.length])).toEqual([
      [null, 2],
      ['Oferta académica', 3],
      ['Comercial', 4],
      ['Estudiantes', 2],
      ['Finanzas', 3],
      ['Sistema', 1],
    ])
  })

  it('mantiene juntos los tres módulos de dinero, que antes estaban en 6, 7 y 14', () => {
    const finanzas = getAdminModuleSections('administracion').find((s) => s.label === 'Finanzas')
    expect(finanzas?.modules.map((m) => m.label)).toEqual([
      'Órdenes de pago',
      'Comprobantes',
      'Conciliación de pagos',
    ])
  })

  it('deja la barra vacía si no hay rol, en vez de mostrar rótulos sueltos', () => {
    expect(getAdminModuleSections(undefined)).toEqual([])
  })
})

describe('integridad del registro', () => {
  it('no repite rutas', () => {
    const rutas = ADMIN_MODULES.map((m) => m.path)
    expect(new Set(rutas).size).toBe(rutas.length)
  })

  it('no repite nombres', () => {
    const nombres = ADMIN_MODULES.map((m) => m.label)
    expect(new Set(nombres).size).toBe(nombres.length)
  })

  it('no repite iconos: dos módulos con el mismo símbolo es no tener símbolo', () => {
    const iconos = ADMIN_MODULES.map((m) => m.icon)
    expect(new Set(iconos).size).toBe(iconos.length)
  })

  it('todo módulo declara al menos un rol que puede verlo', () => {
    for (const modulo of ADMIN_MODULES) {
      expect(modulo.allowedRoles.length, modulo.label).toBeGreaterThan(0)
    }
  })

  it('Inicio lo ven todos los roles', () => {
    for (const rol of ALL_ADMIN_ROLES) {
      expect(getAvailableAdminModules(rol)[0]?.path).toBe('/admin')
    }
  })
})

describe('getAdminModule', () => {
  it('resuelve el módulo por el inicio de la ruta', () => {
    expect(getAdminModule('/admin/ordenes').label).toBe('Órdenes de pago')
    expect(getAdminModule('/admin/programas/nuevo').label).toBe('Programas')
  })

  it('cae en Inicio para la raíz del panel', () => {
    expect(getAdminModule('/admin').label).toBe('Inicio')
  })

  it('cae en Inicio para una ruta desconocida, en vez de romperse', () => {
    expect(getAdminModule('/admin/lo-que-sea').label).toBe('Inicio')
  })
})
