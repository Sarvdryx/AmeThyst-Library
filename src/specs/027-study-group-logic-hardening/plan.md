# Implementation Plan: Study Group Logic Hardening

**Branch**: `feature/StudyGroup` | **Date**: 2026-07-24 | **Spec**: [spec.md](./spec.md)

**Input**: Delta specification in `specs/027-study-group-logic-hardening/spec.md`, with feature 026 retained as the behavioral baseline.

## Summary

Harden the existing Study Group implementation without adding schema or expanding scope. The work adds relationship-type and student-role authorization at the server boundary, evidence-gated calendar/elapsed-slot validation, true server-driven pagination, recoverable join submission, response-independent post-commit email delivery, contract/localization corrections, and behavioral tests that exercise real call chains. Existing transaction, capacity, notification, route, visual, and Room Reservation behavior remains intact.

## Technical Context

**Language/Version**: TypeScript with React 19/Next.js 16 client; Node.js ES modules server

**Primary Dependencies**: Existing API client, Express 5, PostgreSQL driver, Socket.IO, Nodemailer, project i18n/theme systems

**Storage**: Existing PostgreSQL schema in `database/init_db/postgres`; account-scoped browser storage for lifecycle bell snapshots; no schema change

**Testing**: Vitest, Supertest, TypeScript compiler, ESLint, Next.js production build, existing opt-in performance harness

**Target Platform**: Browser client and Node.js web service

**Project Type**: Split frontend/backend web application

**Performance Goals**: Join progress visible within 100 ms; definitive join result within 2 seconds at p95 under the feature-026 normal-load profile; bounded server pagination

**Constraints**: Work on the current branch; preserve unrelated changes; no SQL/schema/migration changes; EN/VI parity; existing light/dark design; no browser-native confirmation; email failure cannot roll back committed lifecycle actions

**Scale/Scope**: Existing feature-026 profile of at least 100 users, 23 rooms, 500 groups, 2,000 participation rows, and exactly 25 concurrent clients

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate and evidence | Status |
|---|---|---|
| I. Component reuse | Extend the existing request modal, grid, dashboard, notification bell, and atoms; do not introduce a parallel UI system | PASS |
| II. State/data fetching | Every touched interaction exposes loading, error, success, and stale outcomes; base URL remains centralized | PASS |
| III. Responsive UI | Preserve current layouts and interactions; changes are state and data-flow corrections | PASS |
| IV. Performance | Remove SMTP from the user-visible join-response critical path and use bounded authoritative pagination | PASS |
| V. Error/accessibility | Preserve typed input on failure, disable duplicate submission, localize errors, retain dialog semantics | PASS |
| VI/VIII. Workspace/imports | All paths below were verified in the repository | PASS |
| VII. Backend layering | Route → middleware → controller → service → model remains intact; authorization/business decisions stay outside controllers | PASS |
| IX. Theme/localization | No new visual language; all touched text has mirrored EN/VI keys | PASS |

**Pre-research gate**: PASS.

**Post-design gate**: PASS. The design adds no new project, storage system, schema, or UI hierarchy and retains all constitutional boundaries.

## Project Structure

### Documentation

```text
specs/027-study-group-logic-hardening/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── study-group-hardening.openapi.yaml
└── checklists/
    └── requirements.md
```

### Source Code

```text
client/app/
├── study-together/page.tsx
├── dashboard/user/yourstudygroups/page.tsx
├── components/
│   ├── organisms/RequestToJoinModal.tsx
│   ├── organisms/StudyGroupGrid.tsx
│   ├── organisms/StudyGroupInfoModal.tsx
│   └── molecules/AuthActions.tsx
├── types/studyGroup.ts
├── utils/
│   ├── studyGroup.ts
│   └── studyGroupState.ts
└── locales/{en,vi}.json

server/
├── src/
│   ├── routes/study-group.routes.mjs
│   ├── middlewares/{auth,role,study-group}.middleware*.mjs
│   ├── controllers/study-group.controllers.mjs
│   ├── services/study-group.services.mjs
│   ├── models/study-group.models.mjs
│   └── utils/mailer.mjs
└── tests/
    ├── controllers/
    ├── services/
    ├── integration/
    │   ├── study-group.join-state.spec.mjs
    │   └── study-group.pagination-state.spec.mjs
    ├── models/
    └── performance/

database/init_db/postgres/
├── 05_init_rest.sql       # read-only source of truth
└── 06_indexes.sql         # read-only source of truth
```

