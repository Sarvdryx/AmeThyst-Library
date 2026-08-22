# Tasks: Navigation, Export, and Authentication Reliability

**Input**: Design documents from `/specs/033-navigation-export-auth-reliability/`

**Prerequisites**: `spec.md`, `plan.md`, `research.md`, `contracts/`, `quickstart.md`

**Tests**: Targeted automated tests are required by Spec 33 and are included below.

**Organization**: Tasks are ordered by repository verification, independently testable user story, automated regression coverage, and final compliance validation.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel because it touches different files and has no incomplete dependency.
- **[Story]**: Maps the task to the authoritative user story in `spec.md`.
- Every task names its FRs, objective, observable result, exact path, and required evidence.

## Phase 1 — Repository Verification and Regression Baseline

**Purpose**: Reconfirm the investigated paths, protect user-owned changes, and establish honest baseline evidence before source edits.

- [x] T001 Verify current source behavior for all three bugs and the `/library` catalog plus `/help` destination in `client/app/components/organisms/HeroSection.tsx`, `client/app/library/page.tsx`, `client/app/components/templates/HomeLayout.tsx`, `client/app/help/page.tsx`, and `client/app/locales/{en,vi}.json`; objective: validate planning assumptions; result: every planned destination/path is evidence-backed; evidence: inspected path list and source references.
- [x] T002 [P] Verify CSV session and authorization architecture in `client/app/dashboard/admin/page.tsx`, `client/app/utils/apiClient.ts`, `server/src/routes/admin.routes.mjs`, `server/src/middlewares/auth.middleware.mjs`, and `server/src/middlewares/role.middleware.mjs`; objective: confirm only the client credential policy is defective; result: protected-cookie authentication and server admin authorization remain the approved path; evidence: route/middleware and request comparison.
- [x] T003 [P] Run the pre-change commands from `specs/033-navigation-export-auth-reliability/quickstart.md`; objective: establish the regression baseline; result: each command is recorded as PASS, FAIL, NOT RUN, or BLOCKED without overstating results; evidence: command output (initial dependency absence may be recorded as BLOCKED).

---

## Phase 2 — User Story 1: Homepage CTA Fixes (Priority: P1)

**Goal**: Make Explore Library reach the existing catalog and How It Works reach the existing Help Center while preserving accessibility and presentation.

**Independent Test**: On `/library`, activate each control by pointer, Enter, and Space; verify catalog focus/scroll for Explore and one `/help` navigation for How It Works.

- [x] T004 [US1] Add the stable focusable catalog target in `client/app/components/templates/HomeLayout.tsx` (FR-001, FR-003, FR-004); objective: expose the existing browsing region to the CTA without a duplicate route; result: the catalog region can receive programmatic focus and same-page scrolling; evidence: focused source contract and client build.
- [x] T005 [US1] Connect both controls in `client/app/components/organisms/HeroSection.tsx` (FR-001, FR-002, FR-003, FR-004); objective: focus/scroll to the catalog and navigate once to `/help`; result: handlers are wired to native Buttons and rapid Help activation is guarded; evidence: source-contract test, targeted lint, and client build. Browser pointer/keyboard evidence remains T023.
- [ ] T006 [US1] Verify unchanged labels, variants, localization, theme classes, and responsive layout in `client/app/components/organisms/HeroSection.tsx` and `client/app/components/templates/HomeLayout.tsx` (FR-005, FR-021); objective: prevent UI regression; result: both locales, themes, and mobile/desktop layouts retain the approved presentation; evidence: lint/build plus quickstart manual observations.

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 3 — User Story 2: Admin CSV Export Authentication Fix (Priority: P1)

**Goal**: Make the existing CSV download participate in the protected-cookie administrator session without changing backend authorization or CSV semantics.

**Independent Test**: Export successfully as an administrator, then verify no-session, non-admin, expired-session, backend-failure, network-failure, and repeated-attempt behavior.

