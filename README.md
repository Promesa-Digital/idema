# IDEMA — Plataforma web y autogestión académica

Frontend en React 19, TypeScript, Vite y Tailwind CSS v4 para el sitio institucional, los módulos administrativos y el portal privado del alumno.

## Requisitos

- Node.js compatible con Vite 7
- Backend IDEMA disponible en `http://localhost:8000` o en la URL configurada

## Instalación y ejecución

```bash
npm install
cp .env.example .env
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:5173`.

Variables principales:

```dotenv
VITE_API_URL=http://localhost:8000
VITE_CULQI_PUBLIC_KEY=
VITE_CITA_ENDPOINT=https://bienestar.idema.edu.pe/api/cita
```

`VITE_CULQI_PUBLIC_KEY` debe contener únicamente la llave pública de Culqi. Las llaves secretas pertenecen al backend y nunca deben exponerse en Vite.

## Verificación

```bash
npm run lint
npm run build
npm run preview
```

No existe una suite automatizada de frontend. `npm run build` ejecuta TypeScript estricto y genera el bundle de producción; `npm run lint` valida todo el código TS/TSX.

## Rutas principales

| Área | Ruta |
|---|---|
| Sitio institucional | `/` |
| Oferta educativa | `/programas-de-estudio` |
| Inicio administrativo | `/admin/login` |
| Cuenta del alumno | `/alumno/login` |
| Registro del alumno | `/alumno/registro` |
| Portal privado del alumno | `/alumno/mi-cuenta` |
| Administración de alumnos | `/admin/alumnos` |
| Solicitud de baja | `/eliminar-cuenta` |

El panel administrativo incluye Programas, Popups, Combos, Descuentos, Órdenes, Comprobantes, Leads, Usuarios, Conceptos de Cobro, Matrículas, Electivos, Reportes, Conciliación y Cuentas de Alumnos.

## Cuentas de demostración

Las cuentas se crean desde el backend con `PYTHONPATH=. .venv/bin/python seed_demo.py`. Son exclusivas para desarrollo local.

| Perfil | Correo | Contraseña |
|---|---|---|
| Administrador del sistema | `demo.admin_sistema@idema.pe` | `Demo1234!` |
| Administración | `demo.administracion@idema.pe` | `Demo1234!` |
| Académico | `demo.academico@idema.pe` | `Demo1234!` |
| Ventas | `demo.ventas@idema.pe` | `Demo1234!` |
| Marketing | `demo.marketing@idema.pe` | `Demo1234!` |
| Director de marketing | `demo.director_marketing@idema.pe` | `Demo1234!` |
| Alumno | `demo.alumno@idema.pe` | `Demo1234!` |

Los perfiles administrativos ingresan en `/admin/login`; el alumno ingresa en `/alumno/login`. Estas credenciales deben cambiarse o eliminarse antes de desplegar un entorno público.

## Cuenta del alumno

El portal del alumno usa una sesión separada de la sesión administrativa. Permite:

- consultar órdenes, pagos, comprobantes, matrículas y electivos propios;
- editar nombres, apellidos, DNI, correo y teléfono;
- cambiar la contraseña;
- revocar o volver a otorgar el consentimiento de datos personales;
- dar de baja la cuenta.

Una cuenta inactiva pierde acceso a todos los módulos del alumno. Si la cuenta tiene historial académico o financiero, la baja conserva los datos exigibles; sin historial, los datos personales se anonimizan.

## Arquitectura relevante

- Rutas lazy-loaded en `src/App.tsx`.
- Alias `@` hacia `src/`.
- Autenticación administrativa en `src/context/AuthContext.tsx`.
- Autenticación del alumno en `src/context/AlumnoAuthContext.tsx`.
- Cliente HTTP compartido en `src/services/apiClient.ts`.
- Carrito en `src/context/CartContext.tsx`.
- Captura de leads con cola offline en `src/utils/leadIntake.ts`.
- Catálogo estático en `src/data/programs/`.
- Tokens visuales y fuentes en `src/index.css` mediante `@theme` de Tailwind v4.

El token administrativo se guarda como `idema_admin_token` y el del alumno como `idema_alumno_token`, evitando mezclar ambos tipos de sesión.

## Integraciones

Durante desarrollo, Vite configura proxies para noticias, captura de leads y citas de bienestar. Culqi requiere la llave pública en el frontend; la conciliación, webhooks y secretos se gestionan desde el backend.

El backend notifica cada lead a ManyChat cuando `MANYCHAT_WEBHOOK_URL` está configurado. La definición del flujo, etiquetas, campos personalizados y asignación de asesores debe acordarse con el administrador de ManyChat o el responsable de Marketing/CRM.
