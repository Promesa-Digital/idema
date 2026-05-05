# Server-side proxies

Archivos PHP que viven en el hosting de `idema.edu.pe`, **no** en el bundle de la SPA.

## `lead_intake_proxy.php`

Recibe los POST de los formularios web (popup y Contáctanos), agrega la API key
del CRM (que SOLO vive en el servidor) y reenvía a
`https://leads.idema.edu.pe/api/public/lead-intake`.

### Deploy

1. Subir `lead_intake_proxy.php` a `idema.edu.pe/php/` (junto al
   `noticias_proxy.php` que ya existe).
2. Setear la API key. Hay dos formas — elegir UNA:

   **Opción 1 — Variable de entorno (recomendado)**

   Editar el `.htaccess` del directorio `php/` (crear si no existe) y agregar:

   ```apache
   SetEnv IDEMA_CRM_API_KEY "f92c36f42bd2eb3b6e5437f5cd9b247f80fd183f9c318f944c4bebd5604cca8c"
   ```

   **Opción 2 — Editar el PHP en el servidor**

   En `lead_intake_proxy.php`, reemplazar `__REPLACE_WITH_API_KEY__` por la key
   real. **Hacer el cambio solo en el archivo del servidor**, no en el repo
   (evitar que la key entre a git).

3. Verificar que responda:

   ```bash
   curl -i -X POST https://idema.edu.pe/php/lead_intake_proxy.php \
     -H "Content-Type: application/json" \
     -d '{}'
   # Debe responder 400 invalid_payload (no 500 server_misconfigured)
   ```

### Cambiar el asesor asignado

Editar la constante `LEAD_ASESOR_USERNAME` dentro del PHP. Hoy:
`geralhanari@gmail.com`.

### Rotación de API key

Pedir nueva key al equipo de sistemas de IDEMA y actualizar la env var (o el
fallback en el PHP). El cliente no necesita ningún cambio.