- [x] T007 [US2] Add the established credential policy to the direct export request in `client/app/dashboard/admin/page.tsx` (FR-006, FR-007, FR-010, FR-011); objective: include the valid protected session in cross-origin production; result: the request includes protected cookies while retaining existing blob and error paths; evidence: source-contract test, targeted lint, and client build. Live administrator download evidence remains T024.
- [x] T008 [US2] Verify the unchanged middleware chain in `server/src/routes/admin.routes.mjs`, `server/src/middlewares/auth.middleware.mjs`, and `server/src/middlewares/role.middleware.mjs` (FR-008, FR-009, FR-021); objective: prove authentication/authorization was neither bypassed nor weakened; result: unauthenticated and non-admin requests remain rejected server-side with no client-visible token mechanism; evidence: source-contract assertion and server regression tests.
- [ ] T009 [US2] Exercise repeated and failed download behavior through `client/app/dashboard/admin/page.tsx` using `specs/033-navigation-export-auth-reliability/quickstart.md` (FR-007, FR-010, FR-011); objective: validate independent read-only downloads and explicit errors; result: three successes produce readable files, while failure cases produce none and data is unchanged; evidence: recorded manual acceptance results.

**Checkpoint**: US2 is independently functional and authorization strength is preserved.

---

## Phase 4 — User Story 3: Email Verification and Session Concurrency Fix (Priority: P1)

**Goal**: Ensure verification, bootstrap, refresh, and logout settle in invocation order so no stale state or response-cookie transition wins.

**Independent Test**: Control asynchronous operation orderings and verify successful verification remains authenticated before redirect/reload, failures never falsely authenticate, and logout is not undone.

- [x] T010 [US3] Implement the rejection-safe serialized coordinator in `client/app/utils/authSessionCoordinator.mjs` (FR-014, FR-015); objective: provide one ordering boundary for session-changing operations; result: invoked operations execute sequentially and later work proceeds after rejection; evidence: deterministic coordinator unit tests.
- [x] T011 [US3] Run AuthProvider bootstrap and explicit refresh through the coordinator in `client/app/providers/AuthProvider.tsx` (FR-013–FR-015, FR-017, FR-021); objective: prevent stale `/auth/me` or refresh work from publishing out of order; result: provider bootstrap and explicit refresh are wired to the shared ordering boundary while suspended/error branches remain unchanged; evidence: source-contract test, targeted lint, and client build. Integrated provider behavior remains T025.
- [x] T012 [US3] Run shared protected-request refresh through the coordinator in `client/app/utils/apiClient.ts` (FR-014, FR-015, FR-021); objective: include automatic refresh in the same ordering boundary; result: overlapping refresh cannot settle across a later verification/logout transition; evidence: source-contract and coordinator-ordering tests plus lint/build.
- [x] T013 [US3] Run explicit logout and final user clearing through the coordinator in `client/app/utils/user.ts` (FR-014, FR-015, FR-019, FR-021); objective: ensure older successful auth work cannot restore a logged-out client; result: logout invoked after older work remains the final state and no secret is stored/logged; evidence: refresh-vs-logout unit scenario and source contract.
- [x] T014 [US3] Serialize verification and verified-user publication, then use a page-local token-aware in-flight request ref in `client/app/verify-email/page.tsx` (FR-012–FR-020); objective: preserve one same-token verification across Strict Mode setup-cleanup-setup, start independent work for genuine token changes, and prevent abandoned local updates or redirects; result: the ref stores token plus promise, each effect owns subscription/timer cleanup, publication precedes redirect scheduling, and no standalone lifecycle utility remains; evidence: runtime lifecycle tests, source wiring contract, targeted lint, targeted server verification tests, and client build. Browser delayed-response evidence remains T025.
- [ ] T015 [US3] Verify existing invalid, expired, repeated, network-failed, immediate-reload, refresh-overlap, and fresh-tab behavior using `server/tests/integration/verifyEmail.api.spec.mjs`, `server/tests/controllers/verifyEmail.controller.spec.mjs`, and `specs/033-navigation-export-auth-reliability/quickstart.md` (FR-017–FR-021); objective: preserve recovery/security while fixing the race; result: valid sessions restore and failed verification never falsely authenticates; evidence: targeted server output and recorded manual scenarios.

**Checkpoint**: US3 converges deterministically and logout ordering is protected.

---

## Phase 5 — Automated Tests

**Purpose**: Add dependency-free client regression tests and run the existing server verification/authorization safety net.

