# Delta for Cita Intake

> Note: no prior `openspec/specs/cita-intake/spec.md` exists in this repo (the
> originating change `bienestar-cita-integration` was never archived through
> the SDD pipeline). The MODIFIED blocks below reconstruct current behavior
> from `backend/lib/citaStore.js` as the baseline, per the proposal's mandate
> to spec the additive columns precisely.

## MODIFIED Requirements

### Requirement: Cita Schema

The system MUST persist cita records in a `citas` table created idempotently via boot-time DDL (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`). The table MUST carry a lifecycle state: `estado TEXT NOT NULL DEFAULT 'pendiente'`, `atendida_por INT`, `atendida_at TIMESTAMPTZ`, in addition to the existing intake fields (`nombre_completo`, `email`, `telefono`, `servicio_slug`, `servicio`, `mensaje`, `consentimiento`, `consentimiento_at`, `politica_version`, `origen`, `created_at`).
(Previously: `citas` had no lifecycle/audit columns — only intake fields.)

#### Scenario: Idempotent schema addition

- GIVEN a `bienestar-db` where `citas` already has `estado`/`atendida_por`/`atendida_at`
- WHEN the boot-time DDL runs again
- THEN no error occurs and the columns are unchanged

#### Scenario: New cita defaults to pendiente

- WHEN a new cita is inserted via the existing intake flow
- THEN `estado='pendiente'` and `atendida_por`/`atendida_at` are `NULL`

#### Scenario: Existing rows unaffected by migration

- GIVEN rows inserted before the schema addition deploys
- WHEN `ADD COLUMN IF NOT EXISTS` runs
- THEN those rows gain `estado='pendiente'` (column default) with no data loss to existing fields

### Requirement: Retention Purge

The system MUST delete citas with `created_at` older than 12 months (`RETENTION_MONTHS`), regardless of `estado`. Deleting a row MUST drop all its columns, including the lifecycle/audit columns, since purge is row-level.
(Previously: purge deleted rows containing only intake fields; behavior is unchanged — it now also removes the new columns because they belong to the same row.)

#### Scenario: Old row purged regardless of estado

- GIVEN a cita with `created_at` before the 12-month cutoff, in either `estado`
- WHEN the retention job runs
- THEN the row (including `atendida_por`/`atendida_at`) is deleted

#### Scenario: Recent row retained regardless of estado

- GIVEN a cita with `created_at` within the retention window
- WHEN the retention job runs
- THEN the row is not deleted, regardless of its `estado`
