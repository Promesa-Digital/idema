import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RowActions from './RowActions'

function montar(onSelect = vi.fn()) {
  render(
    // Reproduce el envoltorio real: la tabla recorta a sus hijos posicionados.
    <div style={{ overflow: 'hidden' }}>
      <div style={{ overflowX: 'auto' }}>
        <RowActions
          etiquetaAccesible="Acciones de la fila"
          acciones={[{ etiqueta: 'Archivar', onSelect, destructiva: true }]}
        />
      </div>
    </div>,
  )
  return onSelect
}

describe('RowActions', () => {
  it('dibuja el menu fuera de la tabla, que lo recortaria', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: 'Acciones de la fila' }))

    const menu = screen.getByRole('menu')
    // En un portal a document.body: ningun contenedor con overflow lo puede cortar.
    expect(menu.parentElement).toBe(document.body)
    expect(menu).toHaveClass('fixed')
  })

  it('al pulsar una opcion se ejecuta, no se pierde el clic', async () => {
    const user = userEvent.setup()
    const onSelect = montar()
    await user.click(screen.getByRole('button', { name: 'Acciones de la fila' }))
    await user.click(screen.getByRole('menuitem', { name: 'Archivar' }))

    expect(onSelect).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('se cierra al pulsar fuera', async () => {
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: 'Acciones de la fila' }))
    await user.click(document.body)

    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})
