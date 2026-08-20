# Research: Admin System Configuration

**Feature**: `029-admin-system-configuration`  
**Date**: 2026-08-01

## Decision 1: Separate mutable configuration from source modules

**Decision**: Store the canonical document at `server/src/config/system-configuration.json` in the backend's existing configuration directory. Resolve its canonical path in `server/src/config/system-configuration.config.mjs`, and perform JSON loading and atomic persistence through `server/src/models/system-configuration.models.mjs`.

**Rationale**: Keeping JSON separate from executable modules avoids rewriting JavaScript, module-cache behavior, and syntax corruption while honoring the single-server/no-database constraint. The verified repository already owns `server/src/config/`, so using it avoids adding an unverified root directory. A file-backed Model preserves the required `route -> middleware -> controller -> service -> model` boundary without adding a database table.

**Alternatives considered**:

- Edit `penalty.utils.mjs` and `library.services.mjs` directly: rejected because code modules are cached, require reload coordination, and can become syntactically invalid.
- Add a new `server/config` directory: rejected during implementation because the workspace permits changes only under verified existing directories and `server/src/config` is already the project's configuration location.
- Environment variables: rejected because the admin page must persist changes and apply them without restart.
- Database or external configuration service: rejected by explicit scope.

## Decision 2: Use a validated in-memory snapshot with explicit updates

**Decision**: Load and validate the file before the HTTP server starts, expose an immutable in-memory snapshot for reads, and update that snapshot only after a successful file replacement. Do not watch or reread the file on every calculation.

**Rationale**: Business reads remain synchronous and consistent, the next operation sees a successful admin update, and low-frequency disk I/O is isolated to explicit configuration operations. Startup fails fast if no valid policy exists rather than silently running unknown defaults.

**Alternatives considered**:

- Read JSON for every borrowing/penalty operation: rejected due to repeated I/O and the possibility of observing a partial external write.
- File watcher/hot reload: rejected because the application is the only supported writer and watcher events add platform-specific complexity.
- Import JSON as an ES module: rejected because module caching prevents live updates.

## Decision 3: Serialize writes and replace the file atomically

**Decision**: Queue writes inside exactly one Node.js backend process; write validated canonical JSON through the file-backed Model to a uniquely named temporary file in the same directory, flush/close it, replace the target, and only then swap the service's in-memory snapshot. Clean up the temporary file on failure.

