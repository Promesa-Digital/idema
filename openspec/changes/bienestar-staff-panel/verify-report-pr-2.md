# Verify Report — PR #2 (Bienestar Staff Panel: frontend panel UI + routing)

**Repo verified**: `/home/josedowski/documentos/dev/promesa/bienestar_idema`
**Branch**: `feat/staff-panel-ui` (commits `58c3298`, `e7576c4`), based on `feat/staff-auth-panel-backend` (PR #1, tip `e7d0f5c`, already verified PASS WITH NOTES)
**Scope**: Phases 6-7 of tasks.md only — `src/pages/PanelCitasPage.tsx`, `src/App.tsx`, `src/pages/LoginPage.tsx`
**Verdict: PASS WITH NOTES**

## Completeness

| Task | Status |
|---|---|
| 6.1 `PanelCitasPage.tsx` | [x] done, code confirms |
| 7.1 `App.tsx` routing/probe fix | [x] done, code confirms |
| 7.2 `LoginPage.tsx` probe fix + `onDemoLogin` removal | [x] done, code confirms |
| Phase 8 (deletion), Phase 9 (combined PR2+PR3 manual verification) | correctly left `[ ]` — out of this PR's scope |

## Branch hygiene (self-reported issue #3) — CONFIRMED CORRECT

- `feat/staff-auth-panel-backend`: exactly 4 commits on top of `main` tip `d4a895b` (`e9589c2`, `46b0568`, `660e34a`, `e7d0f5c`) — matches PR #1's verified state, nothing extra.
- `feat/staff-panel-ui`: those same 4 commits plus exactly 2 more (`58c3298`, `e7576c4`).
- `git diff feat/staff-auth-panel-backend..feat/staff-panel-ui --stat` → exactly 3 files: `src/App.tsx` (+14/-10), `src/pages/LoginPage.tsx` (+10/-9), `src/pages/PanelCitasPage.tsx` (+386 new file). Total `404 insertions(+), 25 deletions(-)`. No stray files, no accidental backend changes.
- `git status` on the branch is clean.

## Code review vs design.md Frontend section

- `PanelCitasPage.tsx`: header with `usuario.nombre || usuario.usuario` + logout (`POST /api/logout` → `navigate('/login', {replace:true})`), `estado`/`servicio` filter selects (servicio populated from `GET /api/servicios`, both filters reset `page` to 1 on change), desktop `md:` table + `<md` card list with identical columns (Fecha·Nombre·Contacto·Servicio·Mensaje·Estado·Acción), estado badges exactly `bg-cta/10 text-cta border-cta/30` (pendiente) / `bg-primary/10 text-primary border-primary/30` (atendida), "Atendida por {nombre} · {fecha}" shown conditionally, toggle button disabled while its own PATCH is in flight (`pendingId` state) and refetches the current page on success, Anterior/Siguiente + "Página X de Y" pagination driven by the `pagination` object, loading skeleton / empty state ("No hay solicitudes con estos filtros") / error banner reusing the login page's `bg-cta/10 border-cta/30` style. Every fetch path (`/api/usuario`, `/api/citas`, PATCH) redirects to `/login` on 401. Confirmed against `src/index.css` `@theme` tokens — only `primary/dark/deep/accent/surface/cta` custom tokens plus stock Tailwind `white` (also used unmodified in `LoginPage.tsx`) appear; no new colors or fonts.
- `App.tsx`: `import.meta.env.DEV` bypass fully removed (not hidden — the whole `if` block is gone); `checking` state added, gates initial render (`if (checking) return null`) so an authenticated reload cannot flash `/login`; probe is `res.ok ? Boolean(data?.isAuthenticated) : false`; `/bienestar/:slug` route and its imports (`BienestarPage`, `BienestarDetailPage`) are gone; `/bienestar` now renders `<PanelCitasPage/>` directly (no nested `Route`/`index` wrapper needed since the detail route was removed).
- `LoginPage.tsx`: same `res.ok` guard on its mount probe; `onDemoLogin` prop and its conditional "Ver demo sin credenciales" button are both fully deleted (not just gated behind `DEV`).

## Self-reported issue #1 — lint claim: CONFIRMED, pre-existing, not introduced by this PR

`npm run lint` on `feat/staff-panel-ui`:
```
ESLint couldn't find an eslint.config.(js|mjs|cjs) file.
```
Checked via `git log --all --diff-filter=A --name-only -- '*eslint.config*' '*.eslintrc*'` (searches every ref in the repo) and `git ls-tree -r <first-commit> --name-only | grep -i eslint` on the very first commit (`702178f`, "SDD: Initial commit") — an ESLint config has **never** existed in this repository's history. The failure is identical on every branch/commit; this PR neither introduces nor worsens it. (Used history inspection rather than physically checking out `main` to avoid disturbing the verified branch — equivalent proof, zero risk.)

This is a pre-existing repo-wide gap, not a PR #2 defect, but it does mean **no static lint safety net exists for this or any other PR** — flagged as a WARNING for the project, not this PR specifically.

## Self-reported issue #2 — 400-line budget overage: CONFIRMED, reasonable but flag for the record

`PanelCitasPage.tsx` is exactly 386 lines; the PR totals 429 changed lines (404+/25-), over the 400-line default review budget. Root cause inspected directly: ~95 of those lines (262-356) are a deliberate desktop-`<table>` / mobile-`<div>` card duplication rendering the same 7 fields twice for the two breakpoints — this is the primary length driver, not accidental complexity. State/effects (~80 lines) and JSX for filters/pagination/states are otherwise unremarkable for a single CRUD-triage page.

Assessment: the single-component tradeoff is defensible — there's one cohesive concern (list+filter+paginate+toggle for one entity), no nested business logic, and splitting into e.g. `CitaRow`/`CitaCard` sub-components would reduce line count and duplication but adds file-hopping for a reviewer with no logic gain. It is a legitimate call, not a rationalization. However: tasks.md's own forecast for Unit 2 was ~280 lines, and actual came in at 429 — a 53% miss versus forecast. This is worth surfacing to the orchestrator as a WARNING against the SDD review-workload guard (the guard requires `ask-on-risk`/chained-PR resolution on forecasted risk, and this PR retroactively exceeded a budget forecasted as "near/under") rather than a code defect.

## Runtime verification (repeated independently, not trusted from the apply report)

Spun up a throwaway `postgres:16-alpine` container (port 55432), ran `backend/index.js` locally with `DATABASE_URL`+`SESSION_SECRET`, provisioned a user via `crearUsuario.js`:

- `GET /api/usuario` unauthenticated → `401 {"success":false,"error":"No autenticado."}` — **no `isAuthenticated` key present**, confirming the response shape the `res.ok` guard defends against.
- `POST /api/login` valid credentials → `200` + signed `Set-Cookie`.
- Authenticated `GET /api/usuario` → `200 {"isAuthenticated":true,"user":{...}}`.
- `GET /api/servicios` → matches the shape `PanelCitasPage.tsx` consumes (`servicios[].slug/title`).
- `GET /api/citas` → `{"success":true,"citas":[...],"pagination":{page,limit,total,totalPages}}`, all fields the component reads (`nombre_completo, email, telefono, servicio_slug, servicio, mensaje, created_at, estado, atendida_por, atendida_at, atendida_por_nombre`) present.
- `PATCH /api/citas/:id {estado:"atendida"}` → `estado`/`atendida_por`/`atendida_at` set; revert to `pendiente` → both cleared to `null`. Invalid `estado` → `400`; unknown id → `404`.
- Then temporarily repointed `vite.config.ts`'s dev proxy to the local backend (`perl -pi -e` in-place edit), ran `npm run dev` on port 5199, and re-ran the same requests **through the Vite dev proxy** (not just the bare backend) to prove the frontend's actual request path works end-to-end: unauth `/api/usuario` → 401 no-`isAuthenticated`-key, login → 200+cookie, authenticated `/api/citas` → full shape, `/bienestar` → 200 (SPA shell, client-side routing handles the rest).
- Reverted `vite.config.ts` with `git checkout -- vite.config.ts`, killed the dev server and backend processes, removed the throwaway container and the locally-installed `backend/node_modules`. `git status` confirmed clean on `feat/staff-panel-ui` before and after.

This independently reproduces (rather than merely trusts) the apply report's claims.

`npm run build` (`tsc -b && vite build`) — reran independently, clean:
```
✓ 27 modules transformed.
✓ built in 332ms
```

## PR #3 scope check (must remain untouched)

- `src/pages/BienestarPage.tsx` and `src/pages/BienestarDetailPage.tsx` still exist on disk, byte-for-byte outside this PR's diff (not listed in the 3-file diff stat).
- `rg -n "BienestarPage|BienestarDetailPage" src` (excluding the two files themselves) returns **zero matches** — nothing in the current tree imports them anymore (the only importer, `App.tsx`, had those imports removed in this PR), so they are cleanly orphaned but not broken-and-still-referenced. Consistent with tasks.md Phase 8 not yet having run.
- The rest of the orphaned subtree (`src/components/bienestar/{Accordion,CitaForm}.tsx`, `src/components/ui/{SectionTitle,FieldError,SuccessCheck}.tsx`, `src/data/bienestar.ts`, `src/utils/validation.ts`) also confirmed present and untouched.
- No `package.json`/`package-lock.json` diff between the two branches — no new dependencies introduced, matching the design's "no new deps" claim.

## Issues

**CRITICAL**: none.

**WARNING**:
1. Repo-wide `npm run lint` is non-functional (missing `eslint.config.js`) — pre-existing since the very first commit, not introduced by this PR, but no PR in this project currently has lint coverage. Recommend a follow-up change to add an ESLint flat config, independent of this SDD change.
2. PR #2 landed at 429 changed lines vs. tasks.md's own 280-line forecast for Unit 2 — a real forecast miss against the SDD 400-line review-workload guard, even though the actual code organization (single cohesive component) is a defensible choice. Orchestrator should note this for delivery-strategy calibration on future units, not block on it.

**SUGGESTION**:
1. `PanelCitasPage.tsx`'s desktop-table/mobile-card duplication (~95 lines) could be factored into a shared `CitaRow`/`CitaCard` presentational component to shrink the diff and avoid future double-edits when a column changes — optional, not required for this PR to pass.
2. `GET /api/servicios` fetch in `PanelCitasPage.tsx` silently swallows non-401 errors (empty `.catch(() => {})`, and the `!res.ok && status !== 401` branch does nothing) — the servicio filter dropdown would just stay empty with no user-facing error. Minor; low impact since the primary `/api/citas` fetch still surfaces its own error banner.

## Final Verdict: PASS WITH NOTES

All Phase 6-7 tasks are complete and match the code. `npm run build` is clean (verified independently). Runtime behavior was independently reproduced end-to-end through the actual Vite dev proxy, not just trusted from the apply report. Branch hygiene is exactly as claimed. Both self-reported issues (lint, line count) were independently investigated and confirmed accurate and non-blocking. PR #3 (deletion) scope is untouched and has no dangling references. Recommend proceeding to PR #3 (Phase 8-9) or archive of this slice once the orchestrator/user accepts the two WARNING notes above.
