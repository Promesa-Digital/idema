import { describe, expect, it } from 'vitest'
import { ALL_ADMIN_ROLES } from '@/components/admin/adminModules'
import { MINIMO_PARA_TASA, REPORTE_LABELS, reportesDeRol, tasaFiable } from './reportes'

describe('tasaFiable', () => {
  it('oculta la tasa cuando no hay datos suficientes', () => {
    // El caso real: 2 vistas y 2 clics daban "100%", que parece una campaña perfecta.
    expect(tasaFiable('100.00', 2)).toBe('Pocos datos')
  })

  it('muestra la tasa a partir del mínimo, inclusive', () => {
    expect(tasaFiable('12.50', MINIMO_PARA_TASA)).toBe('12.50%')
    expect(tasaFiable('12.50', MINIMO_PARA_TASA - 1)).toBe('Pocos datos')
  })

  it('no muestra una tasa sobre cero', () => {
    expect(tasaFiable('0.00', 0)).toBe('Pocos datos')
  })
})

describe('reportesDeRol', () => {
  it('da el reporte de leads a quien trabaja leads', () => {
    expect(reportesDeRol('ventas')).toContain('leads')
    expect(reportesDeRol('marketing')).toContain('leads')
  })

  it('no le da el dinero a marketing ni las campañas a administración', () => {
    expect(reportesDeRol('marketing')).not.toContain('ordenes')
    expect(reportesDeRol('administracion')).not.toContain('popups')
  })

  it('deja a académico sin reportes, que es lo que permite el backend', () => {
    expect(reportesDeRol('academico')).toEqual([])
  })

  it('el administrador del sistema los ve todos', () => {
    expect(reportesDeRol('admin_sistema').sort()).toEqual(['leads', 'ordenes', 'popups'])
  })

  it('sin rol no ofrece ninguno', () => {
    expect(reportesDeRol(undefined)).toEqual([])
  })

  it('todo rol tiene una entrada: uno sin definir rompería el selector', () => {
    for (const rol of ALL_ADMIN_ROLES) {
      expect(Array.isArray(reportesDeRol(rol)), rol).toBe(true)
    }
  })

  it('solo ofrece tipos con etiqueta', () => {
    for (const rol of ALL_ADMIN_ROLES) {
      for (const tipo of reportesDeRol(rol)) {
        expect(REPORTE_LABELS[tipo], `${rol} → ${tipo}`).toBeTruthy()
      }
    }
  })
})
