# Implementation Plan: Navigation, Export, and Authentication Reliability

**Branch**: `[033-navigation-export-auth-reliability]` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/033-navigation-export-auth-reliability/spec.md`

## Summary

Fix three independent production defects with narrowly scoped client changes: connect the Library hero calls to action to the catalog already rendered on the page and the existing Help Center; make the administrator CSV request opt into the protected-cookie session used by shared API calls; and serialize session-changing client operations so bootstrap, refresh, verification, and logout cannot complete out of order or apply late cookie/state transitions. Preserve the current backend CSV endpoint, authorization middleware, verification-token lifecycle, role redirects, UI copy, styling, and data model.

## Technical Context

**Language/Version**: TypeScript/JavaScript on Node.js 20-compatible tooling; React 19.2.4; Next.js 16.2.12; server ES modules

**Primary Dependencies**: Next.js App Router, React Context, browser Fetch API, Express 5.2.1, protected cookies, Vitest 4.1.9, Node.js built-in test runner

**Storage**: Existing PostgreSQL session/user storage is unchanged; no schema or migration work

**Testing**: Client source-contract and concurrency tests through `node --test`; client ESLint and production build; existing server Vitest authentication and authorization suites

**Target Platform**: Responsive web client with a separate Express API, including cross-origin production deployment

**Project Type**: Web application (`client/` and `server/`)

**Performance Goals**: CTA actions respond within normal browser interaction timing; export adds no extra request; authentication transitions remain bounded by the existing request sequence and do not busy-wait

**Constraints**: Preserve httpOnly cookie secrecy, CSRF behavior, server-side admin authorization, localization, theme, responsive layout, and existing CSV contents; do not add dependencies or database changes

**Scale/Scope**: Three confirmed defects, five production client modules plus focused tests and specification artifacts; backend runtime behavior remains unchanged

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design.*

| Principle | Gate Result | Evidence |
|-----------|-------------|----------|
| I. Component-Driven & Reusability | PASS | Reuse the existing Button, HeroSection, HomeLayout, and Help Center rather than adding duplicate UI. |
| II. State Management & Data Fetching | PASS | Keep AuthProvider as global session state and preserve explicit success/failure handling and environment-derived API URL. |
| III. Responsive & Beautiful Design | PASS | CTA styling/layout is unchanged; only behavior and an accessible catalog target are added. |
| IV. Performance Optimization | PASS | No new images, pages, or heavy dependencies; session coordination uses promises rather than polling. |
| V. Error Handling & Accessibility | PASS | Native buttons retain keyboard semantics, catalog focus is managed, and export/verification errors remain explicit. |
| VI. Directory Structure & Workspace Alignment | PASS | Every affected path was verified in the current repository before planning. |
| VII. Modular Backend Architecture | PASS | No backend runtime change is needed; existing route → middleware → controller → service structure remains intact. |
| VIII. Import Path Verification | PASS | All planned imports resolve within `client/app/utils` and existing component/provider paths. |
| IX. Theme & Localization | PASS | Existing translation keys and theme classes remain unchanged; no new user-facing text is introduced. |

**Post-design re-check**: PASS. No constitution exception or complexity waiver is required.

## Repository Findings and Implementation Design

### US1 — Homepage CTA Flow

1. **Current behavior**: `client/app/components/organisms/HeroSection.tsx` renders two native Button controls without behavior. HeroSection is mounted by `client/app/library/page.tsx`; the SearchBar and PopularPublishes catalog content follow it through `client/app/components/templates/HomeLayout.tsx`.
2. **Root cause**: Neither Button receives navigation or activation behavior.
3. **Verified destinations**: The existing browsing destination is the catalog/search content below the hero on `/library`. The existing localized `/help` page explains getting started, searching, borrowing, returning, study groups, rooms, and account use, so it is the evidence-backed “How It Works” destination.
4. **Smallest safe change**: Give the catalog region a stable focusable identifier. On “Explore Library”, focus and scroll to that region. On “How It Works”, navigate with the existing App Router. Keep both native Button controls, labels, variants, and responsive classes.
5. **Affected modules**: `HeroSection.tsx`, `HomeLayout.tsx`, and focused client source-contract tests.
6. **Compatibility/error behavior**: If the catalog target is unexpectedly absent, activation is a safe no-op rather than throwing. Help navigation uses the existing route and browser history behavior.
7. **Concurrency behavior**: Repeated catalog activation is idempotent. A navigation-in-progress guard prevents rapid repeated Help activations from scheduling duplicate route pushes.
8. **Security impact**: None.
9. **Automated strategy**: Assert both controls remain native Buttons, are connected to the catalog and `/help`, and the catalog target is focusable.
10. **Manual strategy**: Exercise pointer, Enter, and Space at desktop/mobile widths and in both themes/locales; verify focus/scroll and back navigation.

### US2 — Admin CSV Export Flow

1. **Current behavior**: `client/app/dashboard/admin/page.tsx` builds the existing export URL, obtains the existing CSRF/auth headers, fetches a blob, and creates a temporary download link. Unlike `apiFetch`, its direct fetch does not opt into cross-origin credentials.
2. **Root cause**: In production the API can be on a different origin, and Fetch omits protected cookies unless `credentials: 'include'` is set. The server therefore receives no `amethyst_access` cookie and the existing `verifyToken` middleware returns 401.
3. **Established mechanism**: `client/app/utils/apiClient.ts` sends `credentials: 'include'`; the server enables credentialed CORS and `server/src/middlewares/auth.middleware.mjs` reads the protected access cookie. `server/src/routes/admin.routes.mjs` applies `verifyToken` and `authorizeRole('admin')` before `exportUsers`.
4. **Smallest safe change**: Add `credentials: 'include'` to the existing direct CSV fetch. Retain headers, filters, response checks, blob/download lifecycle, and messages.
5. **Affected modules**: `client/app/dashboard/admin/page.tsx` and a focused source-contract test. Server production files remain unchanged.
6. **Compatibility/error behavior**: Same-origin development remains valid. Existing non-OK and thrown-network feedback remains unchanged.
7. **Concurrency behavior**: Each click creates an independent GET/blob download and revokes only its own object URL; the endpoint remains read-only.
8. **Security impact**: Improves consistency without exposing cookie contents. Server authentication and admin authorization remain authoritative.
9. **Automated strategy**: Assert the direct export fetch opts into credentials and the server route still applies both authentication and administrator authorization.
10. **Manual strategy**: Test valid admin three times, no session, non-admin, expired session, forced 500, and network interruption.

### US3 — Email Verification and Session Concurrency

1. **Current behavior**: Root `AuthProvider` starts `/auth/me`, optional refresh, and another `/auth/me` on mount. `verify-email/page.tsx` concurrently verifies, receives protected session cookies, updates a module-local user, and schedules navigation. Shared API refresh and logout can also mutate cookies/state independently.
2. **Root cause**: Authentication transitions have no ordering boundary. A bootstrap or refresh started first can settle after verification and clear/set client state. More critically, an older refresh response can carry late `Set-Cookie` headers that clear or replace the newly established cookies, so a React-only stale-state guard is insufficient.
3. **Selected mechanism**: Add a small promise-based session-operation coordinator in `client/app/utils/authSessionCoordinator.mjs`. Serialize AuthProvider bootstrap/refresh, shared API refresh, the complete verification transition (request plus authoritative user publication), and logout. Operations execute in invocation order and the queue continues after a rejected operation.
4. **Verification completion**: Publish the verified session user inside the serialized verification operation. Keep a page-local token-aware in-flight request ref that shares one same-token promise across React development setup-cleanup-setup while each effect owns its subscription and redirect timer. A genuine token change replaces the ref with a new token/promise pair. Only the live subscription may render success or schedule the role-based redirect.
5. **Logout safety**: Execute logout and final client clearing through the same coordinator. If an older refresh was invoked first, logout runs last; if logout was invoked first, a later refresh observes the logged-out server session and cannot restore it.
6. **Affected modules**: new shared `authSessionCoordinator.mjs`; `AuthProvider.tsx`; `apiClient.ts`; `user.ts`; page-local lifecycle logic in `verify-email/page.tsx`; focused coordinator, email-verification, and source-contract tests.
7. **Compatibility/error behavior**: Preserve current suspended-account handling, CSRF retry, network events, token failure mapping, success delay, role redirects, and login behavior. Failed verification does not publish a user. The coordinator never stores or logs credentials.
8. **Concurrency behavior**: Bootstrap-first and verification-first orderings both converge correctly; refresh overlap is serialized; rejected work cannot poison the queue; logout remains final when invoked after older work; same-token setup-cleanup-setup retains one request and one live result observer; token changes start independent work; an actually unmounted verification page cannot update local UI or redirect.
9. **Security impact**: Protected cookies remain httpOnly and server session responses remain authoritative. No token becomes readable or enters URLs/logs.
10. **Automated strategy**: Runtime-test strict operation ordering, queue recovery, verification-vs-bootstrap ordering, refresh-vs-logout final state, and verification setup-cleanup-setup with both resolution and rejection. Source contracts only assert wiring and publication/redirect order; they are not treated as lifecycle or browser evidence.
11. **Manual strategy**: Use delayed responses to exercise both completion orders, refresh overlap, immediate reload, invalid/expired/repeated token, navigation away, and logout during refresh.

## Project Structure

## Functional Requirement Coverage

| Functional Requirements | Plan Coverage | Verification Coverage |
|-------------------------|---------------|-----------------------|
| FR-001–FR-005 | US1 destination, activation, focus, repeat-navigation, and compatibility design | CTA source contracts, client test, and US1 manual acceptance |
| FR-006–FR-011 | US2 credential policy, unchanged server middleware, blob/error, repeat/read-only design | Export source contract, server regression tests, and US2 manual acceptance |
| FR-012–FR-020 | US3 shared coordinator, verification lifecycle ownership, publication, refresh/logout ordering, failure, unmount, and secret-handling design | Coordinator/lifecycle runtime tests, source contracts, server verification tests, and US3 manual acceptance |
| FR-021 | Per-story compatibility sections plus final build/test/scope audit | Client lint/build, client/server tests, manual locale/theme/responsive and auth regression checks |

SC-001–SC-002 are evaluated by US1 automated/manual checks; SC-003–SC-005 by US2 checks; SC-006–SC-007 by US3 runtime, browser, and verification checks; SC-008–SC-009 by the final regression, build, security, and scope audit. Criteria remain unverified or failed whenever their required evidence is unavailable or unsuccessful.

### Documentation (this feature)

```text
specs/033-navigation-export-auth-reliability/
├── plan.md
├── research.md
├── quickstart.md
├── contracts/
│   ├── admin-csv-export.md
│   ├── email-verification-session.md
│   └── homepage-cta.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

