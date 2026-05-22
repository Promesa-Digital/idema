import type { Anuncio } from '../types'

/**
 * Registro de anuncios full-screen.
 * Para programar uno nuevo:
 *   1. Coloca la imagen en `src/assets/anuncios/`.
 *   2. Agrega una entrada con `id` único (también es la clave de "no volver a mostrar").
 *   3. Define `startDate`/`endDate` (ISO `YYYY-MM-DD`, inclusivos) para limitar la ventana.
 *   4. `frequency`: 'session' (default) | 'day' | 'always'.
 *   5. `pages`: rutas donde aparece (default solo `'/'`).
 * Se muestra el primero cuyo rango y página coinciden y que el usuario no haya descartado.
 */
// Popup del día (home): 22/05/2026 hasta 23:59 (hora local del navegador)
export const anuncios: Anuncio[] = [
  {
    id: 'excel-basico-live-2026-05-22',
    image: '/assets/img/anuncios/excel-basico-live.webp',
    alt: 'Ruta al éxito digital: Potencia tu carrera con Excel básico (Live)',
    startDate: '2026-05-22',
    endDate: '2026-05-22',
    frequency: 'session',
    pages: ['/'],
  },
]
