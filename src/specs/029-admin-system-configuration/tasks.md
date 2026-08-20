# Tasks: Admin System Configuration

**Input**: Design documents from `specs/029-admin-system-configuration/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/system-configuration-api.md`, `quickstart.md`

**Tests**: Feature-specific unit tests are intentionally excluded. API integration tests are included for endpoint contracts, authorization, persistence failure/interruption, and response objectives; business and UI outcomes are also verified through the documented manual acceptance flow.

**Organization**: Tasks are grouped by user story so each story can be implemented and validated as an incremental delivery.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel because it targets different files and has no dependency on an unfinished task in the same phase.
- **[Story]**: Maps a task to User Story 1, 2, or 3 from `spec.md`.
- Every checklist item includes an exact repository-relative file path.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the canonical file-only configuration and immutable runtime options without changing database state.

- [X] T001 Create the complete initial 14-value policy document with the exact fixed key set in `server/src/config/system-configuration.json`
- [X] T002 [P] Implement canonical path resolution and injectable test-path support without file persistence logic or artificial multi-process enforcement in `server/src/config/system-configuration.config.mjs`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement the file-backed Model and validated active snapshot required by every user story.

**CRITICAL**: No user story implementation begins until this phase is complete.

- [X] T003 Implement JSON loading, sibling temporary-file creation, flush/close, atomic target replacement, best-effort cleanup, and injectable file operations in `server/src/models/system-configuration.models.mjs`
- [X] T004 Implement the single pure canonical validator and serializer including positive-whole-number borrowing policy validation with no separate upper bound in `server/src/utils/system-configuration.utils.mjs`, then consume it for deep-frozen snapshots, SHA-256 versioning, typed errors, no-op detection, and the serialized update queue in `server/src/services/system-configuration.services.mjs`
- [X] T005 Initialize the file-backed Model and validate the configuration before accepting HTTP requests, failing startup on a missing or malformed canonical file, in `server/src/server.mjs`

**Checkpoint**: The server owns one valid immutable snapshot and can durably replace the canonical JSON without partial activation.

---

## Phase 3: User Story 1 - Review and update system parameters (Priority: P1) — MVP

**Goal**: An administrator can load all settings, edit valid values, save one complete policy, reload it, and have new borrowing and penalty operations consume it immediately.

**Independent Test**: Sign in as an administrator, open `/dashboard/admin/system`, change one damage coefficient and `MAX_BORROW_LIMIT`, save, reload, and verify the next borrowing check and return penalty use the new values without restart.

### API Integration Tests for User Story 1

- [X] T006 [P] [US1] Add a temporary-directory and injected-Model API harness plus happy-path admin GET/PUT envelope and persistence coverage in `server/tests/integration/system-configuration.api.spec.mjs` and register it in `server/vitest.config.mjs`

### Implementation for User Story 1

