# Design: Bienestar Staff Panel (real auth + cita triage)

All paths are relative to `/home/josedowski/documentos/dev/promesa/bienestar_idema` unless stated. Nothing changes in the `idema` repo.

## Technical Approach

Three layers, all in the existing Express monolith + Vite SPA:

1. **Auth core** — a new `lib/authStore.js` (`usuarios`, `sesiones`) plus `middleware/requireAuth.js` that resolves a *signed opaque cookie* to a server-side session row. `routes/auth.js` and `routes/usuario.js` are rewritten on top of it.
2. **Cita triage** — additive lifecycle columns on `citas`, two new store functions, and `routes/citas.js` (`GET /api/citas`, `PATCH /api/citas/:id`).
3. **Panel UI** — `src/pages/PanelCitasPage.tsx` mounted at `/bienestar`; the informational duplicate pages and their now-orphaned component tree are deleted.

Schema evolution stays on the existing boot-time idempotent-DDL path (`citaStore.js` precedent). No migration tool, no ORM, no new runtime beyond one hashing library.

## Reality check vs. the proposal

Read before designing; these differ from the proposal's wording and the design follows reality:

| Proposal/task assumption | Actual code | Design response |
|---|---|---|
| `findUsuarioByEmail`/username | `LoginPage.tsx` posts `{ usuario, password }`; placeholder is a person's name, no email field | Single login identifier column `usuario TEXT UNIQUE`; request body key unchanged, so `LoginPage` needs no payload change |
| `bcrypt` dependency | Runtime is `node:20-alpine`, backend installs with `npm ci --omit=dev`, no build toolchain in the image | Use `bcryptjs` (pure JS, bcrypt-format hashes, `compare` API) — see ADR-2 |
| `/api/servicios` has other consumers | Its only consumers were the two deleted pages (which actually used the *static* `src/data/bienestar.ts`, never the endpoint) | After this change its first real consumer is the panel's filter dropdown |
| `citas.atendida_por` FK "your call" | `usuarios` will not exist when `initCitaStore()` runs today | FK kept, but boot order becomes `initDb → initAuthStore → initCitaStore` |
| Deleting the two pages is self-contained | They are the sole importers of `CitaForm`, `Accordion`, `SectionTitle`, `data/bienestar.ts`, `ui/FieldError`, `ui/SuccessCheck`, `utils/validation.ts` | Whole subtree deleted; `/api/cita` intake is untouched because the public form lives in `idema/src/utils/citaIntake.ts` |
| `/api/usuario` simply gets `requireAuth` | `App.tsx` and `LoginPage.tsx` both read `data.isAuthenticated` from a 200 response | Both callers must switch to `res.ok ? data.isAuthenticated : false`, otherwise the gate silently breaks |
| Out of scope: the `idema` repo | `idema/src/data/navigation.ts:15,51-53` links to `bienestar.idema.edu.pe/{,medico,social,psicopedagogico}` | Already dead for the public today (unauthenticated `*` → `/login`); removal makes it permanent. **Flagged as a follow-up, not fixed here.** |
| `routes/servicios.js` header comment | Claims it is "generado al build desde data/bienestar.ts" — it never was | Comment corrected when `data/bienestar.ts` is deleted |

## Architecture Decisions

### ADR-1: Extract `lib/db.js`; each store owns its DDL

| Option | Tradeoff | Decision |
|---|---|---|
| `authStore.js` creates its own `Pool` | Two pools, two `DATABASE_URL` reads, duplicated fail-loud | Rejected |
| `authStore` imports `pool` from `citaStore` | Auth depends on cita persistence; wrong direction | Rejected |
| New `lib/db.js` with `initDb()` + `getPool()` | ~20 mechanical lines moved out of `citaStore.js` | **Chosen** |

`initDb()` owns the `DATABASE_URL` check, the `Pool`, and the idle-error handler, keeping the existing `process.exit(1)` fail-loud. `initCitaStore()` / `initAuthStore()` each keep only their own DDL + `try/catch → exit(1)`.

### ADR-2: `bcryptjs`, not native `bcrypt`

