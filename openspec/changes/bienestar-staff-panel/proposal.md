# Proposal: Bienestar Staff Panel (real auth + cita triage)

## Intent

Citas persist to `bienestar-db` (change `bienestar-cita-integration`) but staff only see them by email; nobody can tell which were already attended, so follow-up is tracked out-of-band.

The portal gate is also fake: `usuario.js` returns `isAuthenticated: true` for *any* cookie value, `cookieParser()` has no secret, credentials are plaintext in `auth.js`, `/api/login` has no rate limit, and no middleware protects `/api/servicios` or `/api/usuario`. This panel is the first surface where health/psychosocial data becomes **readable**, so auth must be real before the data is exposed.

**Revised (post-proposal, user-directed): the login-gated informational replica is removed, not kept alongside the panel.** `bienestar.idema.edu.pe/bienestar` and `/bienestar/:slug` today show the exact same static content already public at `idema.edu.pe/bienestar` — once staff log in, they need the panel, not a second copy of a page they can already see logged out. `pages/BienestarPage.tsx` and `pages/BienestarDetailPage.tsx` (and the `Accordion`/service-detail components that exist only to render them) are deleted from `bienestar_idema`; a successful login routes straight to `/bienestar/panel` (or panel becomes the `/bienestar` route itself — see Approach). `App.tsx`'s route table shrinks accordingly.

## Scope

### In Scope
- `usuarios` table (bcrypt hash) + `sesiones` table in `bienestar-db`; boot-time idempotent DDL, same convention as `citaStore.js`.
- Signed session cookie (`cookieParser(SESSION_SECRET)`), opaque server-side session id, real verification.
- `requireAuth` middleware, applied to the new cita endpoints **and retroactively** to `/api/servicios` and `/api/usuario`.
- `loginLimiter` on `/api/login`; logout deletes the server-side session.
- `citas` gains `estado TEXT NOT NULL DEFAULT 'pendiente'`, `atendida_por INT`, `atendida_at TIMESTAMPTZ` via `ADD COLUMN IF NOT EXISTS`.
- `GET /api/citas` (paginated, filter by `estado` + `servicio_slug`) and `PATCH /api/citas/:id` (set `estado`, stamp who/when).
- New `/bienestar/panel` route + page listing citas with a pendiente/atendida toggle, inside the existing `isAuthenticated` gate, using existing design tokens.
- **Removal**: `pages/BienestarPage.tsx`, `pages/BienestarDetailPage.tsx`, and any component that exists solely to render them, deleted from `bienestar_idema`. Login redirects straight to the panel; the informational-content duplicate of `idema.edu.pe/bienestar` is gone from the authenticated area.
- Account provisioning: manual CLI seed script (`backend/scripts/crearUsuario.js`) run by an operator.

### Out of Scope
- Self-service signup, password reset, MFA, SSO, roles/permissions tiers.
- Editing or deleting citas (status only), CSV/export, new notifications, search, date-range filters.
- Any change to the `idema` landing repo — verified: the panel consumes nothing from it. The public `idema.edu.pe/bienestar` page is untouched; only `bienestar_idema`'s login-gated *copy* of it is removed.

## Capabilities

### New Capabilities
- `staff-auth`: per-user credentials, session lifecycle, `requireAuth` enforcement, login rate limiting.
- `cita-management`: authenticated listing, filtering, and status transitions with per-user audit trail.

### Modified Capabilities
- `cita-intake`: stored citas now carry a lifecycle state (`estado='pendiente'` at creation); retention purge unchanged but now drops audit columns with the row.

## Approach

Approach A from exploration (user-confirmed: "equipo chico, cada uno con su cuenta"). Per-user rows in the already-provisioned Postgres, not a shared credential — this is what makes `atendida_por` meaningful. Server-side sessions (not stateless JWT) because logout must actually revoke, and the team is small enough that a `sesiones` table costs nothing. Schema evolves through the existing boot-time DDL path; no migration tool is introduced.

