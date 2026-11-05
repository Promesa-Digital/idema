import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ListEditor, PairListEditor } from './ListEditor'
import type { ParDeCampos } from './ListEditor'

/** Envoltorio con estado real: prueba el componente como se usa, no su API aislada. */
function ListaConEstado({ inicial = [] as string[] }) {
  const [valor, setValor] = useState<string[]>(inicial)
  return (
    <>
      <ListEditor label="Requisitos" textoAgregar="Añadir requisito" value={valor} onChange={setValor} />
      <output data-testid="salida">{JSON.stringify(valor)}</output>
    </>
  )
}

function ParesConEstado({ inicial = [] as ParDeCampos[] }) {
  const [valor, setValor] = useState<ParDeCampos[]>(inicial)
  return (
    <>
      <PairListEditor
        label="Malla detallada"
        etiquetaPrimero="Periodo"
        etiquetaSegundo="Cursos"
        textoAgregar="Añadir periodo"
        value={valor}
        onChange={setValor}
      />
      <output data-testid="salida">{JSON.stringify(valor)}</output>
    </>
  )
}

describe('ListEditor', () => {
  it('avisa cuando no hay elementos en vez de mostrar un hueco vacío', () => {
    render(<ListaConEstado />)
    expect(screen.getByText('Todavía no hay elementos.')).toBeInTheDocument()
  })

  it('añade una fila y guarda lo que se escribe en ella', async () => {
    const user = userEvent.setup()
    render(<ListaConEstado />)

    await user.click(screen.getByRole('button', { name: /añadir requisito/i }))
    await user.type(screen.getByRole('textbox'), 'Secundaria completa')

    expect(screen.getByTestId('salida')).toHaveTextContent('["Secundaria completa"]')
  })

  it('quita la fila correcta y no la de al lado', async () => {
    const user = userEvent.setup()
    render(<ListaConEstado inicial={['uno', 'dos', 'tres']} />)

    await user.click(screen.getByRole('button', { name: /quitar elemento 2/i }))

    expect(screen.getByTestId('salida')).toHaveTextContent('["uno","tres"]')
  })

  it('numera las filas para que el orden sea evidente', () => {
    render(<ListaConEstado inicial={['a', 'b']} />)
    expect(screen.getByRole('button', { name: /quitar elemento 1/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /quitar elemento 2/i })).toBeInTheDocument()
  })
})

describe('PairListEditor', () => {
  it('mantiene los dos campos separados, sin que nadie escriba un separador', async () => {
    const user = userEvent.setup()
    render(<ParesConEstado />)

    await user.click(screen.getByRole('button', { name: /añadir periodo/i }))
    await user.type(screen.getByLabelText('Periodo'), 'Ciclo I')
    await user.type(screen.getByLabelText('Cursos'), 'Anatomía; Ética')

    expect(screen.getByTestId('salida')).toHaveTextContent(
      '[{"primero":"Ciclo I","segundo":"Anatomía; Ética"}]',
    )
  })

  it('edita una fila sin tocar las demás', async () => {
    const user = userEvent.setup()
    render(
      <ParesConEstado
        inicial={[
          { primero: 'Año 1', segundo: 'Anatomía' },
          { primero: 'Año 2', segundo: 'Farmacología' },
        ]}
      />,
    )

    const camposPeriodo = screen.getAllByLabelText('Periodo')
    await user.clear(camposPeriodo[1])
    await user.type(camposPeriodo[1], 'Año 3')

    expect(screen.getByTestId('salida')).toHaveTextContent(
      '[{"primero":"Año 1","segundo":"Anatomía"},{"primero":"Año 3","segundo":"Farmacología"}]',
    )
  })
})
