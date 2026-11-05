# EC-26 — Pruebas del flujo de popups (crear → aprobar → publicar) y captación de leads (formulario → ManyChat)

## Alcance y límite importante

Igual que en EC-25: este repo es solo frontend, sin backend disponible en este
entorno. Además, la captación de leads del sitio público apunta a un **proxy PHP
que sí es real y sí está vivo** (`https://idema.edu.pe`, ver hallazgo 4) — por
eso esta revisión **no envió ningún formulario de contacto real**: hacerlo
habría creado un lead de prueba en el sistema de producción y potencialmente
disparado una notificación real a un asesor de ventas vía ManyChat. Ese tramo
del flujo se documenta por lectura de código, no probado en vivo.

## Flujo de Popups (crear → aprobar → publicar)

### Lo que se probó en vivo
Con un JWT de prueba de rol `marketing`, en `/admin/popups/nuevo`:
- Con `tipo = anuncio`: el formulario muestra los 7 campos base (texto, imagen,
  video, enlace, páginas, fecha inicio/fin). Correcto.
- Cambiando `tipo = descuento`: antes de esta rama, el formulario se quedaba
  igual (sin `monto_descuento`/`duracion_temporizador`/`texto_superior`, ver
  hallazgo 1). Después de la corrección de esta rama: aparecen los 3 campos
  nuevos ("Texto superior", "Monto del descuento (S/)", "Duración del
  temporizador (min)"), se completaron y el submit disparó un
  `POST /popups` real (confirmado por `read_network_requests`; 404 solo porque
  no hay backend en este entorno) — la validación cliente ya no bloquea el
  registro de un popup de descuento completo.

### Hallazgos

1. **[CORREGIDO] El formulario admin no permitía capturar los campos propios de
   "descuento".** La interfaz `Popup` (`src/types/admin.ts:60-62`) ya declaraba
   `monto_descuento`, `duracion_temporizador` y `texto_superior` (el backend ya
   los soporta), pero `popupSchema`, `PopupForm.tsx`, `toPayload()` en
   `adminPopupsApi.ts` y `toFormFields()` en `PopupEditarPage.tsx` nunca los
   incluían — no había forma de crear o editar un popup de descuento completo
   desde el panel. Corregido: los 3 campos ahora se muestran solo cuando
   `tipo === 'descuento'`, son obligatorios en ese caso (`popupSchema` con
   `superRefine`), se envían en el payload (coeccionados a número donde
   corresponde) y se precargan al editar.

2. **[Documentado, no corregido — feature grande, no es un bug puntual] El
   popup público (`AnnouncementModal.tsx`) no implementa buena parte de las
   reglas de EDU-02 para el tipo "descuento":**
   - No distingue `tipo` en absoluto — todo popup (anuncio o descuento) se
     renderiza igual: imagen + texto + CTA. `video_url`, `monto_descuento`,
     `duracion_temporizador` y `texto_superior` nunca se leen.
   - No hay temporizador de 10 minutos.
   - La frecuencia de aparición está hardcodeada a `'session'` para todos los
     popups (línea 78) — no implementa "cada visita" para anuncio vs. "una vez
     por día" para descuento, aunque la lógica de `wasDismissed`/`markDismissed`
     ya soporta `'day'`/`'always'`, solo que nunca se le pasa el valor correcto.
   - No hay desempate "prevalece el último activado" cuando dos popups compiten
     por la misma página — `pickAnuncio()` toma el primero que matchea, sin
     ordenar por fecha de activación.
   - No hay comportamiento diferenciado móvil/escritorio.
   - Sí cumple: filtro por página, rango de fechas, y disparo con un pequeño
     delay al cargar.
   Construir el modal de descuento completo (temporizador, texto superior,
   distinción de frecuencia, desempate, responsive) es trabajo de feature
   nuevo, no una corrección de esta prueba — queda documentado para que el
   equipo lo priorice.

3. **Confirmado (no es un hallazgo):** el flujo de aprobación
   Borrador→Pendiente→Aprobado/Rechazado→Publicado→Finalizado está completo en
   `adminPopupsApi.ts` (`enviarAprobacionPopup`, `aprobarPopup`, `rechazarPopup`,
   `publicarPopup`, `finalizarPopup`, cada uno contra su propio endpoint) y los
   estados en `PopupEstado` coinciden exactamente con la educción. El gating de
   quién ve los botones de Aprobar/Rechazar/Publicar/Finalizar
   (`director_marketing` únicamente) ya se probó y documentó en EC-25 (hallazgo
   2 de ese informe) — es solo protección de UI, la validación real debe
   confirmarse contra el backend.

## Captación de Leads (formulario → ManyChat)

### Hallazgos

4. **[Crítico, requiere decisión del equipo — no es corregible desde este
   repo] La captación de leads del sitio público y el panel admin de Leads son
   dos sistemas desconectados.**
   Los dos formularios reales de captación (`ContactSection.tsx:115-122` y
   `Navbar.tsx:233-240`, dropdown "Asesoría IDEMA") sí hacen un POST real — pero
   vía `submitLead()` (`src/utils/leadIntake.ts:47-93`), que llama
   `fetch('/php/lead_intake_proxy.php')`, proxied (`vite.config.ts:19-20`)
   directo a `https://idema.edu.pe` — el **mismo backend PHP legado que sirve
   noticias**, un sistema completamente distinto del backend REST
   (`/api/v1/leads`) que lee `LeadsAdminPage.tsx` (vía `getLeads`/
   `updateLeadEstado` en `src/api/leads.ts`, que no tiene ninguna función de
   creación). No hay evidencia en el frontend de que el proxy PHP escriba en la
   misma tabla que expone `/api/v1/leads` — son, desde este repo, dos tuberías
   sin conexión visible.
   **Consecuencia para esta prueba:** el tramo "formulario → aparece en el panel
   de Leads" no tiene, del lado frontend, un camino verificable de extremo a
   extremo. No se puede confirmar ni descartar la conexión sin acceso al backend
   o al PHP proxy.

5. **[Confirmado] Cero menciones de "ManyChat" en todo el frontend** (`grep`
   sobre `src/` y `.env*` sin resultados). La integración con ManyChat que
   describe EDU-07 es, en el mejor de los casos, 100% backend/externa —
   invisible y no probable desde este código.

6. **[Documentado, no corregido] No existe ningún formulario de captación
   embebido en el popup de tipo "descuento".** `AnnouncementModal` no tiene
   ningún campo de formulario, solo imagen + CTA de enlace. El origen `'popup'`
   de `LeadOrigen` (`src/types/index.ts:390`) no tiene ningún productor en el
   código — ningún componente asigna `origen: 'popup'` a un lead. Si la
   intención de EDU-07 ("formularios de popup y contacto") es que el descuento
   capture datos directamente, falta construir ese formulario — ligado al mismo
   trabajo pendiente del hallazgo 2.

7. **[Documentado, no corregido — ambigüedad de diseño, no un bug de UI] No hay
   transición a estado `'pago'` en el panel de Leads.**
   `LeadsAdminPage.tsx` solo tiene botones para `nuevo→contactado` y
   `*→descartado`; ningún botón lleva un lead a `'pago'`, aunque
   `updateLeadEstado` acepta cualquier `LeadEstado`. No se agregó un botón
   manual de "Marcar como pagado" porque la propia educción sugiere que esta
   transición debería ser **automática** ("el sistema identifica si el lead ya
   pagó... un lead que paga se convierte en alumno"), no una acción manual de
   Ventas — construir eso a mano podría ir en contra del diseño real (que
   probablemente dispara este cambio desde el backend cuando la orden del
   alumno se paga, no desde el panel de leads). Queda para que el equipo
   confirme la intención antes de tocar código.

8. **[Documentado, no corregido — requiere campo nuevo en backend] Falta el
   campo "asesor asignado"** que pide EDU-07. La interfaz `Lead`
   (`src/types/index.ts:390-401`) no lo tiene, y `LeadsAdminPage.tsx` no lo
   muestra ni lo permite asignar. La rotación en `src/data/whatsapp.ts` es un
   mecanismo distinto y no relacionado: solo decide a qué número `wa.me` abre un
   botón de contacto directo del visitante, no persiste ni asocia nada a un
   registro `Lead`.

## Recomendación

- Confirmar con el equipo si el proxy PHP de leads (hallazgo 4) efectivamente
  alimenta el mismo backend que lee el panel admin, o si son sistemas separados
  a propósito (y en ese caso, cómo se supone que un lead capturado en el sitio
  llega al panel de Ventas).
- Repetir la prueba de "formulario → ManyChat" contra un ambiente de staging
  (no producción) para no generar leads/notificaciones reales.
- Priorizar, si se decide construir el modal de descuento completo (hallazgo 2),
  incluir el formulario de captación embebido (hallazgo 6) en el mismo trabajo,
  ya que ambos dependen del mismo componente.