`bcrypt` (node-gyp/node-pre-gyp) has no reliable musl prebuild; `npm ci --omit=dev` on `node:20-alpine` would need `python3/make/g++` added to the image. `bcryptjs` is pure JS, produces standard `$2a$` hashes, and satisfies the spec's "verify via bcrypt compare" at a cost of a few ms per login for a team of <10. `@node-rs/bcrypt` (napi, ships `linux-x64-musl`) is the faster alternative if login latency ever matters. Cost factor **12**.

### ADR-3: Store a hash of the session token, not the token

The cookie carries `crypto.randomBytes(32).toString('base64url')`; `sesiones` stores `sha256(token)`. Read access to the DB then cannot be replayed as a live session. Cost: one `createHash` call per request. Signed cookie (`cookieParser(SESSION_SECRET)`) additionally makes forged/edited values fail before any query.

### ADR-4: Absolute 24h expiry, no sliding renewal

Matches the current cookie `maxAge` and the proposal's assumption #5. Sliding renewal would require a write per request. Expired rows are swept by a `startSessionCleanupJob()` mirroring `startRetentionJob()`'s `setInterval(...).unref()` pattern.

### ADR-5: Remove the `import.meta.env.DEV` bypass and `onDemoLogin`

The bypass only ever skipped the auth probe (leaving `isAuthenticated=false`), and `onDemoLogin` flipped the client gate while the API now returns 401 — it would render an empty panel. Deleting both removes the proposal's "DEV bypass leaks into a build" risk instead of mitigating it.

## Data Flow

    LoginPage ──POST /api/login {usuario,password}──→ loginLimiter → auth.login
                                                          │ bcryptjs.compare
                                                          │ crearSesion() → sesiones(token_hash, expira_at)
              ←── Set-Cookie: bienestar_session=<token>; signed,httpOnly,secure,sameSite=lax,24h

    PanelCitasPage ──GET /api/citas?…──→ requireAuth ──verificarSesion(sha256(signedCookie))──→ usuarios
                                              │ 401 if missing/forged/unknown/expired
                                              └─→ listCitas() ──→ citas LEFT JOIN usuarios
    PanelCitasPage ──PATCH /api/citas/:id {estado}──→ requireAuth → updateCitaEstado(id, estado, req.usuario.id)

## Interfaces / Contracts

### Schema (`initAuthStore`, runs before `initCitaStore`)

```sql
CREATE TABLE IF NOT EXISTS usuarios (
  id            SERIAL PRIMARY KEY,
  usuario       TEXT NOT NULL UNIQUE,
  nombre        TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sesiones (
  token_hash TEXT PRIMARY KEY,
  usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expira_at  TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesiones_expira_at ON sesiones(expira_at);
```

### Schema (`initCitaStore`, appended after the existing `CREATE TABLE citas`)

```sql
ALTER TABLE citas ADD COLUMN IF NOT EXISTS estado       TEXT NOT NULL DEFAULT 'pendiente';
ALTER TABLE citas ADD COLUMN IF NOT EXISTS atendida_por INT REFERENCES usuarios(id) ON DELETE SET NULL;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS atendida_at  TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_citas_estado ON citas(estado, created_at DESC);
-- Postgres has no ADD CONSTRAINT IF NOT EXISTS for table constraints:
DO $$ BEGIN
  ALTER TABLE citas ADD CONSTRAINT citas_estado_check CHECK (estado IN ('pendiente','atendida'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
```

Convention: staff accounts are **deactivated** (`activo=false`), never deleted, so `ON DELETE SET NULL` never actually erases an audit trail.

### `lib/authStore.js`

| Function | Behavior |
|---|---|
| `initAuthStore()` | DDL above; `catch → console.error + process.exit(1)` |
| `buscarUsuario(usuario)` | `SELECT id, usuario, nombre, password_hash FROM usuarios WHERE usuario=$1 AND activo` → row or `null` |
| `verificarPassword(plain, hash)` | `bcryptjs.compare`; always awaited even when the user is absent (compare against a dummy hash) to flatten timing |
| `crearSesion(usuarioId)` | `randomBytes(32).base64url` → insert `sha256(token)` + `expira_at = now() + 24h` → returns the raw token (only time it exists) |
| `verificarSesion(token)` | `SELECT u.id,u.usuario,u.nombre FROM sesiones s JOIN usuarios u ON u.id=s.usuario_id WHERE s.token_hash=$1 AND s.expira_at > now() AND u.activo` |
| `eliminarSesion(token)` | `DELETE FROM sesiones WHERE token_hash=$1` |
| `startSessionCleanupJob()` | `DELETE FROM sesiones WHERE expira_at < now()` every 24h, `unref()`'d |

