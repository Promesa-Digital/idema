# EC-35 — Revisión de conformidad del usuario alumno

Revisión de la educción **EDU-14 · Gestión de la Cuenta del Alumno** (única educción
relacionada con el "usuario alumno") contra las vistas implementadas en el frontend
(`src/pages/portal/*`, `src/pages/RegistroPage.tsx`, `src/pages/legal/*`, `src/App.tsx`).

No se contó con el texto completo de ILA-14.1–14.4 / ESP-14.1–14.4 (no están en el
repositorio); la validación se hizo contra la descripción, campos, estados y reglas de
negocio del catálogo de educciones (EDU-14, v2.1).

## Conforme

| Punto de la educción | Evidencia en código |
|---|---|
| Crear (registro directo) | `src/pages/RegistroPage.tsx` + `POST /auth/registro/alumno` (`src/api/registro.ts`) |
| Leer (perfil, matrículas, electivos, historial de pagos) | `MiCuentaPage`, `MatriculasPage`, `ElectivosPage`, `PagosPage` — todo vía API (`getMatriculas`, `getElectivos`, `getOrdenes`), sin duplicar datos |
| Actualizar (datos de contacto) | `DatosContactoCard` en `MiCuentaPage.tsx` → `PATCH /auth/me/contacto` |
| Eliminar (dar de baja) | `ZonaDePeligroCard` → `darDeBajaCuenta` → `POST /cuentas-alumnos/{id}/dar-de-baja` |
| Rol Alumno separado, sin acceso al panel admin | `PrivateRoute allowedRoles={['alumno']}` en `App.tsx`, portal en `/portal/*` |
| Referencia y no copia (matrículas/órdenes) | Comentarios explícitos en `matriculas.ts`, `electivos.ts`, `ordenes.ts`: "el backend filtra según quién pregunta" |

## No conforme / a validar

1. **[CORREGIDO] Estado de cuenta (Activa/Inactiva) hardcodeado en el portal.**
   La educción define `estado` como campo de la entidad Cuenta de Alumno y como
   flujo `Activa → Inactiva`. El tipo `AlumnoPerfil` no incluía `estado` y el
   portal lo pintaba como texto fijo (`MiCuentaPage.tsx`, `PortalLayout.tsx`).
   Corregido: `estado` ahora viaja en `AlumnoPerfil`/`AlumnoPerfilResponse`
   (`src/types/alumno.ts`, `src/api/alumnoApi.ts`) y ambos componentes leen el
   valor real devuelto por `/auth/me`, mostrando "Estudiante Inactivo" si
   corresponde. **Pendiente de confirmar con backend** que `GET /auth/me`
   efectivamente devuelve el campo `estado` — el frontend ya está listo para
   consumirlo, pero no se pudo verificar la respuesta real del API.

2. **[CORREGIDO] Consentimiento de datos (Ley 29733) no era una elección real.**
   La educción exige que el alumno "otorgue" consentimiento al registrarse. En
   `RegistroPage.tsx` el checkbox estaba `checked readOnly`: siempre marcado, sin
   poder desmarcarlo, y el tipo `RegistroAlumnoValues.consentimiento` era literal
   `true` (forzado también a nivel de tipos). Corregido: el checkbox es ahora
   controlado, empieza destildado, el envío se bloquea si no se marca, y el tipo
   pasó a `boolean`. **Sigue pendiente:** no hay evidencia de que el backend
   capture fecha/versión de la política aceptada — eso excede el frontend y debe
   confirmarse con backend.

3. **[PENDIENTE — decisión del equipo] `/eliminar-cuenta` es una página de fachada.**
   `src/pages/legal/EliminarCuentaPage.tsx` no llama a ningún endpoint — su
   `handleSubmit` solo hace `console.log` y muestra un toast de éxito simulado. Es
   una vía distinta a la "Zona de Peligro" real de `MiCuentaPage` (que sí llama a la
   API), y tal como está hoy no cumple una solicitud real de baja/eliminación bajo
   la ley citada en la propia página.
   **Decisión (2026-08-27):** no se modifica el código en esta rama; queda
   registrado como hallazgo pendiente hasta que el equipo defina si debe
   redirigir al flujo real de "Zona de Peligro" (autenticado) o si existe/debe
   crearse un endpoint público dedicado.

4. **Alta automática de cuenta al pagar un lead — no verificable desde el frontend.**
   La regla "un lead que paga se convierte en alumno: su cuenta se crea o vincula"
   depende de EDU-07 y no tiene contraparte visible en el frontend (no hay acción
   de "convertir lead" en el panel admin ni webhook client-side). Puede ser
   enteramente responsabilidad del backend; se deja como nota para confirmar con
   ese equipo, no como defecto de las vistas.

## Ilaciones revisadas (ILA-01 a ILA-06)

Se recibió el catálogo de ilaciones ILA-01 a ILA-06 (roles y permisos, integración
server-side con Culqi, estados de orden, correo transaccional, API de contenido,
no almacenamiento de datos de tarjeta). Ninguna de las seis depende de EDU-14 ni
describe comportamiento del "usuario alumno": apuntan a EDU-01/02/03/06/07
(roles/contenido/pasarela de pago/correo). Por alcance ("solo lo relacionado con
usuario alumno"), no se validaron contra código en esta revisión. Si existe una
ilación posterior (ILA-07 en adelante) que dependa de EDU-14, EDU-08 (rol Alumno)
o EDU-10, hace falta su texto para completar la revisión.

## Nota (no defecto)

El derecho de "consultar y corregir sus datos" se implementa solo para correo y
teléfono; DNI/nombres/apellidos son de solo lectura en el portal ("provienen de los
registros oficiales") y solo un admin puede corregirlos. Esto es consistente con el
propio texto de EDU-14, que en el CRUD dice explícitamente "Actualizar: el alumno
edita sus datos de contacto" — no se marca como no conformidad, solo se deja
registrado por si la intención real de "corregir sus datos" era más amplia.
