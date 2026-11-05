import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import Table from './Table'
import type { TableColumn } from './Table'

interface Fila {
  nombre: string
  anio: number
  nota: string | null
}

const DATOS: Fila[] = [
  { nombre: 'Enfermería', anio: 2024, nota: 'b' },
  { nombre: 'agronomía', anio: 2026, nota: null },
  { nombre: 'Contabilidad', anio: 2025, nota: 'a' },
]

const COLUMNAS: TableColumn<Fila>[] = [
  { key: 'nombre', header: 'Nombre', sortValue: (f) => f.nombre, render: (f) => f.nombre },
  { key: 'anio', header: 'Año', sortValue: (f) => f.anio, render: (f) => f.anio },
  { key: 'nota', header: 'Nota', sortValue: (f) => f.nota, render: (f) => f.nota ?? '—' },
  { key: 'fijo', header: 'Fijo', render: () => 'x' },
]

function renderTabla() {
  return render(<Table columns={COLUMNAS} data={DATOS} getRowKey={(f) => f.nombre} />)
}

/** Lee la primera celda de cada fila de la tabla de escritorio. */
function nombresEnOrden(): string[] {
  return screen
    .getAllByRole('row')
    .slice(1) // salta el encabezado
    .map((fila) => fila.querySelectorAll('td')[0]?.textContent ?? '')
}

describe('Table: selección', () => {
  function TablaSeleccionable({ bloquear }: { bloquear?: (f: Fila) => boolean } = {}) {
    const [seleccionados, setSeleccionados] = useState<string[]>([])
    return (
      <>
        <Table
          columns={COLUMNAS}
          data={DATOS}
          getRowKey={(f) => f.nombre}
          seleccion={{
            seleccionados,
            onChange: setSeleccionados,
            puedeSeleccionarse: bloquear ? (f) => !bloquear(f) : undefined,
          }}
        />
        <output data-testid="sel">{seleccionados.join(',')}</output>
      </>
    )
  }

  it('no muestra casillas si no se pide selección', () => {
    renderTabla()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('marca y desmarca una fila', async () => {
    const user = userEvent.setup()
    render(<TablaSeleccionable />)
    const casillas = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })

    await user.click(casillas[1])
    expect(screen.getByTestId('sel')).toHaveTextContent('agronomía')

    await user.click(casillas[1])
    expect(screen.getByTestId('sel')).toHaveTextContent('')
  })

  it('la casilla del encabezado marca todas las filas visibles', async () => {
    const user = userEvent.setup()
    render(<TablaSeleccionable />)

    await user.click(screen.getByRole('checkbox', { name: /todas las filas/i }))

    expect(screen.getByTestId('sel')).toHaveTextContent('Enfermería,agronomía,Contabilidad')
  })

  it('no deja seleccionar las filas bloqueadas', async () => {
    const user = userEvent.setup()
    render(<TablaSeleccionable bloquear={(f) => f.anio === 2026} />)

    const casillas = screen.getAllByRole('checkbox', { name: 'Seleccionar fila' })
    expect(casillas[1]).toBeDisabled()

    await user.click(screen.getByRole('checkbox', { name: /todas las filas/i }))
    // agronomía es de 2026 y está bloqueada: no debe entrar en la selección.
    expect(screen.getByTestId('sel')).not.toHaveTextContent('agronomía')
  })
})

describe('Table: ordenación', () => {
  it('respeta el orden recibido mientras nadie ordene', () => {
    renderTabla()
    expect(nombresEnOrden()).toEqual(['Enfermería', 'agronomía', 'Contabilidad'])
  })

  it('ordena alfabéticamente ignorando mayúsculas y tildes', async () => {
    const user = userEvent.setup()
    renderTabla()

    await user.click(screen.getByRole('button', { name: /nombre/i }))

    expect(nombresEnOrden()).toEqual(['agronomía', 'Contabilidad', 'Enfermería'])
  })

  it('invierte el orden al pulsar la misma columna otra vez', async () => {
    const user = userEvent.setup()
    renderTabla()

    await user.click(screen.getByRole('button', { name: /nombre/i }))
    await user.click(screen.getByRole('button', { name: /nombre/i }))

    expect(nombresEnOrden()).toEqual(['Enfermería', 'Contabilidad', 'agronomía'])
  })

  it('ordena los números por valor, no como texto', async () => {
    const user = userEvent.setup()
    renderTabla()

    await user.click(screen.getByRole('button', { name: /año/i }))

    expect(nombresEnOrden()).toEqual(['Enfermería', 'Contabilidad', 'agronomía'])
  })

  it('manda los vacíos al final, ordene como ordene', async () => {
    const user = userEvent.setup()
    renderTabla()

    await user.click(screen.getByRole('button', { name: /nota/i }))
    expect(nombresEnOrden().at(-1)).toBe('agronomía')

    await user.click(screen.getByRole('button', { name: /nota/i }))
    expect(nombresEnOrden().at(-1)).toBe('agronomía')
  })

  it('no ofrece ordenar una columna sin criterio definido', () => {
    renderTabla()
    expect(screen.queryByRole('button', { name: /^fijo$/i })).not.toBeInTheDocument()
  })

  it('anuncia la dirección a lectores de pantalla con aria-sort', async () => {
    const user = userEvent.setup()
    renderTabla()

    await user.click(screen.getByRole('button', { name: /nombre/i }))

    expect(screen.getByRole('columnheader', { name: /nombre/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
  })
})