`data-model.md` is intentionally omitted because repository investigation confirms no entity, persistence, or database-schema change.

### Source Code (repository root)

```text
client/
├── app/
│   ├── components/organisms/HeroSection.tsx
│   ├── components/templates/HomeLayout.tsx
│   ├── dashboard/admin/page.tsx
│   ├── providers/AuthProvider.tsx
│   ├── utils/apiClient.ts
│   ├── utils/authSessionCoordinator.mjs
│   ├── utils/user.ts
│   └── verify-email/page.tsx
├── tests/spec33-auth-session-coordinator.test.mjs
├── tests/spec33-email-verification.test.mjs
├── tests/spec33-source-contracts.test.mjs
└── package.json

server/
├── src/routes/admin.routes.mjs                 # verified, unchanged
├── src/middlewares/auth.middleware.mjs         # verified, unchanged
├── src/middlewares/role.middleware.mjs         # verified, unchanged
└── tests/                                      # existing regression suites
```

**Structure Decision**: Retain the current client/server web application layout. Add one shared coordinator utility, keep verification lifecycle ownership page-local, and provide three dependency-free client test files; make no server runtime or database changes.

## Validation Commands

Commands are taken from the checked-in package manifests or use Node.js built-ins:

```powershell
cd client
npm test
npm run lint -- app/components/organisms/HeroSection.tsx app/components/templates/HomeLayout.tsx app/dashboard/admin/page.tsx app/providers/AuthProvider.tsx app/utils/apiClient.ts app/utils/authSessionCoordinator.mjs app/utils/user.ts app/verify-email/page.tsx
npm run build

cd ..\server
npm run test -- tests/integration/verifyEmail.api.spec.mjs tests/controllers/verifyEmail.controller.spec.mjs
npm run test
node --check src/routes/admin.routes.mjs
```

## Complexity Tracking

No constitution violations or unjustified complexity are introduced.
