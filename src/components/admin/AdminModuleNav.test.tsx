import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AdminPendientesContext } from '@/context/AdminPendientesContextType'
import type { AdminPendientes } from '@/context/AdminPendientesContextType'
import type { UsuarioRol } from '@/types/backend'
import AdminModuleNav from './AdminModuleNav'

function renderNav(rol: UsuarioRol | undefined, porRuta: Record<string, number> = {}) {
  const valor: AdminPendientes = {
    porRuta,
    total: Object.values(porRuta).reduce((s, n) => s + n, 0),
    cargando: false,
    refrescar: () => {},
  }
  return render(
    <MemoryRouter>
      <AdminPendientesContext.Provider value={valor}>
        <AdminModuleNav role={rol} />
      </AdminPendientesContext.Provider>
    </MemoryRouter>,
  )
}

describe('AdminModuleNav', () => {
  it('agrupa los módulos bajo rótulos navegables', () => {
    renderNav('admin_sistema')

    const finanzas = screen.getByRole('group', { name: 'Finanzas' })
    expect(within(finanzas).getAllByRole('link').map((a) => a.textContent)).toEqual([
      'Órdenes de pago',
      'Comprobantes',
      'Conciliación de pagos',
    ])
  })

  it('no dibuja grupos que el rol no puede ver', () => {
    renderNav('marketing')

    expect(screen.queryByRole('group', { name: 'Finanzas' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Comercial' })).toBeInTheDocument()
  })

  it('no renderiza nada sin rol', () => {
    const { container } = renderNav(undefined)
    expect(container).toBeEmptyDOMElement()
  })

  it('muestra el contador de pendientes junto al módulo', () => {
    renderNav('administracion', { '/admin/ordenes': 3 })

    const ordenes = screen.getByRole('link', { name: /Órdenes de pago/ })
    expect(ordenes).toHaveTextContent('3')
    // El número solo no dice nada a un lector de pantalla.
    expect(ordenes).toHaveAccessibleName(/3 pendientes/)
  })

  it('no muestra contador en los módulos sin pendientes', () => {
    renderNav('administracion', { '/admin/ordenes': 3 })

    expect(screen.getByRole('link', { name: /^Comprobantes$/ })).toBeInTheDocument()
  })

  it('corta los contadores enormes en 99+ para no romper la fila', () => {
    renderNav('administracion', { '/admin/leads': 250 })

    expect(screen.getByRole('link', { name: /Leads/ })).toHaveTextContent('99+')
  })
})
