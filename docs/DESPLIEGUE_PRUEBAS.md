# Despliegue en un espacio de pruebas (cPanel/WHM)

Para enseñar **solo el circuito de marketing** en el servidor `161.97.158.28`, sin tocar
las cuentas que ya existen (`eirlmarket.com`, `emmisor.com`).

---

## Antes de nada: tres cosas que pueden ensuciar producción

Un espacio de pruebas que manda datos reales a sitios reales deja de ser de pruebas.
Estas tres tienen que quedar así **desde el primer despliegue**, no después:

| Variable | Valor en pruebas | Qué pasa si no |
|---|---|---|
| `VITE_LEADS_LEGACY` | **`false`** | Cada lead de prueba se copia al sistema antiguo de `idema.edu.pe`. Ventas recibiría personas inventadas. |
| `LEADS_AVISO_DESTINO` | vacío, o un buzón de prueba | Los avisos de "lead nuevo" llegarían al correo real de Ventas. |
| `LEADS_NOTIFICAR_CRM` | **`false`** (ya es el valor por defecto) | Intentaría escribir en el ManyChat de producción. |

La primera es la más fácil de olvidar y la que más molesta: el sistema antiguo sigue en
pie y acepta lo que le llegue.

---

## 1. Crear la cuenta en WHM

*Esto lo haces tú desde WHM; no toca ninguna cuenta existente.*

**Account Functions → Create a New Account**

- **Domain:** un subdominio de pruebas, por ejemplo `pruebas.instituto-idema.org`
- **Username:** `idemaprue` (cPanel corta a 8–16 caracteres)
- **Package:** uno con acceso a base de datos y a aplicaciones Python
- **Deja sin marcar** cualquier opción de reseller

Crear una cuenta nueva no modifica las existentes: cada una vive en su propio `home`.

## 2. Comprobar que el servidor soporta el stack

Antes de subir nada, en la cuenta nueva:

- **cPanel → Setup Python App** — si no aparece, el backend no puede correr aquí y hay
  que hablar con el proveedor.
- **cPanel → PostgreSQL Databases** — si solo hay MySQL, el backend **no funciona tal
  cual**: usa PostgreSQL (`psycopg`), tipos `ENUM` nativos e índices parciales.

Si falta PostgreSQL hay dos caminos: pedir al proveedor que lo habilite, o usar una base
gestionada externa (Neon, Supabase, Railway) y apuntar `DATABASE_URL` allí. La segunda es
más rápida para unas pruebas.

## 3. Base de datos

En **PostgreSQL Databases**: crear base, crear usuario y asignarlo con todos los permisos.
Anota la cadena resultante:

```
DATABASE_URL=postgresql+psycopg://USUARIO:CLAVE@localhost:5432/BASE
```

## 4. Backend

Subir el repositorio a `~/idema_backend` (fuera de `public_html`).

**cPanel → Setup Python App:**

- Python 3.11 o superior
- Application root: `idema_backend`
- Application URL: `pruebas.instituto-idema.org/api`
- Startup file: `passenger_wsgi.py`
- Application Entry point: `application`

Luego, en el terminal virtual que da cPanel:

```bash
pip install -r requirements.txt
alembic upgrade head
SEED_SOLO_MARKETING=true python seed_demo.py
```

El `.env` del backend, como mínimo:

```
DATABASE_URL=postgresql+psycopg://...
SECRET_KEY=<una cadena larga y aleatoria, distinta a la de desarrollo>
FRONTEND_URL=https://pruebas.instituto-idema.org
CORS_ORIGINS=https://pruebas.instituto-idema.org
LEADS_NOTIFICAR_CRM=false
LEADS_AVISO_DESTINO=
LEADS_VENTANA_DUPLICADO_DIAS=30
```

`SEED_SOLO_MARKETING=true` crea únicamente `demo.marketing@idema.pe` y
`demo.director_marketing@idema.pe`. **Cambia sus contraseñas** antes de enseñarlo: la
semilla usa una conocida y el sitio será público.

## 5. Frontend

En local, con la URL real del backend:

```bash
VITE_API_URL=https://pruebas.instituto-idema.org/api \
VITE_LEADS_LEGACY=false \
npm run build
```

Subir **el contenido** de `dist/` a `public_html` de la cuenta nueva. El `.htaccess` ya va
dentro del build y resuelve el enrutado de la SPA, HTTPS forzado y las cabeceras.

## 6. Comprobar que quedó bien

```bash
# El backend responde
curl https://pruebas.instituto-idema.org/api/api/v1/health

# La captura pública funciona
curl -X POST https://pruebas.instituto-idema.org/api/api/v1/leads/ \
  -H 'Content-Type: application/json' \
  -d '{"nombre":"Prueba Uno","correo":"prueba1@example.com","telefono":"987654321","origen":"formulario","consentimiento":true}'
# -> 201

# El mismo otra vez: la deduplicación responde
# -> 409
```

Y en el navegador: entrar al panel con la cuenta de marketing y confirmar que la barra
lateral muestra **solo** Inicio, Reportes, Leads, Popups y Combos. Si aparece Órdenes o
Matrículas, el usuario no tiene el rol que crees.

## Lo que un usuario de marketing puede ver

```
  Inicio
  Reportes
─ COMERCIAL ─
  Leads
  Popups
  Combos y paquetes
```

No hace falta esconder nada: Órdenes, Comprobantes, Matrículas, Electivos, Conciliación y
Usuarios están cerrados por rol **en la ruta y en la API**, no solo ocultos en el menú.