### `middleware/requireAuth.js`

```js
export default async function requireAuth(req, res, next) {
  const token = req.signedCookies?.[COOKIE_NAME]   // false ⇒ bad signature
  if (!token || typeof token !== 'string') return res.status(401).json(UNAUTH)
  let usuario
  try { usuario = await verificarSesion(token) }
  catch (err) { console.error('[auth][sesion]', err.message); return res.status(500).json(ERR) }
  if (!usuario) return res.status(401).json(UNAUTH)
  req.usuario = usuario            // { id, usuario, nombre } — never the token
  next()
}
```

`UNAUTH = { success: false, error: 'No autenticado.' }`. Cookie presence is never sufficient — this is the fix for the any-cookie-authenticates bug.

### HTTP contracts

| Route | Middleware chain | Success | Errors |
|---|---|---|---|
| `POST /api/login` | `sessionCors, loginLimiter` | `200 {success:true, user:{usuario,nombre}}` + `Set-Cookie` | `400` malformed body, `401 {success:false,error:'Credenciales inválidas.'}` (same message for unknown user and wrong password), `429` |
| `POST /api/logout` | `sessionCors` | `200 {success:true}`, session row deleted, cookie cleared | idempotent — 200 even with no/invalid cookie |
| `GET /api/usuario` | `sessionCors, requireAuth` | `200 {isAuthenticated:true, user:{id,usuario,nombre}}` | `401` |
| `GET /api/servicios` | `sessionCors, requireAuth` | unchanged body | `401` |
| `GET /api/citas` | `sessionCors, requireAuth` | `200 {success:true, citas:[…], pagination:{page,limit,total,totalPages}}` | `400` bad filter, `401` |
| `PATCH /api/citas/:id` | `sessionCors, requireAuth` | `200 {success:true, cita:{…}}` | `400` non-numeric id or `estado ∉ {pendiente,atendida}`, `401`, `404 'Cita no encontrada.'` |

`GET /api/citas` query params: `estado` (optional, must be one of the two), `servicio_slug` (optional, ≤64 chars), `page` (default 1, ≥1), `limit` (default 20, clamped 1–100). Anything invalid → `400`, never a silent fallback. `citas` rows include `atendida_por_nombre` from a `LEFT JOIN usuarios`.

### `lib/citaStore.js` additions

- `listCitas({ estado, servicioSlug, page, limit })` — dynamic `WHERE` built from a param array (`$1,$2,…`, never string concatenation, per the existing convention), `COUNT(*) OVER() AS total` to page and count in one round trip, `ORDER BY created_at DESC`.
- `updateCitaEstado(id, estado, usuarioId)`:

```sql
UPDATE citas SET estado = $2,
  atendida_por = CASE WHEN $2 = 'atendida' THEN $3::int ELSE NULL END,
  atendida_at  = CASE WHEN $2 = 'atendida' THEN now()   ELSE NULL END
WHERE id = $1 RETURNING *;
```

"Clears" means SQL `NULL` for both columns. Re-setting `atendida` re-stamps with the current user/time. `rowCount === 0` ⇒ the route returns `404`.

### `index.js` wiring

```js
const SESSION_SECRET = process.env.SESSION_SECRET
if (!SESSION_SECRET || SESSION_SECRET.length < 32) {
  console.error('[api] SESSION_SECRET no está configurada (mínimo 32 caracteres)')
  process.exit(1)                      // same fail-loud precedent as DATABASE_URL
}
app.use(cookieParser(SESSION_SECRET))  // replaces the unsigned cookieParser()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 10, skipSuccessfulRequests: true,
  standardHeaders: 'draft-7', legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ success:false, error:'Demasiados intentos. Espera unos minutos.' }),
})
```

