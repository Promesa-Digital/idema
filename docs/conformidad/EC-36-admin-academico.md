# EC-36 — Revisión de conformidad del usuario administración y académico

Revisión de las educciones relacionadas con los roles de staff **Académico** y
**Administración** (EDU-08) contra las vistas del panel admin
(`src/pages/admin/*`, `src/components/layout/AdminLayout.tsx`, `src/App.tsx`):

- **EDU-01 · Gestión de Programas** (rol Académico) — Educido, Vital.
- **EDU-06 · Gestión de Comprobantes** (rol Administración) — Propuesto, pendiente de S-2.
- **EDU-12 · Gestión de Reportes** (Marketing + Administración) — Propuesto, pendiente de S-2.
- **EDU-13 · Gestión de Conciliación de Pagos** (rol Administración) — Propuesto, pendiente de S-2.

No se contó con el texto completo de ILA/ESP de estas educciones; la validación se
hizo contra la descripción, campos, estados y reglas de negocio del catálogo (v2.1).
Recordatorio: EDU-06/12/13 están marcadas **Propuesto** en el propio catálogo — su
incompletitud es esperada, no es en sí misma una no conformidad, salvo que contradiga
algo que la educción sí afirma con certeza.

## Conforme

| Punto de la educción | Evidencia en código |
|---|---|
| EDU-01: CRUD de Programas (crear/leer/editar/archivar, sin DELETE físico) | `ProgramasAdminPage.tsx`, `ProgramaNuevoPage.tsx`, `ProgramaEditarPage.tsx`, `archivarPrograma` (`adminProgramasApi.ts`) |
| EDU-01: campos del formulario coinciden con la lista de la educción | `ProgramaForm.tsx` (código, abreviatura, nombre, categoría, malla, descripción, año, núm. lecciones, certificado, tutor) |
| EDU-01: 3 estados (No publicado/Publicado/Archivado) | `schemas/programa.ts` → `programaEstados` |
| EDU-01: publicación programada a futuro | Campo `publicacion_programada` en `ProgramaForm.tsx` |
| EDU-01: precio NO es campo del programa (vive en EDU-09) | `types/admin.ts` (`Programa`) no tiene `precio`/`monto` |
| EDU-01: sin cohortes ni control de vacantes | No aparece ningún campo de fecha de inicio ni cupos en el formulario |
| EDU-13: estados Abierta/En revisión/Cerrada | `types/index.ts` → `ConciliacionEstado` |
| EDU-13: Crear (toma automáticamente órdenes pagadas del periodo), Leer, Cerrar (no editable después) | `ConciliacionesAdminPage.tsx`, `api/conciliaciones.ts` |
| EDU-12: no usa CRUD completo, solo Consultar/Exportar (correcto para su definición) | `AdminReportsPage.tsx` — sin crear/editar/eliminar reportes |
| Rol Académico solo ve Programas; rol Administración solo ve su área (Finanzas/Alumnos) | `AdminLayout.tsx` → `NAV_GROUPS_BY_ROLE` |

## No conforme / a validar

1. **[CORREGIDO] Falta el ítem "Electivos" en el menú lateral de Académico y Administración.**
   La ruta `admin/electivos` existe y está permitida para ambos roles
   (`App.tsx:157-159`, `allowedRoles={['academico','administracion']}`), y
   `AdminResourcePage.tsx` ya trae la configuración completa de la vista
   (`titles`/`keys`/`getElectivos`). Pero `AdminLayout.tsx` → `NAV_GROUPS_BY_ROLE`
   no incluye ningún `NavItem` de Electivos en `academico` ni en `administracion` —
   solo es alcanzable escribiendo la URL a mano.

2. **[CORREGIDO] El motivo de anulación de un comprobante estaba fijo, no era libre.**
   `ComprobantesAdminPage.tsx:29` llama
   `anularComprobante(id, 'Anulación desde panel administrativo')` con un string
   literal. La API (`comprobantes.ts:27-30`) sí acepta un motivo libre (lo exige el
   backend para la nota de crédito), pero la UI nunca le da al usuario un campo
   para escribirlo.

3. **[Propuesto, gap esperado] EDU-06: "Emitir" comprobante no está en el panel admin.**
   `emitirComprobante` existe en `api/comprobantes.ts` pero no se invoca desde
   ningún componente admin — `ComprobantesAdminPage` solo permite Leer y Anular.
   Coherente con que EDU-06 sigue "Propuesto"; se deja como gap documentado, no
   como corrección de esta revisión.

4. **[Propuesto, gap esperado] EDU-13: "Actualizar" (marcar conciliadas / registrar
   diferencias) no está en la UI.** `conciliarOrdenes` existe en
   `api/conciliaciones.ts` pero no tiene ningún botón que la invoque —
   `OrdenesDeConciliacion` en `ConciliacionesAdminPage.tsx` solo muestra el estado
   de cada orden en modo lectura. Igual que el punto 3, es un gap propio de una
   educción aún Propuesta, no una corrección de esta revisión.

5. **[Propuesto, gap esperado] EDU-12: sin selector manual de "tipo de reporte".**
   La vista se decide automáticamente por el rol (`isMarketing` en
   `AdminReportsPage.tsx`) en vez de un "Configurar" explícito. Además, la
   analítica de popups está explícitamente sin implementar (nota propia del código:
   *"El backend actual no expone vistas ni clics"*). Documentado, no corregido.

6. **[Requiere decisión de arquitectura — no es un bug de frontend] Aprobación de
   cambios de precio (regla de negocio de EDU-01, Educido).**
   La educción dice "un usuario admin aprueba los cambios de precio". En el código
   no existe ningún flujo de aprobación: `ConceptoCobroEstado` solo tiene
   `'activo'|'inactivo'` (sin `pendiente`), y además la ruta
   `/admin/conceptos-cobro` está restringida solo a `admin_sistema`
   (`App.tsx:135-138`) — ni Académico ni Administración pueden siquiera verla. El
   precio se edita libremente por `admin_sistema`, sin ningún paso intermedio.
   Esto requeriría un nuevo estado en el backend y una decisión de flujo (¿quién
   propone, quién aprueba?); no se puede resolver solo en el frontend.

## Correcciones aplicadas en esta rama

- `AdminLayout.tsx`: se agregó el `NavItem` "Electivos" a los grupos `academico` y
  `administracion` (coincide con los roles que ya tenían acceso a la ruta en
  `App.tsx`). Verificado en navegador con un JWT de prueba por rol: el ítem
  aparece y navega correctamente en ambos.
- `ComprobantesAdminPage.tsx`: el diálogo de anulación pasó de `ConfirmModal`
  (mensaje fijo) a un `Modal` con formulario que pide el motivo, lo valida como
  requerido y lo envía tal cual a `anularComprobante`. Sigue el mismo patrón que
  `NuevaConciliacionModal` en `ConciliacionesAdminPage.tsx`.
- `npx tsc -b` y `npx eslint` sin errores sobre los archivos tocados.

## No corregido en esta rama (por diseño)

- Puntos 3, 4 y 5 (emitir comprobante, marcar conciliadas, selector de tipo de
  reporte): gaps esperados de educciones aún "Propuesto" — requieren la sesión
  S-2 con Administración antes de construir la funcionalidad, no son bugs de esta
  revisión.
- Punto 6 (aprobación de cambios de precio): requiere una decisión de arquitectura
  y cambios de backend (nuevo estado en `ConceptoCobro`, definir quién aprueba)
  que exceden el alcance de una corrección de frontend.