- [x] T016 [P] [US1] Add CTA source-contract tests in `client/tests/spec33-source-contracts.test.mjs` (FR-001–FR-005); objective: prevent either control or destination from becoming disconnected again; result: test fails if catalog focusability, button handlers, `/help`, or repeat-navigation guard disappears; evidence: `npm test` PASS in `client/`.
- [x] T017 [P] [US2] Add CSV and server authorization source-contract tests in `client/tests/spec33-source-contracts.test.mjs` (FR-006–FR-011); objective: pin the credential policy and unchanged middleware chain; result: test fails if credentials, verifyToken, or admin authorization is removed; evidence: `npm test` PASS in `client/`.
- [x] T018 [US3] Add deterministic ordering and lifecycle tests in `client/tests/spec33-auth-session-coordinator.test.mjs` and `client/tests/spec33-email-verification.test.mjs` (FR-014, FR-015, FR-020, FR-021); objective: prove queue ordering plus setup-cleanup-setup and token-change ownership; result: strict order, rejection recovery, verify/bootstrap order, refresh/logout final state, single-start replay, stale-subscriber suppression, live success/error delivery, independent token requests, and stale-token isolation pass; evidence: `npm test` PASS in `client/`.
- [x] T019 [US3] Add the supported client test command to `client/package.json` (FR-021); objective: make Spec 33 client checks reproducible without a new dependency; result: `npm test` runs all three Spec 33 Node test files; evidence: manifest diff and successful command output.
- [x] T020 [P] [US3] Run existing verification/session security tests in `server/tests/integration/verifyEmail.api.spec.mjs` and `server/tests/controllers/verifyEmail.controller.spec.mjs` (FR-012, FR-017–FR-019, FR-021); objective: detect backend/session regressions; result: existing session creation, protected cookies, invalid/expired failures, and secret-free responses remain valid; evidence: targeted Vitest output.

---

## Final Phase — Build, Integration, Acceptance, and FR/SC Compliance Audit

**Purpose**: Validate the integrated fixes and only mark requirements complete from actual evidence.

- [x] T021 Run client `npm test`, targeted `npm run lint -- ...`, and `npm run build` from `client/package.json` (FR-001–FR-021); objective: validate client implementation; result: commands are recorded PASS/FAIL/BLOCKED exactly; evidence: terminal output.
- [x] T022 Run targeted and full server `npm run test` plus `node --check src/routes/admin.routes.mjs` from `server/package.json` (FR-008, FR-009, FR-012, FR-018, FR-019, FR-021); objective: validate unchanged server behavior; result: commands are recorded PASS/FAIL/BLOCKED exactly; evidence: terminal output.
- [ ] T023 [P] Execute US1 manual acceptance from `specs/033-navigation-export-auth-reliability/quickstart.md` (FR-001–FR-005, FR-021); objective: verify pointer/keyboard, history, locale, theme, and responsiveness; result: each scenario is PASS/FAIL/NOT VERIFIED; evidence: recorded observations.
- [ ] T024 [P] Execute US2 manual acceptance from `specs/033-navigation-export-auth-reliability/quickstart.md` (FR-006–FR-011, FR-021); objective: verify admin success, unauthenticated/non-admin denial, expiry, backend error, network error, and repetition; result: each scenario is PASS/FAIL/NOT VERIFIED; evidence: downloaded files/server responses and recorded observations.
- [ ] T025 [P] Execute US3 manual acceptance from `specs/033-navigation-export-auth-reliability/quickstart.md` (FR-012–FR-021); objective: verify both bootstrap orderings, refresh overlap, redirect timing, reload, invalid/failed/repeated tokens, unmount, and logout; result: each scenario is PASS/FAIL/NOT VERIFIED; evidence: recorded delayed-response and browser observations.
- [x] T026 Audit changed files and runtime output against `specs/033-navigation-export-auth-reliability/spec.md` and `contracts/` (FR-008, FR-009, FR-019, FR-021); objective: detect secret exposure, weakened authorization, database work, or unrelated changes; result: zero forbidden or out-of-scope change; evidence: git diff and secret/scope search.
- [x] T027 Produce the final FR-001–FR-021, SC-001–SC-009, and edge-case status audit in `specs/033-navigation-export-auth-reliability/tasks.md`; objective: close traceability from evidence; result: every requirement, criterion, and major edge-case group has an evidence-calibrated status and only evidenced tasks are marked complete; evidence: compliance tables and final task checkboxes.

## Dependencies and Execution Order

```text
Phase 1 baseline
├── Phase 2 US1 ─┐
├── Phase 3 US2 ─┼── Phase 5 automated tests ── Final validation/audit
└── Phase 4 US3 ─┘
```

