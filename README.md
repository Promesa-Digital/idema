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
VITE_WEB3FORMS_KEY=
VITE_CITA_ENDPOINT=https://bienestar.idema.edu.pe/api/cita
```

`VITE_CULQI_PUBLIC_KEY` debe contener únicamente la llave pública de Culqi. Las llaves secretas pertenecen al backend y nunca deben exponerse en Vite.

`VITE_WEB3FORMS_KEY` es la llave pública usada por el formulario del carrito para enviar solicitudes de inscripción. Si no se configura, el carrito mantiene los productos pero no envía el formulario.

## Verificación

```bash
npm run lint
npm run check:assets
npm run build
npm run preview
```

No existe una suite automatizada de frontend. `npm run build` ejecuta TypeScript estricto y genera el bundle de producción; `npm run lint` valida todo el código TS/TSX y `npm run check:assets` comprueba que los recursos públicos referenciados existan. `npm run verify` ejecuta las tres comprobaciones.

## Rutas principales

| Área | Ruta |
|---|---|
| Sitio institucional | `/` |
| Oferta educativa | `/programas-de-estudio` |
| Inicio administrativo | `/admin/login` |
| Dashboard administrativo | `/admin` |
| Cuenta del alumno | `/alumno/login` |
| Registro del alumno | `/alumno/registro` |
| Portal privado del alumno | `/alumno/mi-cuenta` |
| Administración de alumnos | `/admin/alumnos` |
| Solicitud de baja | `/eliminar-cuenta` |
| Recuperación de contraseña | `/recuperar-password` |
| Restablecimiento de contraseña | `/restablecer-password?token=...` |
| Verificación de correo | `/verificar-correo?token=...` |

El panel administrativo incluye Programas, Popups, Combos, Descuentos, Órdenes, Comprobantes, Leads, Usuarios, Conceptos de Cobro, Matrículas, Electivos, Reportes, Conciliación y Cuentas de Alumnos.

El dashboard y el menú lateral muestran únicamente los módulos autorizados para el rol autenticado. Las tablas incluyen vista móvil y paginación. El encabezado informa si el backend o PostgreSQL no están disponibles.

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
- verificar el correo y solicitar un nuevo enlace;
- descargar una constancia informativa de cada comprobante;
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

La recuperación de contraseña funciona para cuentas administrativas y de alumnos sin revelar si el correo solicitado existe. Los enlaces vencen en 30 minutos y dejan de funcionar después del primer cambio de contraseña.

## Integraciones

Durante desarrollo, Vite configura proxies para noticias, captura de leads y citas de bienestar. Culqi requiere la llave pública en el frontend; la conciliación, webhooks y secretos se gestionan desde el backend.

El backend notifica cada lead a ManyChat cuando `MANYCHAT_WEBHOOK_URL` está configurado. La definición del flujo, etiquetas, campos personalizados y asignación de asesores debe acordarse con el administrador de ManyChat o el responsable de Marketing/CRM.