**Structure Decision**: Modify only the established Study Group resource and its direct frontend/Room Reservation/authentication dependencies. New verification belongs in the existing test categories. No database file is changed.

## Phase 0: Research Decisions

Research is recorded in [research.md](./research.md). Key decisions:

1. Enforce the `type` discriminator in both service checks and mutation predicates so wrong-type IDs cannot cross request/invitation boundaries.
2. Apply a reusable student-role guard to protected Study Group participation and management endpoints while preserving guest discovery/detail.
3. Treat SMTP as post-commit, non-blocking delivery for lifecycle events; return the committed join outcome and emit realtime notification without waiting for SMTP.
4. Diagnose creation boundaries with behavior tests first; add strict date/elapsed-slot validation only where failure is reproduced.
5. Replace the client-side first-50 cache with server metadata and page-specific reads.
6. Preserve one current participation relationship after denial cooldown by removing prior Denied rows before the new Pending insert.
7. Correct misleading timestamp and dissolution contracts without inventing data or changing schema.

No `NEEDS CLARIFICATION` remains.

## Phase 1: Data and State Design

Full invariants and transitions are in [data-model.md](./data-model.md).

- Keep the existing `study_group`, `reserve_room`, and `group_request` shapes.
- Treat `(group, user, type, status)` as explicit mutation preconditions, not merely UI metadata.
- Keep one active Pending/Approved participation invariant and capacity reconciliation inside existing transactions.
- Invitation decline remains Denied without join-request cooldown; request cancellation deletes only `type=request`.
- Reapplication after cooldown removes prior request Denied rows before inserting one Pending request.
- Do not add durable notification storage or timestamp columns.
- Remove Study Group `createdAt`/`updatedAt` from server projections, contracts, client types, and consumers because the schema cannot represent them truthfully. Do not affect participation, invitation, reservation, or notification timestamps.

## Backend Design

### Authorization and type safety

- Add the existing role guard, or a narrowly scoped equivalent, to authenticated endpoints that create, list personal participation, or mutate Study Groups.
- Retain relationship and ownership checks in services.
- After locking a relationship, assert its expected type before state transition.
- Include expected type in conditional update/delete predicates as defense in depth.
- Return structured wrong-type/stale outcomes without revealing another user's private relationship.

### Join latency and delivery

- Measure request phases: validation/authorization, transaction, projection, realtime emission, SMTP scheduling, and client refresh.
- Complete and return the committed participation response without awaiting SMTP.
- Emit the creator-targeted bell event from the committed snapshot exactly once.
- Schedule email delivery with explicit rejection logging; do not let SMTP outcome alter the returned business result.
- Keep invitation creation different: because an invitation is considered sent only after delivery and requires compensation on failure, its existing delivery/cleanup semantics remain synchronous.

### Date validation

- Add failing tests for nonexistent dates, past dates, and same-day elapsed/exact-start slots in Vietnam time before implementation.
- Reuse a single strict calendar parser and existing reservation-time semantics if the tests demonstrate a gap.
- Check reservability again inside the creation transaction so client validation is never authoritative.
- Preserve the existing unique active-slot conflict mapping.

### Contract correction

- Specify deletion confirmation for dissolve.
- Specify wrong-type/stale structured errors.
- Keep zero-to-five optional requirements.
- Remove dishonest Study Group `createdAt`/`updatedAt` fields across the contract and consumers; no schema changes.

## Frontend Design

### Join request