**Why 10/15min:** the office likely NATs behind one IP and `trust proxy` resolves to the client IP, so the whole team shares a bucket. `skipSuccessfulRequests` means only failures count — 10 typos per 15 minutes is generous for ~5 humans and useless for credential stuffing. It is deliberately looser than `citaLimiter` (5/10min), which throttles an anonymous public write.

Registration order (existing `app.get('*')` SPA fallback stays last):

```js
app.get('/api/servicios', sessionCors, requireAuth, serviciosHandler)
app.get('/api/usuario',   sessionCors, requireAuth, usuarioHandler)
app.post('/api/login',    sessionCors, loginLimiter, login)
app.post('/api/logout',   sessionCors, logout)
app.get('/api/citas',     sessionCors, requireAuth, listCitasHandler)
app.options('/api/citas/:id', sessionCors)          // PATCH+JSON is preflighted
app.patch('/api/citas/:id',   sessionCors, requireAuth, patchCitaHandler)
…
await initDb(); await initAuthStore(); await initCitaStore()   // order matters: FK
startRetentionJob(); startSessionCleanupJob()
```

### Frontend

`src/pages/PanelCitasPage.tsx` — single page component, no new deps:

- Header: "Solicitudes de cita", `req.usuario.nombre` from `/api/usuario`, logout button (`POST /api/logout` → `navigate('/login')`).
- Filters: `estado` select (Todas / Pendientes / Atendidas) + `servicio` select populated from `GET /api/servicios` (`servicios[].slug/title`). Changing a filter resets to page 1.
- List: `md:` table (Fecha · Nombre · Contacto · Servicio · Mensaje · Estado · Acción), `<md` stacked cards. Estado badge: pendiente `bg-cta/10 text-cta border-cta/30`, atendida `bg-primary/10 text-primary border-primary/30`. Attended rows show "Atendida por {nombre} · {fecha}".
- Action: one button per row toggling `pendiente ⇄ atendida`, disabled while its PATCH is in flight, then re-fetching the current page.
- Pagination: Anterior / Siguiente + "Página X de Y", driven by `pagination`.
- States: loading skeleton, empty ("No hay solicitudes con estos filtros"), error banner reusing the login page's `bg-cta/10 border-cta/30` style. **Any 401 → `navigate('/login', { replace: true })`.**
- Tokens only from `src/index.css` (`primary`, `dark`, `deep`, `accent`, `surface`, `cta`, `darkText`) + the `.gradient-*`/`.glass` utilities. No new colors, no new fonts.

`src/App.tsx` — drop both deleted imports, add `PanelCitasPage`, add a `checking` state so an authenticated reload does not flash `/login`, and change the probe to `res.ok ? data.isAuthenticated : false`. Route table becomes `/login` (unauthenticated) and `/bienestar → <PanelCitasPage/>` (authenticated); `/bienestar/:slug` is gone. `LoginPage.tsx` — same `res.ok` fix on its mount probe, and `onDemoLogin` removed.

### `backend/scripts/crearUsuario.js`

```
docker exec -it <container> node /app/backend/scripts/crearUsuario.js <usuario> ["Nombre Apellido"]
# prompts: Contraseña: (stdin, echo off) — also accepts a piped password
```

The password is **not** an argv argument: argv is visible in `ps` and shell history, which would violate the spec's "no plaintext password anywhere". The script calls `initDb()`, hashes with `bcryptjs.hash(plain, 12)`, `INSERT … ON CONFLICT (usuario) DO NOTHING`, prints the created id/usuario (never the password), and exits non-zero if the user already exists or the password is under 12 characters. It ships automatically because the Dockerfile does `COPY backend/ ./backend/`.

## File Changes

