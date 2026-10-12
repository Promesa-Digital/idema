# Verify Report — PR #1 (bienestar_idema backend: auth + cita triage)

**Change**: bienestar-staff-panel
**Scope verified**: tasks.md Phases 1-5 (backend only). Phases 6-9 (frontend panel, routing, deletion) are unimplemented and correctly left unchecked — out of scope for this verification.
**Repo/branch**: `/home/josedowski/documentos/dev/promesa/bienestar_idema`, branch `feat/staff-auth-panel-backend`, 4 commits off `main` (`d4a895b`), HEAD `e7d0f5c`, not pushed.
**Mode**: hybrid (Engram + OpenSpec). Engram `mem_*` MCP tools were not exposed in this execution context — findings are reported inline and persisted to this OpenSpec file only. `skill_resolution: none` (no project skill registry match).

## 1. Branch / diff-stat confirmation

```
backend/index.js                  |  45 ++++++++++++--
backend/lib/authStore.js          | 125 ++++++++++++++++++++++++++++++++++++
backend/lib/citaStore.js          | 112 +++++++++++++++++++++++++++-------
backend/lib/db.js                 |  43 +++++++++++++
backend/middleware/requireAuth.js |  31 ++++++++++
backend/package-lock.json         |   7 +++
backend/package.json              |   1 +
backend/routes/auth.js            |  63 ++++++++++++-------
backend/routes/citas.js           |  76 +++++++++++++++++++++++
backend/routes/servicios.js       |   5 +-
backend/routes/usuario.js         |   8 +--
backend/scripts/crearUsuario.js   |  84 +++++++++++++++++++++++++
12 files changed, 544 insertions(+), 56 deletions(-)
```

Matches the apply-progress claim exactly (544/-56, 12 files). **Zero `src/` files touched** (`git diff --name-only | grep '^src/'` → 0 matches). No `idema` repo files touched (verification confined to `bienestar_idema`, no cross-repo edits observed). Scope boundary: clean.

## 2. Source inspection vs. design.md

