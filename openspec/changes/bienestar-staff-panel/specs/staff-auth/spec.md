# Staff Auth Specification

## Purpose

Real per-user authentication and server-verified session lifecycle for `bienestar_idema` staff, replacing the any-cookie-authenticates bypass and plaintext demo credentials.

## Requirements

### Requirement: Credential Verification

The system MUST store staff credentials in a `usuarios` table as bcrypt hashes and MUST verify login attempts via `bcrypt.compare`. The system MUST NOT store, log, or compare plaintext passwords anywhere.

#### Scenario: Valid credentials succeed

- GIVEN a `usuarios` row with a bcrypt hash for `usuario`
- WHEN `POST /api/login` submits the matching plaintext password
- THEN a session is created and a signed cookie is returned with `success: true`

#### Scenario: Invalid credentials rejected

- GIVEN a `usuarios` row exists for `usuario`
- WHEN `POST /api/login` submits a wrong password
- THEN the response is `401` and no session cookie is set

#### Scenario: No plaintext password anywhere

- GIVEN the seed script `crearUsuario.js` provisions an account
- WHEN the row is inserted
- THEN only the bcrypt hash is persisted, and no request/error log ever contains a raw password

### Requirement: Server-Side Session Lifecycle

The system MUST issue a signed, opaque session cookie (`cookieParser(SESSION_SECRET)`) on login and MUST persist the session server-side in a `sesiones` table. Authentication MUST require a server-side lookup, not cookie presence alone.

#### Scenario: Login creates a server-side session

- WHEN login succeeds
- THEN a `sesiones` row is created and the cookie value cannot be used to derive identity without that row

#### Scenario: Forged cookie fails

- GIVEN no matching `sesiones` row exists for a cookie value
- WHEN any protected endpoint is called with that cookie
- THEN the request is treated as unauthenticated (`401`)

#### Scenario: Session expires

- GIVEN a session older than its ~24h lifetime
- WHEN a protected endpoint is called with that session's cookie
- THEN the request is `401`

### Requirement: requireAuth Middleware Enforcement

The system MUST apply `requireAuth` middleware to `/api/citas`, `/api/servicios`, and `/api/usuario`. Requests without a valid session MUST receive `401` before any handler logic runs.

#### Scenario: No cookie

- WHEN `/api/citas`, `/api/servicios`, or `/api/usuario` is called with no session cookie
- THEN the response is `401`

#### Scenario: Valid session passes through

- GIVEN a valid, unexpired `sesiones` row
- WHEN a protected endpoint is called with that cookie
- THEN the request proceeds and the authenticated user is available to the handler

### Requirement: Logout Invalidation

The system MUST delete the server-side session on `POST /api/logout`. A replayed cookie from before logout MUST NOT authenticate afterward.

#### Scenario: Logout revokes session

- GIVEN an active session
- WHEN `POST /api/logout` is called
- THEN the matching `sesiones` row is deleted

#### Scenario: Old cookie fails after logout

- GIVEN a session was deleted via logout
- WHEN the same (now stale) cookie is replayed against a protected endpoint
- THEN the response is `401`

### Requirement: Login Rate Limiting

The system MUST rate-limit `POST /api/login` (`loginLimiter`) to blunt credential-stuffing/brute-force attempts.

#### Scenario: Repeated failures trigger limit

- GIVEN repeated failed login attempts from the same client within the limiter window
- WHEN the attempt count exceeds the configured threshold
- THEN further attempts receive `429` until the window resets
