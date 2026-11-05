import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PopupPublicoBackend } from '@/types/backend'
import AnnouncementModal from './AnnouncementModal'

const listarPopupsPublicos = vi.fn()
const registrarInteraccionPopup = vi.fn()

vi.mock('@/services/popupsApi', () => ({
  listarPopupsPublicos: (...args: unknown[]) => listarPopupsPublicos(...args),
  registrarInteraccionPopup: (...args: unknown[]) => registrarInteraccionPopup(...args),
}))

const ANUNCIO: PopupPublicoBackend = {
  id: 'pop-1',
  tipo: 'anuncio',
  texto: 'Estudia hoy en IDEMA',
  imagen_url: '/assets/img/popups/x.webp',
  video_url: null,
  enlace: '/programas-de-estudio',
  paginas: '/',
  monto_descuento: null,
  duracion_temporizador: null,
  texto_superior: null,
  fecha_inicio: '2020-01-01',
  fecha_fin: '2099-12-31',
}

function montar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <AnnouncementModal />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  listarPopupsPublicos.mockReset().mockResolvedValue([ANUNCIO])
  registrarInteraccionPopup.mockReset().mockResolvedValue(undefined)
})

describe('AnnouncementModal: registro de interacciones', () => {
  it('cuenta una vista al mostrar el anuncio', async () => {
    montar()
    await screen.findByRole('dialog')

    expect(registrarInteraccionPopup).toHaveBeenCalledWith('pop-1', 'vista', '/')
  })

  it('no cuenta la vista dos veces aunque el efecto se repita', async () => {
    // StrictMode ejecuta los efectos dos veces en desarrollo, y una vista doble
    // falsea justo la métrica para la que existe el registro.
    const { rerender } = montar()
    await screen.findByRole('dialog')
    rerender(
      <MemoryRouter initialEntries={['/']}>
        <AnnouncementModal />
      </MemoryRouter>,
    )

    const vistas = registrarInteraccionPopup.mock.calls.filter((c) => c[1] === 'vista')
    expect(vistas).toHaveLength(1)
  })

  it('cuenta un clic al pulsar el enlace del anuncio', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('link', { name: /ver más/i }))

    expect(registrarInteraccionPopup).toHaveBeenCalledWith('pop-1', 'clic', '/')
  })

  it('cierra el popup al pulsar el enlace', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('link', { name: /ver más/i }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('cerrar con la X no cuenta como clic', async () => {
    const user = userEvent.setup()
    montar()
    await screen.findByRole('dialog')

    await user.click(screen.getAllByRole('button', { name: /cerrar popup/i })[0])

    expect(registrarInteraccionPopup.mock.calls.some((c) => c[1] === 'clic')).toBe(false)
  })

  it('si el registro falla, el popup se ve igual', async () => {
    registrarInteraccionPopup.mockRejectedValue(new Error('red caída'))
    montar()

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })

  it('sin popups no registra nada ni muestra diálogo', async () => {
    listarPopupsPublicos.mockResolvedValue([])
    montar()

    await waitFor(() => expect(listarPopupsPublicos).toHaveBeenCalled())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(registrarInteraccionPopup).not.toHaveBeenCalled()
  })
})