| File | Result |
|---|---|
| `backend/lib/db.js` | Matches ADR-1 exactly: `initDb()` fail-loud on missing `DATABASE_URL`, `process.exit(1)`, idle-error handler, idempotent (returns cached pool). `getPool()` throws if called before `initDb()`. |
| `backend/lib/authStore.js` | Schema matches design.md lines 74-90 verbatim (`usuarios`, `sesiones`, `idx_sesiones_expira_at`). All 7 functions present and match documented behavior: `verificarPassword` always awaits `bcrypt.compare` against a precomputed `DUMMY_HASH` when the user is absent (timing-attack mitigation, matches task 1.4). `crearSesion` stores `sha256(token)`, never the raw token; returns the raw token once. `verificarSesion` requires `expira_at > now() AND u.activo` — a real server-side lookup, not presence-only. `startSessionCleanupJob` mirrors `startRetentionJob()`'s `setInterval(...).unref()` pattern. |
| `backend/middleware/requireAuth.js` | Byte-for-byte match of design.md lines 122-131. Reads `req.signedCookies[COOKIE_NAME]` (a forged/unsigned cookie resolves to `false` from `cookie-parser`, caught by `typeof token !== 'string'`), calls `verificarSesion` (real DB lookup — **this is the fix for the any-cookie-authenticates bug**, confirmed: no code path treats cookie presence alone as authentication), 401 on missing/invalid/expired, 500 on DB error, sets `req.usuario` to `{id, usuario, nombre}` only (never the token). |
| `backend/lib/citaStore.js` (DDL) | The `DO $$ ... EXCEPTION WHEN duplicate_object THEN NULL; END $$` block for `citas_estado_check` matches design.md lines 99-103 exactly — correct idempotent pattern for a table CHECK constraint (Postgres has no `ADD CONSTRAINT IF NOT EXISTS`). Verified empirically (see §3) with two consecutive boots against the same DB — no error on the second run. |
| `backend/lib/citaStore.js` (`listCitas`/`updateCitaEstado`) | `listCitas` builds a fully parameterized dynamic `WHERE` (`$1,$2,…`, never string concatenation), `COUNT(*) OVER() AS total` in one round trip, `LEFT JOIN usuarios` for `atendida_por_nombre`. `updateCitaEstado` is a literal copy of the design.md CASE-expression `UPDATE...RETURNING *` (lines 154-159); `rowCount === 0` path returns `null`, correctly signaling 404 upstream. |
| `backend/routes/citas.js` | `GET /api/citas`: `estado` validated against the enum, `servicio_slug` length-capped at 64, `page`/`limit` validated as integers with `limit` clamped 1-100 — every invalid input path returns `400`, never a silent fallback (matches "never silent fallback" requirement). `PATCH /api/citas/:id`: non-numeric/`<1` id → 400, invalid estado → 400, `404` on missing row, `200 {success, cita}` otherwise. Response shapes match design.md's HTTP contracts table. |
| `backend/index.js` | `SESSION_SECRET` gate checks both presence AND `.length < 32`, fail-loud `process.exit(1)` — matches design.md lines 166-170 (verified empirically, see §3). `cookieParser(SESSION_SECRET)` replaces the unsigned parser. `loginLimiter` config (15min/10/`skipSuccessfulRequests`/`draft-7`/429 handler with the exact Spanish message) matches lines 173-177 verbatim. Boot order is `await initDb(); await initAuthStore(); await initCitaStore()` — correct FK-dependency order. Route registration matches lines 185-191: `requireAuth` added to `/api/servicios` and `/api/usuario` (retro-fix for the any-cookie bug), new `/api/citas` GET+PATCH+OPTIONS wired. |
| `backend/routes/auth.js` | Demo credential set fully removed. `login` always awaits `verificarPassword` even when `cuenta` is undefined (`cuenta?.password_hash` → `undefined` → compared against `DUMMY_HASH` inside `authStore.js`) — timing-safe. Same `401 {error:'Credenciales inválidas.'}` message for unknown user and wrong password (no username enumeration via message difference). `logout` is idempotent — 200 even with no/invalid cookie, matching the spec. |
| `backend/routes/usuario.js` | `demo@idema.edu` fallback deleted; returns `req.usuario` from `requireAuth`, no longer any-cookie-authenticates. |
| `backend/routes/servicios.js` | Stale "generado al build desde data/bienestar.ts" comment corrected as `routes/servicios.js` is a static-JSON-in-file, protected by `requireAuth`. |
| `backend/scripts/crearUsuario.js` | Password read via `readline`, never `process.argv` — confirmed empirically that `ps` output during a piped invocation shows only `usuario`/`nombre` argv, never the password (§3). Non-TTY (piped) path uses a plain `readline.question`. TTY path uses the `_writeToOutput` override technique (assessed in §4 — code-reviewed only, could not be exercised in this sandbox, same limitation the apply report noted). `bcryptjs.hash(plain, 12)`, `ON CONFLICT (usuario) DO NOTHING`, prints only `id`/`usuario`, exits non-zero on existing user or password `<12` chars — all match tasks.md 4.3 and design.md. |
| `backend/package.json` | `bcryptjs` added to `dependencies` (not `devDependencies`) — correct for `npm ci --omit=dev`, matches ADR-2. `package-lock.json` diff is mechanical/minimal (one dependency entry). |

No design deviations found. No spec/code mismatches found in source inspection.

## 3. Independent runtime verification

Performed on a **fresh** throwaway Docker Postgres (`postgres:16-alpine`, container `bienestar-verify-pg`, port 55432) and a freshly `npm ci`'d local backend instance — **not** `npm run dev` (which proxies to production, per design.md's explicit warning). Container was torn down (`docker rm -f`) after testing; backend process was killed after testing.