| File | Action | Description |
|---|---|---|
| `backend/lib/db.js` | Create | `initDb()` (fail-loud on `DATABASE_URL`) + `getPool()` |
| `backend/lib/authStore.js` | Create | `usuarios`/`sesiones` DDL + session/credential queries |
| `backend/middleware/requireAuth.js` | Create | Signed-cookie → server-side session verification |
| `backend/routes/citas.js` | Create | `GET /api/citas`, `PATCH /api/citas/:id` |
| `backend/scripts/crearUsuario.js` | Create | Operator CLI account provisioning |
| `backend/lib/citaStore.js` | Modify | Use `getPool()`; lifecycle DDL; `listCitas`, `updateCitaEstado` |
| `backend/routes/auth.js` | Modify | bcrypt compare + `crearSesion`/`eliminarSesion`; demo credential set deleted |
| `backend/routes/usuario.js` | Modify | Real user from `req.usuario`; `demo@idema.edu` deleted |
| `backend/routes/servicios.js` | Modify | Stale "generado desde data/bienestar.ts" comment corrected |
| `backend/index.js` | Modify | `SESSION_SECRET` gate, `cookieParser(secret)`, `loginLimiter`, new routes, boot order |
| `backend/package.json` | Modify | `bcryptjs` in `dependencies` (prod — image installs `--omit=dev`) |
| `src/pages/PanelCitasPage.tsx` | Create | Panel UI |
| `src/App.tsx` | Modify | Panel at `/bienestar`, `checking` state, `res.ok` probe, DEV bypass removed |
| `src/pages/LoginPage.tsx` | Modify | `res.ok` probe fix, `onDemoLogin` removed |
| `src/pages/BienestarPage.tsx`, `src/pages/BienestarDetailPage.tsx` | Delete | Login-gated duplicate of the public page |
| `src/components/bienestar/{Accordion,CitaForm}.tsx`, `src/components/ui/{SectionTitle,FieldError,SuccessCheck}.tsx`, `src/data/bienestar.ts`, `src/utils/validation.ts` | Delete | Reachable only from the two deleted pages |
| `public/assets/img/bienestar/{desktop/BIENESTAR_1,mobile/BIENESTAR_2}.webp` | Delete | Only referenced by the deleted heroes |

Size forecast: ~5 new backend files + 1 new page ≈ 550 added lines, ~700 deleted. Deletions are mechanical and reviewable as one hunk, but the **auth + citas backend slice should land as its own PR** ahead of the frontend swap to keep either diff under the 400-line review budget.

## Testing Strategy

No test framework exists in either package (unchanged from `bienestar-cita-integration`); verification is manual and scripted for `sdd-verify`.

| Layer | What | How |
|---|---|---|
| Build | Deleted files break nothing | `npm run build` (`tsc -b && vite build`) and `npm run lint` at the repo root |
| Boot | Fail-loud + idempotent DDL | Start with `SESSION_SECRET` unset → exit 1; start twice with it set → no DDL error on the second boot |
| API | Contracts below | `curl` against the deployed app with a cookie jar |
| UI | Panel behaviors | Manual: filter, toggle both directions, paginate, logout, then reload → login |