**Route shape after the informational-page removal**: the panel becomes the destination at `/bienestar` itself (not a nested `/bienestar/panel`) — there is no longer a competing informational page at that path once logged in, so reusing the existing route avoids adding a redirect hop. `App.tsx`'s post-login default becomes the panel; `/bienestar/:slug` is deleted outright (no detail page to link to anymore).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `bienestar_idema/backend/lib/citaStore.js` | Modified | `estado`/audit columns, `listCitas`, `updateCitaEstado` |
| `bienestar_idema/backend/lib/authStore.js` | New | `usuarios`/`sesiones` DDL + queries |
| `bienestar_idema/backend/middleware/requireAuth.js` | New | Session verification |
| `bienestar_idema/backend/routes/auth.js` | Modified | Replaces demo credential set |
| `bienestar_idema/backend/routes/usuario.js` | Modified | Fixes any-cookie-authenticates bug |
| `bienestar_idema/backend/routes/citas.js` | New | `GET /api/citas`, `PATCH /api/citas/:id` |
| `bienestar_idema/backend/index.js` | Modified | Wiring, `loginLimiter`, `cookieParser` secret |
| `bienestar_idema/src/pages/PanelCitasPage.tsx` | New | Panel UI, mounted at `/bienestar` |
| `bienestar_idema/src/App.tsx` | Modified | `/bienestar` now renders the panel post-login; `/bienestar/:slug` route removed |
| `bienestar_idema/src/pages/BienestarPage.tsx`, `BienestarDetailPage.tsx` | Deleted | Informational duplicate of the public landing page, no longer needed once staff land on the panel |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Sensitive health data readable for the first time | High | Real session verification, `requireAuth` on every data route, no PII in logs, dedicated verify pass |
| Missing `SESSION_SECRET` in CapRover silently weakens sessions | Med | Fail loudly at boot, same as `DATABASE_URL` |
| `DEV` bypass in `App.tsx` (`if (import.meta.env.DEV) return`) leaks into a build | Med | Server-side `requireAuth` makes the client gate cosmetic |
| Retro-protecting `/api/servicios` breaks its remaining consumer | Low | Its only consumer is now the panel's servicio filter dropdown (the informational pages that used to call it are deleted) — verify the panel still populates that filter after auth is enforced |
| Fix collides with in-flight `bienestar-cita-integration` deploy | Med | Branch from `main` after deploy verification |

## Rollback Plan

Revert the branch and redeploy the previous tarball. Added columns/tables are additive and idempotent — old code ignores them, so no down-migration is required. `usuarios`/`sesiones` can be dropped manually if fully abandoning.

## Dependencies

- `bienestar-cita-integration` deploy verified in production.
- `bcrypt` (or `@node-rs/bcrypt`) added to `backend/package.json`.
- `SESSION_SECRET` env var provisioned in CapRover.

## Success Criteria

- [ ] Requests without a valid session get 401 on `/api/citas`, `/api/servicios`, `/api/usuario`.
- [ ] A forged/edited cookie value never authenticates.
- [ ] Logout invalidates the session server-side; replaying the old cookie fails.
- [ ] Repeated bad logins hit the rate limit.
- [ ] Staff can list citas and mark one attended; `atendida_por`/`atendida_at` record the actual user.
- [ ] No plaintext password exists anywhere in the repo or DB.

## Proposal question round — resolved

1. **Estados**: user raised a bigger question first — this panel should eventually satisfy Ministry (MINEDU) reporting requirements for student wellbeing services, not just internal triage. **The actual regulation/format is not yet in hand.** Decision: ship the basic two-state model (`pendiente`/`atendida`) now — it's independently useful and verifiable — and treat Ministry-compliance fields/reporting as a **separate future SDD change**, scoped only once the actual normative document/format is available. Do not guess at compliance requirements now.
2. **Reversible**: confirmed yes — `atendida → pendiente` is allowed, each transition re-stamps `atendida_por`/`atendida_at` (or clears them when reverted to `pendiente`).
3. **Visibility**: confirmed — every staff account sees every cita, no per-service restriction. Simpler for now; revisit if the team grows or the Ministry compliance work introduces role requirements.
4. Who provisions accounts, and how often? *Assumed: a developer/operator runs a CLI script, rarely.* (not raised as a concern, keeping the assumption)
5. How long should a session last before forcing re-login? *Assumed: 24h, matching the current cookie `maxAge`.* (not raised as a concern, keeping the assumption)

**Follow-up flagged, not in this change's scope**: once the user has the specific Ministry norm/format for student-wellbeing reporting, a new SDD change should revisit `citas`' `estado` model (may need more states), retention period (12 months, set in `bienestar-cita-integration`, may not match a regulatory minimum), and any required report/export capability.
