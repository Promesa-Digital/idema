import { useCallback, useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Modal from './Modal'

/**
 * Reproduce el caso real de los paneles: el `onClose` del padre depende del estado del
 * formulario, porque avisa si hay cambios sin guardar. Eso le da una identidad nueva en
 * cada tecla.
 */
function ModalConFormulario() {
  const [texto, setTexto] = useState('')

  const cerrar = useCallback(() => {
    if (texto !== '') return
  }, [texto])

  return (
    <Modal isOpen onClose={cerrar} title="Prueba">
      <input aria-label="Nombre" value={texto} onChange={(e) => setTexto(e.target.value)} />
    </Modal>
  )
}

describe('Modal: foco', () => {
  it('deja escribir seguido aunque onClose cambie de identidad en cada tecla', async () => {
    const user = userEvent.setup()
    render(<ModalConFormulario />)

    const campo = screen.getByLabelText('Nombre')
    await user.click(campo)
    await user.keyboard('Tecleo')

    // Si el efecto de foco se reejecuta, el foco salta al boton de cerrar y solo
    // sobrevive la primera letra.
    expect(campo).toHaveValue('Tecleo')
    expect(campo).toHaveFocus()
  })

  it('enfoca el primer elemento al abrirse', async () => {
    render(
      <Modal isOpen onClose={() => {}} title="Prueba">
        <input aria-label="Nombre" />
      </Modal>,
    )
    expect(screen.getByRole('button', { name: /cerrar/i })).toHaveFocus()
  })
})