```bash
BASE=https://bienestar.idema.edu.pe; J=/tmp/jar.txt; rm -f $J

# 1 valid login → 200 + Set-Cookie (value must be signed: contains "s:")
curl -si -c $J -X POST $BASE/api/login -H 'Content-Type: application/json' \
  -d '{"usuario":"jperez","password":"<real>"}'
# 2 invalid password → 401, no Set-Cookie
curl -si -X POST $BASE/api/login -H 'Content-Type: application/json' \
  -d '{"usuario":"jperez","password":"nope"}'
# 3 protected routes with a valid session → 200
for p in /api/citas /api/servicios /api/usuario; do curl -s -o /dev/null -w "$p %{http_code}\n" -b $J $BASE$p; done
# 4 same routes with no cookie → 401 each
for p in /api/citas /api/servicios /api/usuario; do curl -s -o /dev/null -w "$p %{http_code}\n" $BASE$p; done
# 5 forged cookie → 401 (bad signature never reaches the DB)
curl -s -o /dev/null -w "%{http_code}\n" -H 'Cookie: bienestar_session=deadbeef' $BASE/api/citas
# 6 filters + pagination
curl -s -b $J "$BASE/api/citas?estado=pendiente&servicio_slug=medico&page=1&limit=5" | head -c 400
curl -s -o /dev/null -w "%{http_code}\n" -b $J "$BASE/api/citas?estado=inventado"   # 400
# 7 PATCH valid transition → 200, atendida_por/atendida_at set
curl -s -b $J -X PATCH $BASE/api/citas/1 -H 'Content-Type: application/json' -d '{"estado":"atendida"}'
# 8 revert → 200, both audit fields null
curl -s -b $J -X PATCH $BASE/api/citas/1 -H 'Content-Type: application/json' -d '{"estado":"pendiente"}'
# 9 invalid estado → 400 ; unknown id → 404
curl -s -o /dev/null -w "%{http_code}\n" -b $J -X PATCH $BASE/api/citas/1 -H 'Content-Type: application/json' -d '{"estado":"cerrada"}'
curl -s -o /dev/null -w "%{http_code}\n" -b $J -X PATCH $BASE/api/citas/999999 -H 'Content-Type: application/json' -d '{"estado":"atendida"}'
# 10 logout, then replay the same jar → 401
curl -s -b $J -c $J -X POST $BASE/api/logout
curl -s -o /dev/null -w "replay %{http_code}\n" -b $J $BASE/api/citas
# 11 rate limit: expect 401s then 429
for i in $(seq 1 12); do curl -s -o /dev/null -w "%{http_code} " -X POST $BASE/api/login \
  -H 'Content-Type: application/json' -d '{"usuario":"jperez","password":"nope"}'; done; echo
# 12 expiry (psql on bienestar-db, then replay a fresh session's cookie)
#   UPDATE sesiones SET expira_at = now() - interval '1 hour';   → step 3 must return 401
```

Also assert by inspection: `SELECT password_hash FROM usuarios` shows only `$2a$12$…`, and no log line from `/api/login`, `/api/citas`, or the seed script contains a password or a cita's PII.

Do **not** verify against `npm run dev`: `vite.config.ts` proxies `/api` to the production host, so a local session would be a real production session in `bienestar-db`.

## Threat Matrix

The change touches HTTP routing only — no shell commands, no subprocess spawning, no VCS/PR automation, no executable-file classification. `crearUsuario.js` is a Node entry point run by an operator, not composed shell.

| Boundary | Applicability | Note |
|---|---|---|
| Documentation-like paths | N/A | No file classification or execution of repository content |
| Git repository selection | N/A | No `git` invocation |
| Commit state | N/A | No VCS automation |
| Push state | N/A | No VCS automation |
| PR commands | N/A | No PR automation |

The relevant adversarial surface here is HTTP, and it is covered by the spec scenarios and curl steps 2, 4, 5, 9, 10, 11, 12 (forged cookie, expired session, replayed post-logout cookie, invalid `estado`, unknown id, brute force).

## Migration / Rollout

1. Confirm `bienestar-cita-integration` is deployed and verified in production (the `citas` table must already exist — the `ALTER` statements assume it).
2. Generate and set `SESSION_SECRET` in the CapRover app's environment (`openssl rand -base64 48`) **before** deploying; the new boot check exits 1 without it and CapRover would loop on a failing container.
3. Deploy. Boot runs `initDb → initAuthStore` (creates `usuarios`/`sesiones`) `→ initCitaStore` (adds the three columns + check constraint). All statements are idempotent and re-runnable.
4. Provision the first account with `crearUsuario.js` inside the container, then log in through the UI.
5. Run the verification block above.

Rollback: redeploy the previous image. The added tables and columns are additive and inert to old code; `usuarios`/`sesiones` can be dropped manually only if the feature is abandoned. Rolling back does **not** restore the deleted informational pages — that requires reverting the branch.

## Open Questions

- [ ] Session cookie `secure: true` in local development: acceptable, since `sdd-verify` runs against the deployed environment and `npm run dev` must not be used for auth testing (proxy points at production).
- [ ] Follow-up, out of scope: `idema/src/data/navigation.ts:15,51-53` points public visitors at `bienestar.idema.edu.pe` paths that now permanently land on a staff login. Already broken today; should be repointed to `idema.edu.pe/bienestar` in a separate change.
- [ ] Follow-up, out of scope (per the proposal): MINEDU-compliance states, retention period, and reporting once the normative document exists.