- [X] T007 [P] [US1] Remove static configurable penalty constants and make pure penalty functions accept one explicit policy snapshot while preserving overdue, rounding, cap, and explicitly supplied item-specific lost-amount behavior in `server/src/utils/penalty.utils.mjs`
- [X] T008 [US1] Replace the exported static borrowing limit with one active configuration snapshot captured per eligibility operation in `server/src/services/library.services.mjs`
- [X] T009 [US1] Return the current configured borrowing limit instead of importing a static constant in `server/src/controllers/user.controllers.mjs`
- [X] T010 [US1] Replace duplicated damage, fee, and general-lost literals with shared penalty utilities and one captured snapshot per return transaction in `server/src/services/dashboard.librarian.services.mjs`
- [X] T011 [US1] Implement thin GET and valid PUT handlers with the unified success envelope in `server/src/controllers/system-configuration.controllers.mjs`
- [X] T012 [US1] Define GET and PUT routes using existing authentication and `authorizeRole('admin')` middleware in `server/src/routes/system-configuration.routes.mjs`
- [X] T013 [US1] Mount the System Configuration router only after configuration initialization succeeds in `server/src/server.mjs`
- [X] T014 [P] [US1] Build an unlabeled reusable numeric control atom with editable/read-only modes, numeric input semantics, forwarded IDs, and no hardcoded user-facing copy in `client/app/components/atoms/ConfigurationNumberInput.tsx`
- [X] T015 [US1] Export the numeric control atom through `client/app/components/atoms/index.ts`
- [X] T016 [US1] Compose the input ID, localized label, description, stable key, value, and error presentation into a reusable field molecule in `client/app/components/molecules/ConfigurationField.tsx`
- [X] T017 [US1] Export the configuration field molecule through `client/app/components/molecules/index.ts`
- [X] T018 [P] [US1] Add matching English and Vietnamese page titles, descriptions, section headings, field labels/help, key labels, actions, loading copy, and success copy in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T019 [US1] Implement loading, grouped draft editing, dirty detection, valid complete-document save, Save Changes controls placed in each reference-style setting card, page-level discard behavior, and success feedback using `apiFetch` in `client/app/components/organisms/SystemConfigurationForm.tsx`
- [X] T020 [US1] Export the configuration form organism through `client/app/components/organisms/index.ts`
- [X] T021 [US1] Replace the placeholder with the localized System Configuration composition inside the existing admin shell in `client/app/dashboard/admin/system/page.tsx`

**Checkpoint**: User Story 1 is usable as the MVP; valid changes persist and affect the next applicable operation without restart.

---

## Phase 4: User Story 2 - Prevent invalid or accidental policy changes (Priority: P2)

**Goal**: Invalid, empty, stale, failed, interrupted, or discarded edits never replace the last valid policy, and the administrator receives precise recovery guidance.

**Independent Test**: Clear any editable field, submit whitespace-only, negative/non-numeric/non-finite values, a fractional borrowing limit, an altered fixed key set, a stale version, and simulated persistence failures; verify Save is unavailable for empty drafts, requests are rejected appropriately, and the last valid file/snapshot remains active.

### API Integration Tests for User Story 2

- [X] T022 [P] [US2] Extend API coverage for missing, additional, `null`, empty, whitespace-only, numeric-string, non-finite, negative or fractional borrowing limits, and non-zero `perfect_condition` inputs with field-level `400` responses in `server/tests/integration/system-configuration.api.spec.mjs`
- [X] T023 [US2] Extend the injected-Model API harness for stale `409`, ordinary write failure, and failure after temporary-file flush but before replacement, asserting byte-for-byte canonical-file and active-version preservation in `server/tests/integration/system-configuration.api.spec.mjs`

### Implementation for User Story 2

- [X] T024 [US2] Implement exact PUT envelope checks and call the shared pure canonical validator directly while returning stable field paths and required/value error codes without importing Service in `server/src/middlewares/system-configuration.middlewares.mjs`
- [X] T025 [US2] Place validation after authentication/authorization and before the PUT controller in `server/src/routes/system-configuration.routes.mjs`
- [X] T026 [US2] Enforce optimistic version comparison, serialized updates, unchanged-document no-op behavior, and active-snapshot preservation for every Model failure in `server/src/services/system-configuration.services.mjs`
- [X] T027 [US2] Map validation, conflict, unavailable, and persistence failures to the contract's `400`, `409`, and `503` envelopes in `server/src/controllers/system-configuration.controllers.mjs`
- [X] T028 [P] [US2] Add matching English and Vietnamese required-field, validation, conflict, discard, load-failure, save-failure, retry, and reload messages in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T029 [US2] Add draft validation that marks empty/whitespace fields required, rejects borrowing limits that are not positive whole numbers without imposing a second upper-bound policy, keeps Save unavailable and sends no PUT while any value is empty or invalid, and supports discard, retained failure drafts, conflict reload, and retry in `client/app/components/organisms/SystemConfigurationForm.tsx`
- [X] T030 [US2] Associate errors/help with inputs and expose invalid, required, and read-only semantics across `client/app/components/atoms/ConfigurationNumberInput.tsx` and `client/app/components/molecules/ConfigurationField.tsx`

