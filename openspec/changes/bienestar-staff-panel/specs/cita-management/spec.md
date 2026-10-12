# Cita Management Specification

## Purpose

Authenticated staff listing, filtering, and status triage of citas, with a per-user audit trail for who marked a cita attended and when.

## Requirements

### Requirement: List Citas

The system MUST expose `GET /api/citas`, protected by `requireAuth`, returning paginated results filterable by `estado` and `servicio_slug`. All authenticated staff MUST see all citas — no per-service visibility restriction.

#### Scenario: Unauthenticated request rejected

- WHEN `GET /api/citas` is called without a valid session
- THEN the response is `401`

#### Scenario: Default listing is paginated

- GIVEN an authenticated session
- WHEN `GET /api/citas` is called with no filters
- THEN a page of citas is returned with pagination metadata (e.g. page/limit/total)

#### Scenario: Filter by estado

- GIVEN citas with mixed `estado` values
- WHEN `GET /api/citas?estado=pendiente` is called
- THEN only `pendiente` rows are returned

#### Scenario: Filter by servicio_slug

- WHEN `GET /api/citas?servicio_slug=X` is called
- THEN only rows matching `servicio_slug=X` are returned

#### Scenario: Visibility is uniform across staff

- GIVEN two different staff accounts
- WHEN each calls `GET /api/citas` with identical filters
- THEN both receive the identical result set

### Requirement: Update Cita Estado

The system MUST expose `PATCH /api/citas/:id`, protected by `requireAuth`, transitioning `estado` between `pendiente` and `atendida`. The transition MUST be reversible. Transitioning to `atendida` MUST stamp `atendida_por` (the authenticated user) and `atendida_at` (now). Transitioning back to `pendiente` MUST clear both fields.

#### Scenario: Mark attended

- GIVEN a `pendiente` cita and an authenticated user U
- WHEN `PATCH /api/citas/:id` sets `estado=atendida`
- THEN `estado` becomes `atendida`, `atendida_por=U`, and `atendida_at` is set to the current time

#### Scenario: Revert to pendiente

- GIVEN an `atendida` cita
- WHEN `PATCH /api/citas/:id` sets `estado=pendiente`
- THEN `estado` becomes `pendiente` and `atendida_por`/`atendida_at` are cleared to null

#### Scenario: Unauthenticated update rejected

- WHEN `PATCH /api/citas/:id` is called without a valid session
- THEN the response is `401`

#### Scenario: Unknown id

- WHEN `PATCH /api/citas/:id` targets a non-existent id
- THEN the response is `404`

#### Scenario: Invalid estado value rejected

- WHEN `PATCH /api/citas/:id` submits an `estado` outside `{pendiente, atendida}`
- THEN the response is `400` and no row is modified
