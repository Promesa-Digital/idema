# EC-25 — Pruebas de roles: operaciones con rol incorrecto en endpoints críticos

Objetivo: intentar operaciones con rol incorrecto en todos los endpoints críticos y
confirmar que se bloquean.

## Alcance y límite importante

Este repo es **solo frontend** (SPA React). No hay backend disponible en este
entorno (`Idema_backend` es un repo hermano fuera del acceso de esta sesión, y no
hay servidor corriendo en `localhost:8000`). Esto define el límite real de esta
prueba:

- **Sí se puede probar**: que el guard de rutas del frontend (`PrivateRoute`)
  bloquea correctamente la navegación a cada pantalla según el rol.
- **No se puede probar aquí**: si el backend rechaza (403) una llamada a la API
  hecha con el rol equivocado. Esto es lo que de verdad importa para la
  seguridad — el guard de frontend es una guía de UX, no un límite de seguridad.
  Cualquier persona con acceso a las herramientas de desarrollador del navegador
  puede editar su propio JWT en `localStorage` y ver el rol que quiera en el
  cliente (se hizo exactamente eso para esta prueba, ver método más abajo) — la
  única defensa real es que el backend vuelva a validar el rol en cada endpoint,
  independientemente de lo que el frontend muestre u oculte.

**Conclusión de alcance: esta revisión confirma que el frontend está bien armado
para guiar al usuario, pero NO reemplaza una prueba de roles contra el backend
real (o staging) con tokens legítimos de cada rol contra cada endpoint. Esa
prueba debe hacerse aparte, con acceso al backend.**

## Método

`src/context/AuthContext.tsx` decodifica el rol del JWT en el cliente sin
verificar firma (comentario propio: *"verification happens server-side"*), así
que para probar cada rol bastó con escribir en `localStorage` un JWT no firmado
con el claim `rol` deseado y navegar a cada ruta. Se validó:
1. Cada ruta protegida (`/admin/*`, `/portal/*`) contra un rol que NO debería
   entrar → se espera redirección a `/unauthorized`.
2. Al menos una ruta por área contra el rol correcto → se espera que renderice.
3. Una ruta sin sesión → se espera redirección a `/login`.

## Matriz completa de rutas (de `src/App.tsx`)