| # | Scenario | Result |
|---|---|---|
| 1 | Boot with `SESSION_SECRET` unset | Exit code **1**, error `[api] SESSION_SECRET no está configurada (mínimo 32 caracteres)`. PASS |
| 1b | Boot with `SESSION_SECRET` set but `< 32` chars (`"tooshort"`) | Also exit **1**, same error — confirms the length check, not just presence. PASS (tested against a second isolated throwaway container to avoid interference) |
| 2 | Boot with valid 64-char `SESSION_SECRET` | Boots clean, `/api/salud` → `{"ok":true}`. PASS |
| 3 | Second boot (idempotent DDL) against the same already-initialized DB | No DDL error, boots clean a second time. Confirms the `DO $$...EXCEPTION` CHECK-constraint pattern and all `ADD COLUMN IF NOT EXISTS`/`CREATE INDEX IF NOT EXISTS` statements are safely re-runnable. PASS |
| 4 | `crearUsuario.js` via piped stdin (`echo "supersecretpass123" \| node scripts/crearUsuario.js jperez "Juan Perez"`) | Created id=1, printed only `id`/`usuario`, never the password. `SELECT password_hash` shows `$2a$12$svIMj...` (bcrypt format, cost 12). PASS |
| 4b | `ps` snapshot during a live piped `crearUsuario.js` invocation | `ps -eo pid,args` showed only `node scripts/crearUsuario.js msuarez Maria Suarez` — no password string anywhere in argv. PASS |
| 4c | grep backend server logs for any plaintext password string used during this session | Zero matches across all captured log files. PASS |
| 5 | `POST /api/login` valid credentials | `200`, `Set-Cookie` present and signed (contains `s%3A` = URL-encoded `s:`), body `{success:true,user:{usuario,nombre}}`. PASS |
| 6 | `POST /api/login` wrong password | `401 {success:false,error:'Credenciales inválidas.'}`, no `Set-Cookie`. PASS |
| 7 | `/api/citas`, `/api/servicios`, `/api/usuario` with a valid session cookie | All three → `200`. PASS |
| 8 | Same three routes with no cookie | All three → `401`. PASS |
| 9 | Forged cookie (`bienestar_session=deadbeef`) | `401` — bad signature never reaches the DB lookup. PASS |
| 10 | `GET /api/citas` default listing | Paginated response with `pagination:{page,limit,total,totalPages}`. PASS |
| 11 | `GET /api/citas?estado=pendiente` | Only `pendiente` rows returned. PASS |
| 12 | `GET /api/citas?servicio_slug=medico` | Only matching rows returned. PASS |
| 13 | `GET /api/citas?estado=inventado` | `400`, no silent fallback. PASS |
| 14 | `PATCH /api/citas/:id {estado:atendida}` on a pendiente cita | `200`, `estado:"atendida"`, `atendida_por:1` (the authenticated user's id), `atendida_at` set to current time. PASS |
| 15 | `PATCH /api/citas/:id {estado:pendiente}` (revert) | `200`, `estado:"pendiente"`, `atendida_por:null`, `atendida_at:null`. PASS |
| 16 | `PATCH` with `estado:"cerrada"` | `400`, no row modified. PASS |
| 17 | `PATCH` on id `999999` | `404`. PASS |
| 18 | `PATCH` with no session cookie | `401`. PASS |
| 19 | `POST /api/logout` then replay the old cookie against `/api/citas` | Logout → `200`; replay → `401`. Confirms server-side revocation (not merely clearing the client cookie). PASS |
| 20 | `POST /api/logout` called twice / with no cookie | Both return `200` — idempotent as specced. PASS |
| 21 | 12 consecutive failed `POST /api/login` attempts | First 9 → `401`, then `429` starting at attempt 10, consistent with `limit:10, skipSuccessfulRequests:true`. PASS |
| 22 | Session expiry (`UPDATE sesiones SET expira_at = now() - interval '1 hour'`, then replay) | Before: `200`. After forced expiry: `401`. PASS |

All 22 independently-executed scenarios pass. This corroborates (does not merely trust) the apply-progress report's manual-verification claims — I ran a fresh instance/DB myself rather than relying on its transcript, and every result matches.

One test-methodology note (not a code defect): the `Set-Cookie` response carries `Secure`, so `curl`'s cookie jar correctly refuses to replay it over plain `http://localhost`. I worked around this by extracting the cookie value from the jar and sending it via an explicit `Cookie:` header — this is a curl/http-vs-https testing artifact, not a bug; `secure:true` is correct and intentional for the real HTTPS deployment.

## 4. TTY password-masking path — explicit residual-risk assessment

`crearUsuario.js`'s interactive (TTY) branch was **code-reviewed but not runtime-exercised** in this sandbox, which has no interactive TTY available to either agent — same limitation the apply report honestly disclosed.

```js
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true })
rl._writeToOutput = (stringToWrite) => {
  if (stringToWrite === promptText || stringToWrite === '\n' || stringToWrite === '\r\n') {
    rl.output.write(stringToWrite)
  }
}
rl.question(promptText, (answer) => {
  rl.output.write('\n')
  rl.close()
  resolve(answer)
})
```

Assessment:
- This is the standard, widely-used (if undocumented/internal) technique for masking `readline` input in Node — overriding `Interface.prototype._writeToOutput` to selectively suppress echo of typed characters while still allowing the prompt text and terminal newlines through. It is the same mechanism used by long-standing npm packages that implement password prompts without a native dependency (e.g. `readline-sync`'s masked-question mode).
- Confirmed `readline.Interface.prototype._writeToOutput` exists as a real method on this Node version (`v22.22.1`) via direct inspection — the override target is real, not a typo'd no-op.
- Correctness of the *returned value* does not depend on what gets echoed: `rl.question(promptText, callback)` resolves `answer` with whatever was actually typed into the underlying line buffer, regardless of what `_writeToOutput` chose to display. So even if the visual masking behaves imperfectly on some terminal (e.g., a full-line redraw after backspace not repainting, since redraws aren't `===` to `promptText`/newline and get silently dropped), the **security property** (no password characters ever written to the terminal) holds, and the **functional property** (correct password captured) is unaffected by the override.
- Genuine residual risk, called out honestly rather than either dismissed or treated as blocking: `_writeToOutput` is an internal/undocumented Node API. It has been stable across Node LTS versions for a long time and is a known pattern, but it is not part of Node's public `readline` contract, so a future Node major could rename/remove it without a deprecation cycle. If that happened, the TTY branch would need updating (worst case: it throws, or echo suppression silently stops working and passwords are echoed in that branch only — the piped/non-TTY path, which was actually tested, is on a separate code path and unaffected either way).
- This is a WARNING, not a CRITICAL: the actually-tested piped path is what the design.md verification block and typical automated/CI provisioning would use; the TTY path is an operator-convenience fallback for a rare manual CLI invocation. Recommend a human runs the interactive path once before/soon after this PR lands, but it does not block PR #1 merge on its own.

## 5. Spec-by-spec compliance matrix

### `staff-auth` (7 requirements/scenario groups — all covered)

| Requirement | Scenarios | Status |
|---|---|---|
| Credential Verification | Valid creds succeed / Invalid rejected / No plaintext anywhere | COVERED — runtime-verified (§3 #5,#6,#4) |
| Server-Side Session Lifecycle | Login creates session / Forged cookie fails / Session expires | COVERED — runtime-verified (§3 #5,#9,#22) |
| requireAuth Middleware Enforcement | No cookie / Valid session passes | COVERED — runtime-verified (§3 #7,#8) |
| Logout Invalidation | Logout revokes / Old cookie fails after logout | COVERED — runtime-verified (§3 #19) |
| Login Rate Limiting | Repeated failures trigger limit | COVERED — runtime-verified (§3 #21) |

### `cita-management` (2 requirements — all covered)

| Requirement | Scenarios | Status |
|---|---|---|
| List Citas | Unauthenticated rejected / paginated / filter estado / filter servicio_slug / uniform visibility (single-role model, no per-service restriction — confirmed by code inspection: no role/service filter exists anywhere in the query or middleware) | COVERED — runtime-verified (§3 #7,#8,#10,#11,#12); uniform-visibility scenario confirmed by source inspection since there is only one account "tier" and no service-based ACL in `listCitas`/`requireAuth` |
| Update Cita Estado | Mark attended / Revert / Unauthenticated rejected / Unknown id / Invalid estado | COVERED — runtime-verified (§3 #14,#15,#18,#17,#16) |

### `cita-intake` (2 modified requirements — both covered)

| Requirement | Scenarios | Status |
|---|---|---|
| Cita Schema | Idempotent schema addition / New cita defaults to pendiente / Existing rows unaffected | COVERED — idempotent double-boot verified (§3 #3); new-cita-defaults verified by direct `INSERT` + read-back in §3 test data (both seeded rows came back `estado:"pendiente"`, `atendida_por/atendida_at: null` before any PATCH); "existing rows unaffected" is a column-default guarantee inherent to `ADD COLUMN ... DEFAULT 'pendiente'`, verified by inspection of the DDL and by the fact this repo's `citas` table pre-existed this change (from `bienestar-cita-integration`) with no `estado` column, and the DDL adds it as `NOT NULL DEFAULT 'pendiente'` which Postgres back-fills atomically for pre-existing rows — not independently re-tested against production data (out of scope: this PR has not deployed) |
| Retention Purge | Old row purged regardless of estado / Recent row retained regardless of estado | COVERED BY INSPECTION ONLY — `purgeExpiredCitas` deletes by `created_at < cutoff` with no `estado` predicate in the `WHERE` clause (unchanged from the pre-existing `bienestar-cita-integration` implementation, confirmed by reading `citaStore.js`); not independently re-run at runtime in this pass since it requires a 12-month-old row and this scenario was already covered by the *prior* change's own verification — no regression risk since the query's `WHERE` clause was not touched by this PR (only the SELECT-adjacent columns were added) |

## 6. Task completion cross-check

Phases 1-5 (17 subtasks: 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.3, 5.1-5.3) are all marked `[x]` in tasks.md. Every one of those was independently confirmed against actual code and/or runtime behavior above — no task is marked complete without corresponding evidence. Phases 6-9 remain unchecked, correctly reflecting that PR #2/#3 (frontend) has not been implemented — consistent with this being a PR #1-scoped verification pass.

## 7. Issues found

**CRITICAL**: None.

**WARNING**:
- `crearUsuario.js` TTY-masking branch (interactive terminal password entry) relies on an undocumented Node internal (`readline.Interface.prototype._writeToOutput`) and was code-reviewed but not runtime-exercised by either the apply or verify pass, for the same sandboxing reason (no TTY available). See §4 for full assessment — recommend one manual interactive smoke test by an operator before/soon after this PR lands, not a merge blocker.

**SUGGESTION**:
- None beyond what's already flagged as an open, out-of-scope follow-up in design.md/proposal.md (MINEDU compliance states, `idema/src/data/navigation.ts` dead links) — both explicitly out of this change's scope and already tracked there, not new findings.

## 8. Verdict

**PASS WITH NOTES**

All spec requirements and scenarios in `staff-auth`, `cita-management`, and `cita-intake` that fall within PR #1's backend scope are implemented correctly and independently runtime-verified against a fresh Docker Postgres instance, not merely trusted from the apply report's transcript. The any-cookie-authenticates bug this PR set out to fix is confirmed fixed: `requireAuth` performs a real server-side session lookup (`verificarSesion`), and I directly demonstrated that a forged cookie, an expired session, and a post-logout replayed cookie all correctly return 401. No plaintext password appears anywhere in the DB, logs, or process arguments for the tested (piped) path. Scope boundaries are clean: zero frontend/`src/` files and zero `idema`-repo files touched.

The sole open item is the TTY-masking code path in `crearUsuario.js`, which looks correct on inspection (uses a standard, if undocumented, Node technique, and the returned password value does not depend on the echo-suppression logic working perfectly) but could not be exercised interactively in either agent's sandbox. This is a WARNING, not a CRITICAL, and does not block merging PR #1.

**Recommendation**: proceed to `sdd-archive` for the PR #1 slice, or continue directly to implementing PR #2 (Phases 6-7, frontend panel) per the existing chained-PR plan. If archiving now, carry the TTY-masking follow-up note forward so a human performs one interactive `crearUsuario.js` smoke test.