**Checkpoint**: User Stories 1 and 2 work together; no invalid, partial, stale, failed, or interrupted update becomes active.

---

## Phase 5: User Story 3 - Use a consistent, accessible admin experience (Priority: P3)

**Goal**: Only administrators can access the feature, and the complete workflow remains responsive, localized, theme-aware, and keyboard accessible.

**Independent Test**: Test admin/non-admin/unauthenticated access, then complete load/edit/error/discard/save flows using keyboard only at mobile, tablet, and desktop widths in English/Vietnamese and light/dark themes.

### API Integration Tests for User Story 3

- [X] T031 [P] [US3] Extend API integration coverage to prove unauthenticated and non-admin GET/PUT requests expose no configuration and never reach validation or Model persistence in `server/tests/integration/system-configuration.api.spec.mjs`

### Implementation for User Story 3

- [X] T032 [US3] Verify middleware order and consistent admin-only `401`/`403` behavior while retaining existing authentication account lookup in `server/src/routes/system-configuration.routes.mjs`
- [X] T033 [P] [US3] Complete keyboard focus, disabled, read-only, hover, error, responsive, and light/dark styles using existing project conventions in `client/app/components/atoms/ConfigurationNumberInput.tsx` and `client/app/components/molecules/ConfigurationField.tsx`
- [X] T034 [US3] Implement responsive policy sections, logical keyboard order, focus restoration, live status announcements, and mobile-safe actions in `client/app/components/organisms/SystemConfigurationForm.tsx`
- [X] T035 [US3] Ensure the localized heading, description, form landmark, loading/failure fallback, and existing admin-shell composition are accessible in `client/app/dashboard/admin/system/page.tsx`
- [X] T036 [P] [US3] Audit System Configuration localization-key parity and remove all user-facing hardcoded strings in `client/app/locales/en.json` and `client/app/locales/vi.json`
- [X] T037 [US3] Verify admin-only dashboard routing, active sidebar state, no more than two navigation actions, and no horizontal overflow without creating a second admin shell in `client/app/dashboard/layout.tsx`, `client/app/components/organisms/AdminDashboardSidebar.tsx`, and `client/app/dashboard/admin/layout.tsx`

**Checkpoint**: All three stories satisfy authorization, accessibility, responsive, theme, and localization requirements.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify the integrated feature and remove remaining policy duplication or deployment hazards.

- [X] T038 Add authenticated GET and valid PUT integration assertions for the 2-second application response objective under normal local single-process load in `server/tests/integration/system-configuration.api.spec.mjs`
- [X] T039 [P] Run the complete backend suite and resolve feature-related regressions using `server/package.json` and `server/vitest.config.mjs`
- [X] T040 [P] Run client lint and production build and resolve feature-related issues using `client/package.json` and `client/eslint.config.mjs`
- [X] T041 Search for and remove remaining live configurable borrowing/damage/fee literals, including the librarian return-inspection preview; make damage-condition contributions cumulative and monotonic while preserving explicit-cap, lost, and overdue semantics; bind inspection to a configuration version and invalidate stale Return PINs; then document verified consumers in `specs/029-admin-system-configuration/quickstart.md`
- [X] T042 Review startup failure, durable directory permissions, temporary-file cleanup, safe logging, repository-file protection, and single-process deployment guidance across `server/src/config/system-configuration.config.mjs`, `server/src/models/system-configuration.models.mjs`, and `specs/029-admin-system-configuration/quickstart.md`
- [ ] T043 Execute every automated and manual scenario, time SC-003 from completed load to success, prepare the SC-002 evidence template, coordinate the stakeholder-provided 10-administrator walkthrough, and record confirmed anonymous results, deviations, or corrected commands in `specs/029-admin-system-configuration/quickstart.md`
- [X] T044 Reconcile implemented behavior and API envelopes with `specs/029-admin-system-configuration/spec.md`, `specs/029-admin-system-configuration/data-model.md`, and `specs/029-admin-system-configuration/contracts/system-configuration-api.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 — Setup**: No dependencies; T001 and T002 can start immediately.
- **Phase 2 — Foundational**: T003 depends on T001–T002; T004 depends on T003; T005 depends on T004 and blocks all stories.
- **Phase 3 — User Story 1**: Depends on Phase 2 and delivers the MVP.
- **Phase 4 — User Story 2**: Depends on the valid read/save surface from User Story 1; T022 can be drafted after Phase 2.
- **Phase 5 — User Story 3**: T031 can be drafted after Phase 2; UI work depends on the User Story 1 component surface.
- **Phase 6 — Polish**: Depends on every story selected for the release.

### User Story Dependency Graph

```text
Setup → Foundation → US1 (MVP)
                   ├──→ US2 (validation, conflict, interruption, recovery)
                   └──→ US3 (authorization, responsive, a11y, i18n/theme)