- Change the modal submit contract to an awaited result.
- Add immediate submitting state, disable Send/Close behavior where appropriate, and retain message on failure.
- Close or show success only after persistence succeeds.
- Update the selected card locally from the successful participation result, then refresh the authoritative page without blocking the visible success outcome.
- Ignore stale async responses after account, filter, page, or modal session changes.
- Extract request-session and pagination transitions into pure client state helpers so automated tests execute behavior rather than inspect source text.

### Pagination

- Store `page`, `pageSize`, and server `meta` independently for discovery, Created, and Joined lists.
- Request the selected server page instead of fetching 50 and slicing locally.
- Reset to page 1 on filters/search/tab changes.
- If realtime deletion makes the current page invalid, load the new last valid page.
- Preserve dynamic-route modal state and current list/page when opening and closing details.

### Localization and notification details

- Replace remaining hardcoded Study Group loading/error/ARIA strings with mirrored locale keys.
- Keep Members for invitation and `member_joined`; omit it for event types identified by FR-023.
- Preserve current notification visuals, ordering, account-scoped read state, stale fallback, and background scroll lock.

## Interface Contract

The delta contract is [contracts/study-group-hardening.openapi.yaml](./contracts/study-group-hardening.openapi.yaml). It documents:

- student-role protection for authenticated Study Group operations;
- relationship-type-safe request mutations;
- strict creation-date outcomes;
- authoritative pagination metadata;
- join request response/error behavior;
- dissolution deletion confirmation.

The delta includes discovery, Created, and Joined pagination definitions. Unchanged schemas and routes inherit from `specs/026-study-group-feature/contracts/study-groups.openapi.yaml`.

## Verification Strategy

### Behavioral backend tests

- Wrong-type matrix: request endpoints with invite IDs and invitation endpoints with request IDs.
- Cooldown/reapply matrix: before, exactly at, and after 30 minutes; request-only denial cleanup; rollback when Pending insertion fails; concurrent reapply.
- Role matrix: user/admin/librarian across representative read/mutation routes.
- Date boundary: invalid calendar, past, exact start, elapsed today, future today, future date.
- Concurrent request/accept/approval/slot cases using transaction-aware mocks or isolated PostgreSQL fixtures.
- Assert email is invoked after commit and does not delay or change the returned lifecycle result.
- Assert invitation delivery failure still compensates its Pending invite.
- Assert invitation email failure plus cleanup failure returns a distinct inconsistent-state outcome, logs both failures, and never reports success.
- Race creator approval against invitation acceptance for the final place and assert exactly one Approved transition and one success communication set.
- Assert dissolve response matches deletion confirmation.

### Frontend tests and inspection

- Join modal: execute pure state-transition tests for immediate progress, one in-flight call, retained input/error, successful close, stale-response suppression, and non-blocking refresh; retain runtime interaction checks for rendering, focus, and accessibility.
- More than 50 persisted rows: every page reachable with correct server parameters.
- Filter/realtime/page-boundary behavior.
- EN/VI parity and absence of hardcoded touched strings.
- Route-backed detail modal behavior remains unchanged.

### Required commands

- Study Group controller/service/integration/model tests.
- Full backend suite.
- Client Study Group ESLint.
- Client TypeScript.
- Client production build and locale synchronization.
- Dashboard and dynamic Study Group routes return HTTP 200 when the relevant dev server is running.
- Opt-in normal-load harness only against an approved isolated dataset; record the result in quickstart.

## Delivery Sequencing

1. Add failing behavioral tests for relationship type, role, date boundaries, pagination, and join recovery/latency.
2. Fix request/invitation mutation predicates and student-role authorization.
3. Separate committed join response from lifecycle SMTP latency.
4. Make join modal asynchronous, recoverable, and non-duplicating.
5. Convert discovery and dashboard lists to authoritative server pagination.
6. Correct OpenAPI, timestamps, localization, and event-specific Members display.
7. Run regression, concurrency, route, locale, build, and approved performance verification.

## Complexity Tracking

No constitution violation requires justification. No new schema, storage mechanism, service, or UI subsystem is introduced.