| Ruta | Roles permitidos |
|---|---|
| `/portal/*` (dashboard, matrículas, checkout, electivos, pagos, comprobantes, mi-cuenta) | `alumno` |
| `/admin` (dashboard) | cualquier staff (`admin_sistema`, `academico`, `marketing`, `director_marketing`, `ventas`, `administracion`) |
| `/admin/programas`, `/nuevo`, `/:id/editar` | `academico`, `admin_sistema` |
| `/admin/popups`, `/nuevo`, `/:id/editar` | `marketing`, `director_marketing`, `admin_sistema` |
| `/admin/usuarios` | `admin_sistema` |
| `/admin/conceptos-cobro` | `admin_sistema` |
| `/admin/combos`, `/admin/descuentos` | `ventas`, `marketing`, `director_marketing`, `admin_sistema` |
| `/admin/leads` | `ventas`, `marketing`, `director_marketing`, `administracion`, `admin_sistema` |
| `/admin/cuentas-alumnos`, `/admin/ordenes`, `/admin/comprobantes` | `admin_sistema`, `administracion` |
| `/admin/matriculas` | `administracion` (**no** `admin_sistema**, ver hallazgo 1) |
| `/admin/conciliaciones` | `administracion`, `admin_sistema` |
| `/admin/electivos` | `academico`, `administracion` (**no** `admin_sistema`, ver hallazgo 1) |
| `/admin/reportes` | `marketing`, `director_marketing`, `administracion`, `admin_sistema` |

## Pruebas ejecutadas y resultado

| # | Rol usado | Ruta objetivo | Esperado | Resultado |
|---|---|---|---|---|
| 1 | `alumno` | `/admin/programas` | bloqueado | ✅ → `/unauthorized` |
| 2 | `ventas` | `/admin/usuarios` | bloqueado | ✅ → `/unauthorized` |
| 3 | `academico` | `/admin/comprobantes` | bloqueado | ✅ → `/unauthorized` |
| 4 | `academico` | `/admin/programas` | permitido | ✅ renderiza "Programas" |
| 5 | `marketing` | `/admin/matriculas` | bloqueado | ✅ → `/unauthorized` |
| 6 | `administracion` | `/admin/programas` | bloqueado | ✅ → `/unauthorized` |
| 7 | `administracion` | `/admin/comprobantes` | permitido | ✅ renderiza "Comprobantes" |
| 8 | `director_marketing` | `/admin/conceptos-cobro` | bloqueado | ✅ → `/unauthorized` |
| 9 | `admin_sistema` | `/admin/matriculas` | *se esperaba permitido por el comentario "ve todo"* | ⚠️ → `/unauthorized` (ver hallazgo 1) |
| 10 | sin sesión | `/admin/leads` | bloqueado | ✅ → `/login` |

El mecanismo de guard (`PrivateRoute`) es el mismo componente compartido en las 16
rutas protegidas — no hay lógica custom por ruta que pueda divergir — así que esta
muestra representativa (distintas áreas, distintos niveles de anidamiento, con y
sin sesión) es suficiente para confirmar que el mecanismo funciona de forma
consistente en todo el árbol de rutas.

## Hallazgos

1. **`admin_sistema` no puede entrar a `/admin/matriculas` ni a `/admin/electivos`**,
   pese a que el comentario en `AdminLayout.tsx:56` dice *"admin_sistema ve todo"*.
   Confirmado en código (`App.tsx:151-153` y `157-159`, `allowedRoles` no incluye
   `admin_sistema`) y en vivo (prueba #9). **Decisión (2026-08-27): queda
   documentado, sin tocar** — es un cambio de política de permisos, no un bug de
   UI, y el equipo debe decidirlo a propósito.

2. **[Crítico, requiere verificación contra backend] Las acciones de aprobar,
   rechazar, publicar y finalizar un popup solo están protegidas ocultando los
   botones en el frontend.**
   En `PopupsAdminPage.tsx:111-154`, los botones de Aprobar/Rechazar/Publicar/
   Finalizar se renderizan solo si `user?.role === 'director_marketing'` — pero
   la ruta `/admin/popups` permite tanto a `marketing` como a `director_marketing`
   (`App.tsx:130`). Un usuario `marketing` (no director) tiene una sesión válida
   y puede llegar a esa pantalla; las funciones `aprobarPopup`/`rechazarPopup`/
   `publicarPopup`/`finalizarPopup` (`src/api/adminPopupsApi.ts`) no tienen
   ningún chequeo de rol adicional más allá de que el botón esté oculto. Si abre
   las herramientas de desarrollador y llama directamente al endpoint (con su
   propio token real de `marketing`, sin necesidad de falsificar nada), nada en
   el frontend se lo impide.
   **Esto solo es seguro si el backend re-valida `director_marketing` en cada uno
   de esos 4 endpoints.** No se pudo confirmar contra el backend real en este
   entorno — es el hallazgo de mayor prioridad para probar aparte, con acceso al
   backend, usando un token legítimo de `marketing` contra
   `POST /popups/{id}/aprobar` (y rechazar/publicar/finalizar) esperando `403`.

3. **Confirmado (no es un hallazgo, es tranquilidad):** `httpClient.ts` solo
   agrega `Authorization: Bearer <token>` a cada request — no hay ningún header
   custom de rol (`X-Role` o similar) que el frontend le pase al backend y que
   este pudiera terminar confiando ciegamente. El backend solo tiene el JWT para
   decidir; correcto por diseño.

4. **Confirmado (no es un hallazgo):** `AdminDashboardPage.tsx` arma sus queries
   condicionalmente por rol (`{user?.role === 'x' && <XDashboard/>}`) — un
   usuario de un área nunca dispara ni siquiera la llamada a la API de otra área
   al cargar el dashboard general.

## Recomendación

Repetir esta prueba (o una versión con `curl`/Postman) contra el backend real o
un ambiente de staging, con un token legítimo de cada rol, golpeando
directamente cada endpoint de escritura crítico (no solo navegando el frontend) —
en particular los 4 de aprobación de popups del hallazgo 2, y en general
cualquier `POST`/`PATCH`/`DELETE` de las áreas de Programas, Órdenes,
Comprobantes, Conciliaciones y Usuarios — esperando `403` para todo rol fuera de
la lista permitida.