- US1 and US2 are independent after Phase 1.
- US3 depends only on Phase 1 but its edits to shared auth utilities must be sequential in T010 → T011/T012/T013 → T014.
- T016 and T017 share one file and therefore execute sequentially despite serving independent stories.
- T020 can run in parallel with client-only test work after source edits.
- Final task status depends on actual automated and manual evidence; unavailable browser/database environments remain `NOT VERIFIED`, never implied PASS.

## Parallel Opportunities

- T001, T002, and baseline command execution can be investigated independently.
- US1 component edits and US2 export edit touch different modules and can proceed independently.
- Server regression tests can run while client source-contract and coordinator tests run.
- Final manual US1, US2, and US3 checks are independent when suitable test sessions are available.

## Implementation Strategy

1. Complete repository verification and preserve the baseline result, including dependency-related blocks.
2. Implement and independently validate US1 and US2 as the smallest production fixes.
3. Implement US3 from the pure coordinator outward so ordering tests lead integration changes.
4. Add reproducible client checks and run targeted server regressions.
5. Run builds/full suites, manual acceptance where the environment permits, then complete the FR/SC audit.

**MVP Scope**: All three P1 stories are production bug fixes and are required for Spec 33 completion; no single story substitutes for the others.

## Validation Evidence — 2026-08-21

| Validation | Status | Evidence |
|------------|--------|----------|
| Pre-change client build | BLOCKED | `next` was unavailable before dependency installation. |
| Pre-change targeted server tests | BLOCKED | `vitest` was unavailable before dependency installation. |
| Dependency installation | PASS | `npm ci` completed from both lockfiles; 0 reported vulnerabilities and no lockfile diff. |
| Client Spec 33 tests | PASS | `npm test`: 12 tests passed, 0 failed, including same-token replay, stale/live subscription, rejection, and token-change runtime coverage. |
| Targeted client lint | PASS | ESLint completed with 0 errors and 0 warnings across affected TS/TSX/MJS modules; the two temporary admin hook suppressions were removed and the data loader now has stable dependencies with deferred effect invocation. |
| Client production build | PASS | Next.js compiled, TypeScript completed, and 32 pages generated including `/library`, `/help`, `/dashboard/admin`, and `/verify-email`. |
| Targeted server verification tests | PASS | 2 files and 4 tests passed. |
| Admin route syntax | PASS | `node --check src/routes/admin.routes.mjs` exited 0. |
| Full server suite | FAIL | 19 files/159 tests passed; 5 files/10 tests failed in pre-existing `BUG-AUTH-*` baseline assertions and unrelated PIN-return expectations. No server runtime file changed in Spec 33. |
| Scope/security audit | PASS | No backend runtime, database, or lockfile change; no new client token storage pattern; admin route still applies `verifyToken` then `authorizeRole('admin')`. |
| Browser/database manual acceptance | NOT VERIFIED | No configured browser session, database-backed test accounts, delayed-response proxy, or runtime admin/non-admin fixtures were available in this execution environment. |

## Functional Requirement Audit

