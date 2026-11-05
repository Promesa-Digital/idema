import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import SearchSelect from './SearchSelect'
import type { SearchSelectOption } from './SearchSelect'

const PROGRAMAS: SearchSelectOption[] = [
  { value: '1', label: 'Enfermería Técnica', hint: 'CAR001', group: 'Salud' },
  { value: '2', label: 'Contabilidad', hint: 'CAR002', group: 'Negocios' },
  { value: '3', label: 'Administración de Empresas', hint: 'CAR003', group: 'Negocios' },
  { value: '4', label: 'Diseño Gráfico', hint: 'CUR010', group: 'Creativas' },
]

function Campo({ opciones = PROGRAMAS, inicial = '' }: { opciones?: SearchSelectOption[]; inicial?: string }) {
  const [valor, setValor] = useState(inicial)
  return (
    <>
      <SearchSelect
        label="Programa"
        value={valor}
        onChange={setValor}
        options={opciones}
        clearLabel="Quitar programa"
      />
      <output data-testid="valor">{valor}</output>
    </>
  )
}

describe('SearchSelect', () => {
  it('no muestra la lista hasta que se pide', () => {
    render(<Campo />)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('filtra según lo que se escribe', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'conta')

    const opciones = within(screen.getByRole('listbox')).getAllByRole('option')
    expect(opciones).toHaveLength(1)
    expect(opciones[0]).toHaveTextContent('Contabilidad')
  })

  it('encuentra pese a las tildes: "diseno grafico" localiza "Diseño Gráfico"', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'diseno grafico')

    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1)
  })

  it('busca por palabras sueltas y en cualquier orden', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'empresas admin')

    expect(within(screen.getByRole('listbox')).getAllByRole('option')).toHaveLength(1)
  })

  it('busca también por el código, no solo por el nombre', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'CAR003')

    expect(within(screen.getByRole('listbox')).getAllByRole('option')[0]).toHaveTextContent(
      'Administración de Empresas',
    )
  })

  it('selecciona con el ratón y cierra la lista', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.click(screen.getByRole('option', { name: /Contabilidad/ }))

    expect(screen.getByTestId('valor')).toHaveTextContent('2')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox')).toHaveValue('Contabilidad')
  })

  it('se maneja entero con el teclado', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{ArrowDown}{Enter}')

    // Arranca en la primera; dos flechas abajo llevan a la tercera.
    expect(screen.getByTestId('valor')).toHaveTextContent('3')
  })

  it('las flechas dan la vuelta al llegar al final', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowUp}{Enter}')

    expect(screen.getByTestId('valor')).toHaveTextContent('4')
  })

  it('Escape cierra sin elegir nada', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.getByTestId('valor')).toHaveTextContent('')
  })

  it('agrupa las opciones por su categoría', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('Negocios')).toBeInTheDocument()
    expect(screen.getByText('Salud')).toBeInTheDocument()
  })

  it('avisa cuando nada coincide, en vez de dejar un hueco', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.type(screen.getByRole('combobox'), 'zzz')

    expect(screen.getByText(/Nada coincide con/)).toBeInTheDocument()
  })

  it('distingue "no hay nada que ofrecer" de "nada coincide"', async () => {
    const user = userEvent.setup()
    render(<Campo opciones={[]} />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.getByText('No hay opciones disponibles.')).toBeInTheDocument()
  })

  it('permite vaciar la selección', async () => {
    const user = userEvent.setup()
    render(<Campo inicial="2" />)

    await user.click(screen.getByRole('button', { name: 'Quitar programa' }))

    expect(screen.getByTestId('valor')).toHaveTextContent('')
  })

  it('no ofrece vaciar si no hay nada seleccionado', () => {
    render(<Campo />)
    expect(screen.queryByRole('button', { name: 'Quitar programa' })).not.toBeInTheDocument()
  })

  it('anuncia la opción resaltada a los lectores de pantalla', async () => {
    const user = userEvent.setup()
    render(<Campo />)

    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}')

    const combo = screen.getByRole('combobox')
    const activa = combo.getAttribute('aria-activedescendant')
    expect(activa).toBeTruthy()
    expect(document.getElementById(activa!)).toHaveTextContent('Contabilidad')
  })
})
