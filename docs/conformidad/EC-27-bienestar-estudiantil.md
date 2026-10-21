# EC-27 — Pruebas de Bienestar Estudiantil: datos inválidos y válidos; llegada al correo

Formulario probado: `CitaForm` (`src/components/bienestar/CitaForm.tsx`), usado en
`/bienestar` (3 servicios, con selector) y `/bienestar/:slug` (1 servicio fijo).

Nota: "Bienestar Estudiantil" no forma parte del catálogo de 14 educciones (EDU-01
a EDU-14) que se usó en EC-25/26 — es una sección institucional aparte del sitio
público, así que esta prueba no valida contra ninguna educción/ilación, solo
contra el comportamiento real implementado.

## Alcance y límite importante

El formulario **no pega contra ningún backend propio de IDEMA**: hace `POST`
directo a `https://formsubmit.co/bienestar.estudiantil@idema.edu.pe`
(`CitaForm.tsx:8`) — un servicio de terceros (FormSubmit.co) que reenvía la
sumisión como correo real a esa bandeja institucional. Es la bandeja real del
área de Bienestar Estudiantil, no un ambiente de prueba.

**Antes de probar el envío, se le preguntó al usuario cómo proceder** dado que no
hay forma de verificar la "llegada al correo" sin acceso a esa bandeja. Se decidió
**no enviar una solicitud real**: se interceptó `window.fetch` en el navegador
para bloquear cualquier llamada a `formsubmit.co` (devolviendo un `200` simulado
sin que la petición saliera a la red), y así poder probar el comportamiento de la
UI (validación, estados de error, pantalla de éxito) sin generar un correo real
ni una notificación real hacia el área de Bienestar.

**Consecuencia: "verificar llegada al correo" no se pudo completar en esta
revisión.** Queda pendiente que alguien con acceso a
`bienestar.estudiantil@idema.edu.pe` (o al panel de FormSubmit.co asociado a esa
cuenta) envíe una solicitud real desde el sitio y confirme que el correo llega,
con el asunto y los campos esperados.

## Pruebas ejecutadas — datos inválidos

Envío del formulario completamente vacío en `/bienestar` (3 servicios):

| Campo | Resultado esperado | Resultado obtenido |
|---|---|---|
| Servicio | "Selecciona el servicio solicitado." | ✅ |
| Nombre completo | "El nombre debe tener al menos 3 caracteres." | ✅ |
| Correo electrónico | "El correo es obligatorio." | ✅ |
| Teléfono / WhatsApp | "Ingresa tu teléfono." | ✅ |
| Consentimiento | "Debes autorizar el tratamiento de tus datos personales." | ✅ |

Casos inválidos específicos (con tecleo real, no eventos sintéticos):

| Campo | Valor de prueba | Resultado esperado | Resultado obtenido |
|---|---|---|---|
| Nombre | `Juan123` | "El nombre solo debe contener letras." | ✅ |
| Correo | `juan@gmial.com` | "¿Quisiste decir @gmail.com?" (detección de typo) | ✅ |
| Teléfono | `812345678` (empieza con 8) | "Debe empezar con 9." | ✅ |

El error de un campo se limpia de inmediato al volver a editarlo (antes de
reenviar), sin esperar a un nuevo submit — probado en vivo tecleando sobre un
campo con error ya visible.

## Prueba ejecutada — datos válidos

Con `fetch` interceptado (sin salir a la red real), se completó el formulario con
datos válidos (nombre "Juan Perez", correo "juan.perez@gmail.com", teléfono
"987654321", servicio "Servicio Médico (Tópico)", consentimiento marcado) y se
envió:
- La validación pasó sin errores.
- Se disparó el `POST` real hacia `formsubmit.co` (interceptado antes de salir).
- La UI mostró correctamente la pantalla de éxito: "✓ Tu solicitud fue enviada" +
  "Nos comunicaremos contigo a la brevedad para confirmar tu cita." + botón
  "Solicitar otra cita" (que resetea el formulario).
- Sin errores en la consola del navegador durante todo el flujo.

## Nota metodológica (para dejar registrado, no es un hallazgo del producto)

Durante la prueba, simular el llenado de campos con eventos sintéticos
(`dispatchEvent(new Event('input'))` vía JavaScript en vez de tecleo real) dejó
en un momento mensajes de error "pegados" en pantalla pese a que el valor del
campo ya era válido. Se verificó con tecleo real que **esto no es un bug de la
app** — es un artefacto de cómo se simuló el evento en la prueba, no del
comportamiento real con un usuario. Se deja anotado por si se automatizan estas
pruebas más adelante (ej. Playwright/Testing Library): usar sus helpers de
`fireEvent`/`userEvent`, no `dispatchEvent` manual con eventos genéricos.

## Hallazgos

Ninguno a nivel de código — la validación (casos inválidos) y el flujo de envío
(caso válido) funcionan como se espera. El único pendiente es el que ya se
señaló arriba: **confirmar la llegada real del correo**, que requiere acceso a la
bandeja `bienestar.estudiantil@idema.edu.pe` o al panel de FormSubmit.co, algo
que esta sesión no tiene.

## Recomendación

- Que alguien del equipo con acceso a esa bandeja envíe una solicitud real de
  prueba (ej. desde `/bienestar/servicio-medico`) y confirme: que el correo
  llega, que el asunto es "Nueva solicitud de cita - Bienestar Estudiantil
  IDEMA", y que los 5 campos (nombre, correo, teléfono, servicio, motivo) llegan
  legibles.
- Dado que la captación depende 100% de un servicio de terceros (FormSubmit.co)
  sin ningún backend propio de por medio, vale la pena confirmar con el equipo si
  eso es intencional (¿hay un plan de captar leads de Bienestar en el mismo
  sistema que Ventas usa para EDU-07?) o si en algún momento se planea moverlo a
  un backend propio.