| Requirement | Status | Evidence |
|-------------|--------|----------|
| FR-001 | PASS | Catalog target and Explore handler are covered by source contract, lint, and build. |
| FR-002 | PASS | Help handler targets the verified existing `/help` route and is covered by source contract/build. |
| FR-003 | PASS | Both controls remain native Buttons; handler contracts and build pass. |
| FR-004 | PASS | Catalog action is idempotent and Help route pushes are guarded; source contract passes. |
| FR-005 | PARTIAL | Labels/classes/locales are unchanged and locale sync/build pass; visual theme/responsive acceptance is not browser-verified. |
| FR-006 | PASS | Export fetch now uses the same `credentials: 'include'` policy as protected API calls. |
| FR-007 | PARTIAL | Existing filter/blob/download code compiles and is source-verified; a real authenticated file download is not browser-verified. |
| FR-008 | PASS | Server route still applies authentication and administrator authorization; contract and syntax checks pass. |
| FR-009 | PASS | Scope audit finds no token URL/header/client-storage alternative or middleware bypass. |
| FR-010 | PARTIAL | Existing non-OK/network feedback paths are unchanged and build; live failure cases are not manually verified. |
| FR-011 | PASS | Existing GET export and per-click object URL lifecycle remain independent/read-only; no server mutation changed. |
| FR-012 | PASS | Existing server verification/session tests pass and verification publication is serialized. |
| FR-013 | PARTIAL | Source wiring publishes the verified user inside the queued transition and targeted server session tests pass; a browser integration has not observed the final provider state. |
| FR-014 | PARTIAL | Runtime tests prove coordinator invocation ordering, but a real browser overlap with response-cookie transitions has not been executed. |
| FR-015 | PARTIAL | Source wiring and runtime coordinator tests cover the selected mechanism; integrated bootstrap/refresh/verification/logout behavior remains browser-unverified. |
| FR-016 | PARTIAL | Source order and lifecycle runtime tests show live result delivery before redirect scheduling; authenticated route rendering is not browser-verified. |
| FR-017 | PARTIAL | Provider restoration path builds and targeted session tests pass; immediate browser reload is not manually verified. |
| FR-018 | PASS | Failed verification publishes no user; missing/expired controller/integration regressions pass. |
| FR-019 | PASS | Scope audit finds no newly stored/logged auth or verification secret. |
| FR-020 | PASS | Runtime lifecycle tests exercise setup-cleanup-setup resolution/rejection, inactive-subscriber suppression, one request per same token, independent changed-token work, and stale-token isolation; source contract confirms the page-local ref and cleanup wiring. |
| FR-021 | PARTIAL | Client tests/lint/build and targeted auth tests pass; full server suite has unrelated baseline failures and UI regressions are not manually verified. |

## Success Criterion Audit

| Criterion | Status | Evidence |
|-----------|--------|----------|
| SC-001 | NOT VERIFIED | Native interaction wiring is automated, but pointer/keyboard browser acceptance was unavailable. |
| SC-002 | NOT VERIFIED | Repeat-navigation guard is source-tested, but browser history was not manually observed. |
| SC-003 | NOT VERIFIED | Real authenticated repeated CSV downloads require a running browser/API/database fixture. |
| SC-004 | NOT VERIFIED | Middleware is preserved, but live unauthenticated/non-admin/expired-session downloads were not executed. |
| SC-005 | NOT VERIFIED | Failure branches remain present, but live backend/network interruption was not executed. |
| SC-006 | NOT VERIFIED | Runtime tests cover operation ordering and effect replay, but end-to-end authenticated Library access and browser cookie behavior were not executed. |
| SC-007 | NOT VERIFIED | Verification failures are regression-tested; immediate post-verification browser refresh was unavailable. |
| SC-008 | FAIL | Targeted auth checks pass, but the full server regression suite finishes with 10 pre-existing/unrelated failures. |
| SC-009 | FAIL | Client build/tests pass and scope is clean, but the required full server suite is not successful. |

## Edge Case Audit

| Edge-case group | Status | Evidence |
|-----------------|--------|----------|
| Rapid CTA activation and browser history | PARTIAL | Idempotent catalog action and Help push guard are source-tested; browser history is not manually observed. |
| Repeated/filtered CSV export and failure interruption | NOT VERIFIED | Request credential/blob/error paths build, but live repeated downloads and interruptions require browser/API/database fixtures. |
| Verification setup-cleanup-setup and token change | HANDLED | Runtime lifecycle tests prove one same-token start, live resolution/error delivery, abandoned-observer suppression, independent changed-token work, and no token-A result delivery to token B. |
| Verification page navigation away | PARTIAL | Runtime unsubscribe behavior and source timer cleanup pass; an actual React page unmount with pending fetch is not browser-tested. |
| Bootstrap/refresh before or after verification | PARTIAL | Coordinator orderings pass at runtime; real response-cookie timing remains browser-unverified. |
| Immediate reload after verification | NOT VERIFIED | Existing restoration path builds, but no browser session fixture was available. |
| Missing/invalid/expired/consumed verification | PARTIAL | Targeted server verification tests pass for covered failure paths; all live UI variants were not executed. |
| Logout while refresh is pending | PARTIAL | Deterministic coordinator final-state tests pass; integrated browser/server behavior was not executed. |
| Unrelated authenticated user opens verification link | NOT VERIFIED | Requires a configured browser and server-session fixture. |

Spec 33 remains **Implemented — Validation Incomplete**. Tasks T006, T009, T015, and T023–T025 remain open until the browser/database acceptance matrix is executed; SC-008 and SC-009 also require the repository’s unrelated full-suite baseline failures to be resolved or formally waived outside this spec.
