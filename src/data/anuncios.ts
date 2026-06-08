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
export const anuncios: Anuncio[] = []