**Rationale**: Node documents that overlapping `writeFile` calls without awaiting completion are unsafe. A serialized temp-file replacement prevents partial JSON and guarantees that readers use either the previous complete snapshot or the new complete snapshot. See the [Node.js file-system documentation](https://nodejs.org/api/fs.html#fspromiseswritefilefile-data-options).

**Alternatives considered**:

- Write directly to the target file: rejected because a crash or interrupted write can truncate the only valid configuration.
- Add an inter-process locking dependency: rejected because a process-local queue is sufficient for the explicitly single-process writer scope; multi-process deployment is unsupported.
- Maintain backup history: deferred because persistent audit/history is out of scope.

## Decision 4: Derive a version token and reject stale saves

**Decision**: Derive a deterministic SHA-256 version token from the canonical validated configuration. GET returns it; PUT includes it as `expectedVersion`; mismatch returns `409 CONFIG_VERSION_CONFLICT` without writing.

**Rationale**: Two administrators can edit concurrently. Optimistic concurrency prevents an older screen from silently overwriting a newer complete configuration without adding database state or metadata keys to the stakeholder-defined JSON.

**Alternatives considered**:

- Last-write-wins: rejected because it silently loses valid admin changes.
- Store an incrementing version in JSON: rejected because version is transport/concurrency metadata, not a business parameter.
- OS-level long-lived file locks: rejected as unnecessary for one application writer.

## Decision 5: Keep the JSON keys aligned with existing business constants

**Decision**: Use the top-level keys `MAX_BORROW_LIMIT`, `FEE_ADMIN`, `FEE_ADDON`, and `DAMAGE_COEFFICIENTS`; retain the exact eleven condition keys.

**Rationale**: This minimizes migration ambiguity, makes the file directly understandable alongside existing code, and supports strict rejection of missing, additional, renamed, or mistyped settings.

**Alternatives considered**:

- Nested camelCase API-only shape: rejected because it creates a second naming vocabulary and more mapping code.
- Arbitrary key/value list: rejected because it permits unsupported settings and weakens validation.

## Decision 6: Centralize every live consumer, including duplicated return logic

**Decision**: Remove static policy values from `library.services.mjs` and `penalty.utils.mjs`, update `user.controllers.mjs`, and replace the duplicated penalty formula inside `dashboard.librarian.services.mjs` with the shared pure penalty utilities fed by one configuration snapshot captured at the start of the operation.

**Rationale**: Repository inspection found that the real return workflow duplicates damage coefficients and fees rather than calling `penalty.utils.mjs`. Updating only the two files named in the original request would leave actual return penalties unchanged. One snapshot per operation also prevents a mid-operation configuration change from mixing old and new values.

**Alternatives considered**:

- Change only exported constants: rejected because the live return path contains separate literals.
- Let utilities read the file directly: rejected because it breaks utility purity and couples calculations to I/O.
- Reimplement the formula in each service: rejected because it recreates the current divergence.

## Decision 7: Preserve unrelated penalty behavior

**Decision**: Keep current overdue percentages/grace-day behavior and existing transaction semantics unchanged. The configured `lost` coefficient replaces only the general hardcoded `2x` lost multiplier. The pure calculation contract may honor an item-specific amount explicitly supplied by an existing caller, but this feature does not create, store, query, or infer such an amount; the current librarian return flow therefore uses the general coefficient unless it already supplies one.

**Rationale**: Overdue policy, database records, and return transaction behavior are explicitly outside scope. Configuration changes apply only to new computations and eligibility checks.

**Alternatives considered**:

- Move overdue constants into the new file: rejected as unrequested scope expansion.
- Recalculate historical penalties: rejected because recorded financial outcomes must remain stable.

## Decision 8: Treat single-process ownership as a deployment invariant

**Decision**: Run exactly one Node.js backend process against the canonical JSON file. Cluster mode, multiple PM2 workers, and multiple application instances sharing the file are unsupported for this feature.

**Rationale**: The in-process queue and optimistic version check completely serialize writes only within one process. Making that operational assumption explicit keeps the no-database design correct for the stakeholder's single-server deployment.

**Alternatives considered**:

- Cross-process lock files: rejected because crash recovery, stale-lock handling, and platform differences expand scope.
- Shared database or configuration service: rejected by the explicit file-only requirement.
- Multiple processes with independent snapshots: rejected because they can serve stale values and overwrite each other's saves.

## Decision 9: Follow existing Express and frontend integration patterns

**Decision**: Add `GET` and `PUT` router methods protected by `verifyToken` and `authorizeRole('admin')`, with request validation before the controller. Put canonical configuration validation and serialization in the pure `system-configuration.utils.mjs` utility so both Middleware and Service reuse one implementation without Middleware importing Service. The client calls the endpoints through existing `apiFetch` and renders explicit load/edit/validation/save/conflict states.

**Rationale**: This matches the verified repository architecture and Express router-level middleware model described in the [Express middleware guide](https://expressjs.com/en/guide/using-middleware.html). It also keeps backend authorization authoritative even though the dashboard already has a client route guard.

**Alternatives considered**:

- Client-only role protection: rejected because direct API requests would bypass it.
- Place file access in the controller: rejected because it violates the project's layered architecture.
- Let Middleware import Service for validation: rejected because it would bypass the mandatory `Route -> Middleware -> Controller -> Service -> Model` request-layer sequence.
- Add a new frontend data library: rejected because the fixed form does not require it and `apiFetch` already standardizes authenticated requests.

## Decision 10: Design within the existing admin visual system

**Decision**: Use the existing admin navigation, page spacing, typography, theme utilities, localized copy, form atoms, and toast/banner conventions. Present a restrained policy workspace with three sections and one page-level save/discard action; omit unrelated controls from the external layout reference.

**Rationale**: Project-local instructions explicitly make external designs layout references only. A settings-specific composition reduces cognitive load and maintains continuity with the rest of the application.

**Alternatives considered**:

- Reproduce the reference file literally: rejected because it contains unrelated security, notification, and onboarding features and hardcoded visual values.
- Build a separate admin shell: rejected because navigation, authorization, theme, and footer already exist.
