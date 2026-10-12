# Tasks: Bienestar Staff Panel (real auth + cita triage)

Repo for all tasks: `/home/josedowski/documentos/dev/promesa/bienestar_idema` (sibling repo). Branch from current `main` tip. No `idema` repo changes.

## Review Workload Forecast

| Field | Value |
|---|---|
| Estimated changed lines | Unit 1 (backend) ~450 add/~80 del ≈ 530; Unit 2 (frontend panel+routing) ~250 add/~30 del ≈ 280; Unit 3 (frontend deletion) 0 add/~700 del ≈ 700 |
| 400-line budget risk | High (Units 1 and 3 exceed 400; Unit 2 near/under) |
| Chained PRs recommended | Yes |
| Suggested split | PR #1 backend → PR #2 frontend panel/routing → PR #3 frontend deletion (3 units, adjusted from design's 2-PR split) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending — user must choose stacked-to-main vs feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

**Why 3 units, not design's 2:** splitting the ~700-line orphaned-subtree deletion (Unit 3) out of the panel-UI PR (Unit 2) isolates a large-but-mechanical, logic-free diff (pure file removal, no new behavior) from the panel's actual new logic, so Unit 2 stays reviewable near the 400 budget and Unit 3 can be fast-approved as removal-only (verified by `npm run build`/`lint` catching any missed import).

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|---|---|---|---|---|---|
| 1 | Real auth (usuarios/sesiones) + cita triage endpoints, backend-only | PR 1 | Manual `curl` scenarios 1-12 (design.md Testing Strategy) | Local backend (`node backend/index.js`) + throwaway Docker Postgres, `DATABASE_URL` + `SESSION_SECRET=$(openssl rand -base64 48)` — never `npm run dev` (proxies to prod) | Revert PR 1 branch; new tables/columns additive+idempotent, old code ignores them, no down-migration; drop `usuarios`/`sesiones` manually only if abandoning |
| 2 | `PanelCitasPage.tsx` + `App.tsx`/`LoginPage.tsx` routing/probe wiring | PR 2 | `npm run build` (`tsc -b && vite build`) + `npm run lint` | Local backend from Unit 1 + Vite build/preview against it (not `npm run dev`'s prod proxy) — manual click-through: filter, toggle, paginate, logout, reload | Revert PR 2 branch; route table and page revert; backend stays 401-protected independent of this unit |
| 3 | Delete `BienestarPage`/`BienestarDetailPage` + orphaned subtree | PR 3 | `npm run build` + `npm run lint` (catches missed imports) | N/A — deletion-only, no new runtime behavior beyond `/bienestar/:slug` 404ing (covered by Unit 2's route change) | Revert PR 3 branch restores deleted files; independent — nothing else depends on them remaining |

## Phase 1: Backend Foundation (PR #1)

- [x] 1.1 `backend/package.json`: add `bcryptjs` to `dependencies` (prod install, per ADR-2 — not `bcrypt`).
- [x] 1.2 Create `backend/lib/db.js`: `initDb()` (fail-loud `DATABASE_URL` check, `process.exit(1)`, idle-error handler) + `getPool()`. Extract from `citaStore.js` per ADR-1.
- [x] 1.3 Modify `backend/lib/citaStore.js`: replace its own `Pool` with `getPool()` from `db.js`; keep its own DDL/`try-catch→exit(1)`.
- [x] 1.4 Create `backend/lib/authStore.js`: DDL for `usuarios(id SERIAL PK, usuario TEXT UNIQUE, nombre TEXT DEFAULT '', password_hash TEXT, activo BOOLEAN DEFAULT true, created_at)` + `sesiones(token_hash TEXT PK, usuario_id INT FK→usuarios ON DELETE CASCADE, created_at, expira_at)` + `idx_sesiones_expira_at` (exact SQL: design.md lines 74-90). Functions: `initAuthStore()`, `buscarUsuario(usuario)`, `verificarPassword(plain,hash)` (bcryptjs.compare, always awaited incl. absent-user dummy-hash compare for timing), `crearSesion(usuarioId)` (randomBytes(32).base64url, stores sha256(token), 24h expiry, returns raw token once), `verificarSesion(token)`, `eliminarSesion(token)`, `startSessionCleanupJob()` (24h interval, `.unref()`, mirrors `startRetentionJob()`).

## Phase 2: Backend Cita Triage (PR #1)

- [x] 2.1 Modify `backend/lib/citaStore.js`: append lifecycle DDL after existing `CREATE TABLE citas` — `estado TEXT NOT NULL DEFAULT 'pendiente'`, `atendida_por INT REFERENCES usuarios(id) ON DELETE SET NULL`, `atendida_at TIMESTAMPTZ`, `idx_citas_estado(estado, created_at DESC)`, `citas_estado_check CHECK (estado IN ('pendiente','atendida'))` via `DO $$...EXCEPTION WHEN duplicate_object`. All `ADD COLUMN IF NOT EXISTS` (exact SQL: design.md lines 95-103).
- [x] 2.2 Modify `backend/lib/citaStore.js`: add `listCitas({estado, servicioSlug, page, limit})` — dynamic parameterized `WHERE` (no string concat), `COUNT(*) OVER() AS total`, `ORDER BY created_at DESC`, `LEFT JOIN usuarios` for `atendida_por_nombre`.
- [x] 2.3 Modify `backend/lib/citaStore.js`: add `updateCitaEstado(id, estado, usuarioId)` — exact `UPDATE...RETURNING *` from design.md lines 154-159; `rowCount===0` signals 404 to the caller.
- [x] 2.4 Create `backend/routes/citas.js`: `GET /api/citas` (query params `estado` optional enum, `servicio_slug` optional ≤64 chars, `page` default 1 ≥1, `limit` default 20 clamped 1-100; invalid → `400`, never silent fallback) and `PATCH /api/citas/:id` (`400` non-numeric id or bad `estado`, `404` unknown id, `200 {success:true,cita}`).

## Phase 3: Backend Auth Middleware & Routes (PR #1)

- [x] 3.1 Create `backend/middleware/requireAuth.js`: exact implementation design.md lines 122-131 — reads `req.signedCookies[COOKIE_NAME]`, `401` on missing/bad-signature/unknown/expired, `req.usuario = {id,usuario,nombre}` (never the token), `500` on DB error.
- [x] 3.2 Modify `backend/routes/auth.js`: delete demo credential set; `POST /api/login` uses `buscarUsuario`+`verificarPassword`+`crearSesion`; same `401 {error:'Credenciales inválidas.'}` for unknown user and wrong password; `POST /api/logout` calls `eliminarSesion`, clears cookie, `200` idempotent even with no/invalid cookie.
- [x] 3.3 Modify `backend/routes/usuario.js`: delete `demo@idema.edu` fallback; `GET /api/usuario` returns `req.usuario` from `requireAuth`, no longer any-cookie-authenticates.
- [x] 3.4 Modify `backend/routes/servicios.js`: correct the stale "generado al build desde data/bienestar.ts" header comment (that file is deleted in PR #3).

## Phase 4: Backend Wiring & Provisioning (PR #1)

- [x] 4.1 Modify `backend/index.js`: `SESSION_SECRET` fail-loud gate (`>=32` chars, `process.exit(1)`, same precedent as `DATABASE_URL`); `app.use(cookieParser(SESSION_SECRET))` replaces unsigned `cookieParser()`; add `loginLimiter` (`rateLimit` 15min/limit 10/`skipSuccessfulRequests`/`standardHeaders:'draft-7'`/429 handler `{success:false,error:'Demasiados intentos. Espera unos minutos.'}` — exact config design.md lines 173-177).
- [x] 4.2 Modify `backend/index.js`: register routes exactly as design.md lines 185-191 — `requireAuth` added to `/api/servicios` and `/api/usuario`; add `GET /api/citas`, `OPTIONS /api/citas/:id`, `PATCH /api/citas/:id`; boot order `await initDb(); await initAuthStore(); await initCitaStore()` (FK order matters); `startRetentionJob(); startSessionCleanupJob();`.
- [x] 4.3 Create `backend/scripts/crearUsuario.js`: CLI `node backend/scripts/crearUsuario.js <usuario> ["Nombre"]`, password via stdin prompt (echo off) or piped — never argv; calls `initDb()`, `bcryptjs.hash(plain,12)`, `INSERT...ON CONFLICT(usuario) DO NOTHING`; prints created id/usuario, never the password; exits non-zero if user exists or password <12 chars.

## Phase 5: Backend Manual Verification (PR #1)

Do NOT use `npm run dev` (proxies `/api` to production per `vite.config.ts`). Use a local backend + throwaway Docker Postgres, same pattern as `bienestar-cita-integration`.

- [x] 5.1 Start throwaway Postgres (Docker), run `DATABASE_URL=... SESSION_SECRET=$(openssl rand -base64 48) node backend/index.js`; confirm boot with `SESSION_SECRET` unset exits 1; confirm double-boot with it set has no DDL error (idempotent DDL — spec `staff-auth` Server-Side Session Lifecycle, `cita-intake` Idempotent schema addition).
- [x] 5.2 Run `crearUsuario.js` against the local DB; verify `SELECT password_hash FROM usuarios` shows only `$2a$12$…`, no password in any log line.
- [x] 5.3 Run design.md curl steps 1-12 against `BASE=http://localhost:<port>` (login success/failure, protected routes with/without cookie, forged cookie, filters/pagination incl. `estado=inventado`→400, PATCH mark-attended/revert, invalid estado→400, unknown id→404, logout+replay→401, rate-limit→429, expiry via `UPDATE sesiones SET expira_at=now()-interval '1 hour'`). Maps to `staff-auth` scenarios (Valid/Invalid credentials, Forged cookie, Session expires, No cookie, Logout revokes/Old cookie fails, Repeated failures) and `cita-management` scenarios (Unauthenticated rejected, paginated listing, filter by estado/servicio_slug, mark attended/revert, unknown id, invalid estado).

## Phase 6: Frontend Panel UI (PR #2)

- [x] 6.1 Create `src/pages/PanelCitasPage.tsx` per design.md Frontend section (lines 199-207): header with `req.usuario.nombre` + logout; `estado`/`servicio` filter selects (servicio populated from `GET /api/servicios`); `md:` table / `<md` cards (Fecha·Nombre·Contacto·Servicio·Mensaje·Estado·Acción); estado badges (`bg-cta/10 text-cta border-cta/30` pendiente, `bg-primary/10 text-primary border-primary/30` atendida); toggle button per row (disabled while PATCH in flight, refetches current page); Anterior/Siguiente pagination; loading/empty/error states; any `401` → `navigate('/login',{replace:true})`. Design tokens only (`primary/dark/deep/accent/surface/cta/darkText` + `.gradient-*`/`.glass`), no new colors/fonts.

## Phase 7: Frontend Routing & Auth Probe Fix (PR #2)

- [x] 7.1 Modify `src/App.tsx`: remove `import.meta.env.DEV` bypass (ADR-5); add `checking` state so an authenticated reload doesn't flash `/login`; auth probe becomes `res.ok ? data.isAuthenticated : false`; route table becomes `/login` + `/bienestar → <PanelCitasPage/>`; remove `/bienestar/:slug` route and its imports.
- [x] 7.2 Modify `src/pages/LoginPage.tsx`: same `res.ok` probe fix on mount; remove `onDemoLogin`.

## Phase 8: Frontend Deletion of Orphaned Subtree (PR #3)

- [x] 8.1 Delete `src/pages/BienestarPage.tsx`, `src/pages/BienestarDetailPage.tsx`.
- [x] 8.2 Delete `src/components/bienestar/Accordion.tsx`, `src/components/bienestar/CitaForm.tsx`, `src/components/ui/SectionTitle.tsx`, `src/components/ui/FieldError.tsx`, `src/components/ui/SuccessCheck.tsx`, `src/data/bienestar.ts`, `src/utils/validation.ts`.
- [x] 8.3 Delete `public/assets/img/bienestar/desktop/BIENESTAR_1.webp`, `public/assets/img/bienestar/mobile/BIENESTAR_2.webp`.
- [x] 8.4 Grep-confirm no remaining importer of any file deleted in 8.1-8.3 outside the deleted set (should already be zero after PR #2's route removal). Confirmed: `rg` for every deleted symbol/path against `src/` returns zero matches; `tsc -b && vite build` passes clean.

## Phase 9: Frontend Manual Verification (PR #2 + PR #3)

- [x] 9.1 `npm run build` (`tsc -b && vite build`) at repo root — passes clean after PR #2 + PR #3 combined. `npm run lint` still fails with "ESLint couldn't find an eslint.config.(js|mjs|cjs) file" — pre-existing repo-wide condition (no ESLint config present), unrelated to and unaffected by this deletion; not treated as a pass/fail gate per run instructions.
- [x] 9.2 Manual UI pass — performed at the API/network level, not via an interactive browser (no browser-automation tool available in this execution context). Booted the backend against a throwaway Docker Postgres (`postgres:16-alpine`, `DATABASE_URL`+`SESSION_SECRET=$(openssl rand -base64 48)`, never `npm run dev`), provisioned an account with `crearUsuario.js`, then via `curl` with a cookie jar: login → `200` + signed `Set-Cookie`; `/api/usuario` with cookie → `200 {isAuthenticated:true,...}`; `/api/citas` with cookie → `200` paginated envelope; `/api/servicios` with cookie → `200`; `/api/usuario` without cookie → `401`; logout → `200`; replay of the same cookie after logout → `401`. This exercises the same request sequence the panel UI drives (login, authenticated fetches, logout, post-logout rejection). Filter/toggle/paginate/reload-`checking`-state and visual rendering were NOT exercised (require an actual browser) — flagged as a residual gap below, consistent with PR #2's own Phase 7 scope (this PR added no new frontend logic, only deletions).
- [x] 9.3 Confirmed by code inspection of `src/App.tsx` (already modified by PR #2, unchanged by PR #3): the route table has exactly `/login`, `/bienestar` (→ `PanelCitasPage`), `/` and `*` (both `Navigate` to `/login` or `/bienestar` depending on auth state) — there is no `/bienestar/:slug` route and no import of a deleted page, so any such path now redirects rather than resolving to stale content. The public `idema.edu.pe/bienestar` page lives in the separate `idema` repo, which this run did not touch (verified via `git status` in that repo before/after — see Files Changed).

## Phase 10: Fix — Auth State Not Re-Synced After Client-Side Login/Logout (scoped fix on top of PR #3, from CRITICAL finding in `verify-report-pr-3.md`)

- [x] 10.1 Root-cause confirmed by direct code reading of `src/App.tsx`, `src/pages/LoginPage.tsx`, `src/pages/PanelCitasPage.tsx` (matches `verify-report-pr-3.md` §4b exactly): `App`'s `isAuthenticated` was derived once in a mount-only `useEffect`, and the `<Routes>` table conditionally registered only `/login` **or** `/bienestar` (never both) based on that stale value. `LoginPage`/`PanelCitasPage` called `navigate()` after login/logout without informing `App`, so the route table had no match for the new URL immediately after either transition, producing a permanently blank `#root`.
- [x] 10.2 Fixed `src/App.tsx`: both `/login` and `/bienestar` routes are now always registered; each route's `element` decides render-vs-redirect from `isAuthenticated` rather than the route's mere presence/absence. Added `handleLoginSuccess`/`handleLogout` callbacks (`useCallback`) that flip `isAuthenticated` and are passed as props to `LoginPage`/`PanelCitasPage`. No `import.meta.env.DEV` bypass reintroduced (ADR-5 stays in effect); the `res.ok` guard on `/api/usuario` (401 → `isAuthenticated: false`) is untouched.
- [x] 10.3 Fixed `src/pages/LoginPage.tsx`: added `onLoginSuccess: () => void` prop, called synchronously immediately before `navigate(redirect, { replace: true })` in both the on-mount already-authenticated check and the post-`POST /api/login` success path.
- [x] 10.4 Fixed `src/pages/PanelCitasPage.tsx`: added `onLogout: () => void` prop. `goToLogin` (shared by the `/api/usuario`, `/api/servicios`, `/api/citas` 401 branches) now calls `onLogout()` before `navigate('/login', { replace: true })`, and the explicit logout-button handler does the same after `POST /api/logout` — otherwise a session-expiry redirect to `/login` would loop back to `/bienestar` since `isAuthenticated` would still read `true` in `App`.
- [x] 10.5 Runtime-verified with a real headless Chromium browser (Playwright, not curl): throwaway `postgres:16-alpine` (port 55434) + local backend (`SESSION_SECRET=$(openssl rand -base64 48)`, port 4124) + `verifyuser` provisioned via `crearUsuario.js` + one seeded `citas` row + `vite.config.ts` dev-proxy temporarily repointed to the local backend + `npm run dev` (port 5173). Drove 3 independent fresh-browser-context cycles of: `/login` → fill+submit real credentials → confirm `path === /bienestar`, `#root` innerHTML > 1000 chars, "Solicitudes de cita" header visible, seeded cita row visible in the table (no blank page, no full reload) → click "Cerrar sesión" → confirm `path === /login`, `#root` innerHTML rendered, login form visible (no blank page). **3/3 PASS on both login and logout** in every cycle — the previously 5/5-reproducible blank-page defect no longer reproduces. `vite.config.ts` reverted (`git checkout -- vite.config.ts`) and throwaway container/backend processes torn down before the fix commit; `git status` confirmed clean except the 3 fixed source files.
- [x] 10.6 `npm run build` (`tsc -b && vite build`) — clean, zero errors, both before and after the runtime verification pass.
- [x] 10.7 Committed as a new commit on `feat/staff-panel-cleanup` (`131f119`, 3 files changed, 43 insertions, 18 deletions — well under the 400-line review budget) on top of PR #3's tip (`90dc873`), per the PR boundary instruction: this is a fix for a defect introduced in PR #2 but only discovered during PR #3's real-browser verification pass, landing as a fix commit rather than an amend/rewrite of any of the existing 7 commits. Not pushed, no PR opened (per explicit scope).