US1 + US2 + US3 → Polish
```

### Within Each User Story

- Add the listed API integration coverage before or alongside the corresponding implementation; no feature-specific unit tests are required.
- Implement the pure validator and Model persistence before the Service that owns snapshot, versioning, and update orchestration.
- Implement services before controllers and routes; keep business logic out of controllers/routes.
- Build frontend components atom → molecule → organism → page.
- Add both English and Vietnamese localization keys before considering UI work complete.
- Stop at each checkpoint and run the story's independent test before proceeding.

## Parallel Opportunities

### User Story 1

```text
T006: happy-path API integration contract
T007: pure penalty utility refactor
T014: unlabeled numeric input atom
T018: localized review/edit/save copy
```

After these independent surfaces exist, complete the backend chain and compose molecule → organism → page.

### User Story 2

```text
T022: invalid-input API integration cases
T028: localized validation/recovery copy
```

T023–T027 follow the persistence/service/API dependency chain; T029–T030 integrate client behavior afterward.

### User Story 3

```text
T031: authorization integration cases
T033: atom/molecule accessibility and theme styling
T036: localization parity audit
```

These tasks touch distinct backend, component, and locale surfaces; T034–T037 integrate their results.

## Implementation Strategy

### MVP First

1. Complete T001–T005.
2. Complete T006–T021 for User Story 1.
3. Run the User Story 1 independent test and verify a saved change affects the next borrowing/return operation.
4. Stop and demo the MVP; include User Story 2 before any production release because the values affect eligibility and financial penalties.

### Incremental Delivery

1. **Foundation**: Canonical JSON, path-only config, file-backed Model, validated immutable snapshot, and atomic persistence.
2. **US1**: Admin review/edit/save plus real borrowing and penalty consumers.
3. **US2**: Required/complete validation, stale-write protection, interruption safety, discard, and recovery behavior.
4. **US3**: Authorization proof, accessibility, responsive layout, localization, and theme parity.
5. **Polish**: Response objective, full suites, build, duplication audit, deployment/recovery checks, and document reconciliation.

### Suggested Production Scope

User Story 1 is the demonstrable MVP. User Story 2 is part of the minimum safe production scope because configuration values directly affect borrowing eligibility and financial penalties.

## Notes

- Tasks marked `[P]` target different files or independent test surfaces.
- No task creates or modifies database schema/data for System Configuration; existing authentication may keep its current account lookup.
- Exactly one Node.js backend process may own `server/src/config/system-configuration.json`; multi-process locking is outside scope.
- API integration tests that write configuration use an injected temporary path and never modify `server/src/config/system-configuration.json`.
- No feature-specific unit tests are included.
- Existing unrelated working-tree changes must be preserved.
- Commit only when explicitly requested or by invoking the optional Spec Kit git hook.
