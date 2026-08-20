# Feature Specification: Reduce Register Flow Test Count

**Feature Branch**: `022-register-test-coverage`
**Created**: 2026-08-14
**Status**: 12 files, 27 executed tests. Latest recorded execution: 23 passed / 4 failed.
**Input**: Reduce `test_auth_register` to the existing 12 files with 2–3 executed tests each (exactly 27 total).

Production authentication behavior must not be changed solely to satisfy stale tests.

---

## 1. Feature Overview

Feature 022 owns the Vitest project `test_auth_register`, which covers account creation:

- Email/password registration (`POST /auth/register`)
- Email verification (`POST /auth/verify-email`)
- Resend verification (`POST /auth/resend-verification`)
- Google OAuth strategy and callback (`GET /auth/google`, `GET /auth/google/callback`)

Before this reduction, the baseline suite contained exactly 12 test files and 86 executed `it()` cases. After implementation, the same 12 files contain 27 executed tests. Many baseline cases repeated the same scenario (hashing, role, mailer, duplicate email) at every layer, and several still expected obsolete 409 / JWT-in-body / query-string-token contracts.

This feature **reduces** that suite in place. It is not a file-splitting exercise.

---

## 2. Problem Statement

1. Eighty-six tests make the suite slow to read and expensive to maintain.
2. Related assertions (success path, hashing, role, mailer) are split into separate `it()` blocks.
3. The same business branch is retested at service, controller, and API layers.
4. Several expectations contradict verified production behavior (anti-enumeration, cookie sessions).
5. Previous SpecKit documents described splitting into ~27 files. That direction is rejected. The 12 filenames stay.

---

## 3. Primary Goal

Reduce the total number of executed test cases in `test_auth_register`.

- Keep the existing **12** files.
- Each file: **2–3** actual `it()`/`test()` cases.
- Project total: **exactly 27** executed tests.
- Merge related assertions into stronger scenarios.
- Remove low-value and cross-layer duplicates.
- Align passing tests with verified production contracts.
- Express expiration-boundary and delivery-consistency requirements as ordinary functional tests (`FR-EXP-01`, `FR-CON-01`, `FR-EXP-02`, `FR-CON-02`).
- Do not change production source as part of this feature.
- Do not create behavior-suffixed replacement files.
- Do not use `it.each()` / `test.each()` to hide multiple executed cases.

---

## 4. Baseline Inventory Before Reduction

Inventory date: 2026-08-14. The baseline inventory was recorded before the reduction changes were applied. Helpers from any prior split attempt are **not** present. `vitest.config.mjs` already lists these 12 paths explicitly.

| # | Path | Actual tests |
| --- | --- | ---: |
| 1 | `src/server/tests/config/googleAuth.strategy.spec.mjs` | 7 |
| 2 | `src/server/tests/services/register.service.spec.mjs` | 13 |
| 3 | `src/server/tests/services/verifyEmail.service.spec.mjs` | 8 |
| 4 | `src/server/tests/services/resendVerification.service.spec.mjs` | 6 |
| 5 | `src/server/tests/controllers/register.controller.spec.mjs` | 13 |
| 6 | `src/server/tests/controllers/verifyEmail.controller.spec.mjs` | 6 |
| 7 | `src/server/tests/controllers/resendVerification.controller.spec.mjs` | 4 |
| 8 | `src/server/tests/controllers/googleAuth.controller.spec.mjs` | 2 |
| 9 | `src/server/tests/integration/register.api.spec.mjs` | 13 |
| 10 | `src/server/tests/integration/verifyEmail.api.spec.mjs` | 6 |
| 11 | `src/server/tests/integration/resendVerification.api.spec.mjs` | 5 |
| 12 | `src/server/tests/integration/googleAuth.api.spec.mjs` | 3 |
| | **Total** | **86** |

Google controller (2) and Google API (3) already fit the budget; their **contracts** are stale and must be corrected without adding files.

---

## 5. Baseline Test Count Per File

See §4. Count is `it()`/`test()` only. Nested `describe()` blocks are not tests.

Register service/controller/API each have 13 cases because Test 8 and Test 9 were previously split into many `it()`s. That expansion is reversed by this feature.

---

## 6. Verified Production Behavior Matrices

Source: `auth.services.mjs`, `auth.controllers.mjs`, `auth.routes.mjs`, `passport.mjs`, `security.middleware.mjs`, `auth-validation.middleware.mjs`, `authHelpers.mjs`.

`REGISTER_GENERIC` = `'If this email can be registered, a verification message will be sent.'`

`RESEND_GENERIC` = `'If a pending registration exists, a verification message will be sent.'`

Expiration uses `new Date() > new Date(expired_at)`. **Equality is not expired.**

Mailer runs **after** `withTransaction` COMMIT for register and resend.

### Registration

| Condition | Service | HTTP |
| --- | --- | --- |
| New email | generic return; hash; pending write; then mail | 201 generic |
| Existing user | generic return; **no** pending lookup, hash, or mail | 201 generic |
| Active pending / `expired_at === now` | generic return; **no** delete/hash/mail | 201 generic |
| Expired pending | `deletePendingByEmail`, then success path | 201 generic |
| Thrown infrastructure | throw | 500 `{ error }` |
| Invalid body | n/a | 400 `VALIDATION_ERROR` (middleware) |
| 6th register / 60 min same IP | n/a | 429 `RATE_LIMITED` (`registerLimiter` limit 5) |

### Email verification

| Condition | Service | HTTP |
| --- | --- | --- |
| Valid token | `{ user, userRow }`; no `signToken` | `createAuthSession` + cookies; 200 `{ user }` |
| Missing body token | not called | 400 `'Verification token is required'` |
| Unknown token | throw invalid/expired link | 400 |
| Expired (`>`) | delete pending; throw expired | 410 |
| `expired_at === now` | success | 200 |
| Duplicate email | delete pending; throw `'Email already exists.'` | 400 |
| Transaction fail | throw | 500 |

### Resend verification

| Condition | Service | HTTP |
| --- | --- | --- |
| Pending exists | replace token/TTL; reuse hash; then mail; generic | 200 generic |
| No pending | **return** generic; no replace/mail | 200 generic |
| Missing/invalid email at API | n/a | 400 `VALIDATION_ERROR` |
| Missing email at controller | n/a | 400 `'Email is required'` |
| Thrown infra | throw | **200 generic** (controller catch) |
| `recoveryLimiter` | n/a | 429 after 3 POSTs / 15 min |

### Google OAuth

| Condition | Strategy | HTTP |
| --- | --- | --- |
| First-time | INSERT `GOOGLE_AUTH`, role `user`, avatar or `null` | 302 `${CLIENT_URL}/auth/callback` after cookies; **no query token** |
| Returning `GOOGLE_AUTH`, not suspended | `done(null, user)`; no INSERT | same success redirect |
| Password account | `done(null, false, { message: 'account_exists_with_password' })` | 302 `/login` |
| Suspended | `done(null, false, { message: 'USER_SUSPENDED' })` | 302 `/login` |
| Query/insert throw | `done(err, null)` | 302 `/login` |
| Transactions | **none** (direct pool) | n/a |

Stale tests that expect 409, `'No pending registration found…'`, JWT in JSON, or `?token=` are **wrong**. Production is the contract.

---

## 7. Prioritized User Stories

### US1 — Reduce executed tests (P1)

Maintainers run **27** tests instead of 86, with 2–3 cases per file.

**Independent test**: Mechanical `it(` count per file and project total.

### US2 — Correct stale contracts (P1)

Passing tests for register/resend anti-enumeration and cookie-session Google/verify HTTP match production. Four specification requirements currently Fail.

**Independent test**: Passing tests in the 12 files succeed without production edits; `TC-SRV-REG-002`, `TC-SRV-REG-003`, `TC-SRV-VE-002`, and `TC-SRV-RV-003` Fail.

### US3 — Keep essential confidence (P1)

Each flow still has a success path, the highest-risk security/anti-enum/lifecycle case, and one representative failure.

**Independent test**: Tag filters `@A_R1`–`@A_R10` each match ≥1 retained test.

---

## 8. Functional Requirements

- **FR-001**. Keep exactly the 12 files listed in §9. Do not add behavior-suffixed files.
- **FR-002**. Each file contains 2–3 executed `it()`/`test()` cases. Total exactly **27**.
- **FR-003**. Do not use `it.each` / `test.each`. Sequential asserts inside one `it()` are consolidation.
- **FR-004**. Merge related success-path assertions (lookup, hash, role, mailer, generic message) into one service success test.
- **FR-005**. Do not repeat service internals in controller tests. Controllers mock the service (or session helpers) and assert HTTP mapping.
- **FR-006**. Integration tests cover route wiring, validation where it is the HTTP contract, one main success, and one representative anti-enum or failure. They do not replay every service branch.
- **FR-007**. Align passing tests with verified production (generic 201/200, session cookies, no query JWT).
- **FR-008**. Do not change production auth, package.json, package-lock.json, or unrelated Vitest projects.
- **FR-009**. Avoid changing `vitest.config.mjs` if the explicit 12-file include already discovers all files.
- **FR-010**. Do not create shared helpers by default. Maximum 2 new helpers, only if used by ≥3 files and they contain no assertions.
- **FR-011**. Mock a limiter only if a real run shows false 429s. Override only that limiter via `importOriginal`.
- **FR-012**. Every retained test has a unique ID. IDs may be renumbered per file. Merges and removals are documented.
- **FR-013**. Every tag `@A_R1`–`@A_R10` remains represented by at least one retained test (including Fail-status tests). Cohesive tests may carry multiple tags.
- **FR-014**. Structural completion is 12 files and 27 executed tests. Pass/Fail counts are observed execution results, not a design target.
- **FR-015**. `FR-EXP-01`, `FR-CON-01`, `FR-EXP-02`, and `FR-CON-02` are ordinary functional tests. Do not skip, todo, or `test.fails` them.
- **FR-016**. This feature’s scope is test design and execution only. Do not modify production source.

- **FR-EXP-01**. When `expired_at === currentTime`, a pending registration has reached the end of its TTL and must be treated as expired (delete, hash, replace, mail, generic response).
- **FR-CON-01**. If the initial verification email cannot be delivered, the system must not leave a committed pending registration containing a token the user never received (rollback, compensating delete/invalidate, or delayed commit).
- **FR-EXP-02**. When `expired_at === currentTime`, a verification token has zero remaining lifetime and must be rejected (expired-link error, pending not promoted).
- **FR-CON-02**. A resend must not make the previous verification token unusable until the replacement email has been delivered (rollback, restore previous token/TTL, compensating update, or delayed commit).

---

## 9. Fixed 12-File Structural Requirement

Required final files (no others in `test_auth_register`):

1. `src/server/tests/config/googleAuth.strategy.spec.mjs`
2. `src/server/tests/services/register.service.spec.mjs`
3. `src/server/tests/services/verifyEmail.service.spec.mjs`
4. `src/server/tests/services/resendVerification.service.spec.mjs`
5. `src/server/tests/controllers/register.controller.spec.mjs`
6. `src/server/tests/controllers/verifyEmail.controller.spec.mjs`
7. `src/server/tests/controllers/resendVerification.controller.spec.mjs`
8. `src/server/tests/controllers/googleAuth.controller.spec.mjs`
9. `src/server/tests/integration/register.api.spec.mjs`
10. `src/server/tests/integration/verifyEmail.api.spec.mjs`
11. `src/server/tests/integration/resendVerification.api.spec.mjs`
12. `src/server/tests/integration/googleAuth.api.spec.mjs`

Forbidden: `*.success.spec.mjs`, `*.anti-enumeration.spec.mjs`, `*.failures.spec.mjs`, or any fragmented replacement.

---

## 10. Two-to-Three-Test Budget Per File

| File | Target |
| --- | ---: |
| `googleAuth.strategy.spec.mjs` | 2 |
| `register.service.spec.mjs` | 3 |
| `verifyEmail.service.spec.mjs` | 3 |
| `resendVerification.service.spec.mjs` | 3 |
| `register.controller.spec.mjs` | 2 |
| `verifyEmail.controller.spec.mjs` | 2 |
| `resendVerification.controller.spec.mjs` | 2 |
| `googleAuth.controller.spec.mjs` | 2 |
| `register.api.spec.mjs` | 2 |
| `verifyEmail.api.spec.mjs` | 2 |
| `resendVerification.api.spec.mjs` | 2 |
| `googleAuth.api.spec.mjs` | 2 |
| **Total** | **27** |

No file may exceed 3 executed tests. No file may have fewer than 2 tests.

---

## 11. Total Target of 27 Tests

The structural target is exactly 12 files and 27 executed tests, with 2–3 tests per file.

The latest recorded execution produced 23 passed and 4 failed tests. The four failing tests represent currently unmet functional requirements and must not be removed or weakened merely to obtain a green run.

---

## 12. Layer Responsibilities

**Service**: business rules, security invariants, pending/token lifecycle, transaction vs mailer ordering. No HTTP statuses.

**Controller**: body extraction, service delegation, status and body mapping. No hashing, SQL, or mailer assertions.

**Integration**: router + validation + HTTP contract with mocked DB/mail/OAuth. One representative failure or lifecycle case. Not every service branch.

**Google strategy**: first-time provisioning and returning vs password-collision.

---

## 13. Test Consolidation and Deletion Rules

Merge into the success test: separate hashing, default-role, mailer-call, and safe-shape tests.

Keep one representative infrastructure/transaction failure per flow, not one per mocked dependency.

Do not repeat expiration-boundary tests at controller and API if the service already owns `expired_at === now`.

Do not keep duplicate-email tests at every layer: service owns side effects; controller/API own HTTP mapping of the generic or error body.

Remove tests that only document low-value details (Google “no transaction wrapper” as its own case).

A removed test is not “preserved” unless its meaningful assertions live in a retained test.

---

## 14. Tag Traceability Requirements

Tags `@A_R1`–`@A_R10` stay declared on the project. Each must map to ≥1 retained test ID. A retained test may carry several tags. Do not keep extra tests only to repeat a tag at every layer.

---

## 15. Test-ID Migration Requirements

One-to-one preservation of all 86 IDs is **not** required. Each retained `it()` has one unique ID. IDs may be sequential inside each file (`…-001` … `…-003`). Document retained, merged (old IDs absorbed), and removed IDs with reasons.

---

## 16. Test Isolation Requirements

`vi.clearAllMocks()` in `beforeEach`. Fake timers restored in `finally`. No real DB, SMTP, or Google network. Controller tests must not depend on unmocked `createAuthSession` hitting PostgreSQL. Limiters stay real unless a run proves false 429s.

---

## 17. In Scope and Out of Scope

**In scope**: maintain the three test-suite-reduction documents inside `src/specs/022-register-test-coverage` while preserving the existing `spec.md`, `plan.md`, and `tasks.md`; reduce the 12 files in place; contract corrections; tag/ID documentation; verification.

**Out of scope**: new test files; production auth changes; package.json / lockfile changes; Vitest project edits unless discovery breaks; unrelated tests; more than 2 helpers; `it.each`; weakening production rate limits. Do not modify or replace the existing `spec.md`, `plan.md`, or `tasks.md`.

---

## 18. Proposed Retained Scenarios Per File

### `googleAuth.strategy.spec.mjs` (2, pass)

1. First-time provisioning: INSERT `GOOGLE_AUTH` / role `user`; avatar from photo and null fallback.
2. Returning `GOOGLE_AUTH` user plus password-account collision.

Removed: pool `done(err)`; no-transaction; suspended-user.

### `register.service.spec.mjs` (3: 1 pass, 2 fail)

1. **Pass** `TC-SRV-REG-001`: successful registration with hash, safe persistence, mailer, generic response.
2. **Fail** `TC-SRV-REG-002` (`FR-EXP-01`): `expired_at === now` treated as expired.
3. **Fail** `TC-SRV-REG-003` (`FR-CON-01`): mail failure must not leave committed pending data.

Anti-enumeration remains at controller/API.

### `verifyEmail.service.spec.mjs` (3: 2 pass, 1 fail)

1. **Pass** `TC-SRV-VE-001`: promote, cleanup, safe `{ user, userRow }`.
2. **Fail** `TC-SRV-VE-002` (`FR-EXP-02`): reject token when `expired_at === now`.
3. **Pass** `TC-SRV-VE-003`: duplicate email deletes pending and throws.

### `resendVerification.service.spec.mjs` (3: 2 pass, 1 fail)

1. **Pass** `TC-SRV-RV-001`: successful resend and generic confirmation.
2. **Pass** `TC-SRV-RV-002`: no pending → generic, no side effects.
3. **Fail** `TC-SRV-RV-003` (`FR-CON-02`): preserve previous token/TTL when replacement mail fails.

### `register.controller.spec.mjs` (2, pass)

1. 201 generic; service called with body fields.
2. Service generic return still 201 — not 409.

### `verifyEmail.controller.spec.mjs` (2, pass)

1. 200 `{ user }`; session + cookies; no JWT in body.
2. Missing token 400; expired message 410.

### `resendVerification.controller.spec.mjs` (2, pass)

1. 200 passthrough of generic; missing email 400 `'Email is required'`.
2. Service throw → 200 generic (anti-enumeration catch).

### `googleAuth.controller.spec.mjs` (2, pass)

1. Session cookies, redirect `${CLIENT_URL}/auth/callback` without query.
2. Redirect URL contains neither `password_hash` nor `GOOGLE_AUTH`.

### `register.api.spec.mjs` (2, pass)

1. POST valid body → 201 generic; mailer called.
2. Existing user → 201 generic; mailer not called.

### `verifyEmail.api.spec.mjs` (2, pass)

1. Valid token → 200 `{ user }` (session mocked).
2. Missing token → 400 required-token.

### `resendVerification.api.spec.mjs` (2, pass)

1. Pending exists → 200 generic; mailer called.
2. No pending → 200 generic; mailer not called (`TC-INT-RV-002`).

### `googleAuth.api.spec.mjs` (2, pass)

1. `GET /auth/google` 302 to Google.
2. Callback success 302 to `/auth/callback` without `token=`.

---

## 18b. Expiration and Consistency Requirements

These are ordinary functional requirements. Current execution status is Fail.

| Requirement | Test | Expected | Observed | Status |
| --- | --- | --- | --- | --- |
| `FR-EXP-01` | `TC-SRV-REG-002` | Exact-time pending boundary is expired | Registration remains active (`deletePendingByEmail` not called) | Fail |
| `FR-CON-01` | `TC-SRV-REG-003` | Failed email leaves no committed pending state | Pending write remains committed | Fail |
| `FR-EXP-02` | `TC-SRV-VE-002` | Exact-time token is rejected | Verification succeeds with `{ user, userRow }` | Fail |
| `FR-CON-02` | `TC-SRV-RV-003` | Previous token remains usable after failed resend | Replacement is committed before delivery | Fail |

---

## 19. Acceptance Criteria

1. Exactly 12 `test_auth_register` files.
2. Each file has 2–3 executed tests.
3. The suite contains exactly 27 executed tests. The latest execution result is recorded separately as 23 passed and 4 failed.
4. The only failures are `TC-SRV-REG-002`, `TC-SRV-REG-003`, `TC-SRV-VE-002`, `TC-SRV-RV-003`.
5. Stale 409 / JWT-body / query-token / “No pending” throw expectations gone from passing tests.
6. Production, package, and unrelated Vitest config unchanged.
7. `@A_R1`–`@A_R10` each have ≥1 retained test (failed tests still count).
8. Unique test IDs; merges/removals documented.
9. The suite is **not** claimed fully green.
10. No new fragmented files or unjustified helpers.

---

## 20. Measurable Success Criteria

| Metric | Before (86-test suite) | After |
| --- | ---: | ---: |
| Files | 12 | 12 |
| Executed tests | 86 | **27** |
| Passed | n/a | **23** |
| Failed | n/a | **4** |
| Files with >3 tests | 10 | 0 |
| Production files changed | 0 | 0 |
| New helper files | 0 | 0 |
| `vitest.config.mjs` | 12-file include | unchanged |

---

## 21. Assumptions and Verified Facts

**Verified**: anti-enumeration on register and resend; mailer after commit; verify returns `{ user, userRow }`; Google/verify HTTP use cookies and query-less redirect; expiration uses `now > expired_at` (equality is active); `registerLimiter` 5/hour; `recoveryLimiter` 3/15m.

**Verified after this revision**: 27 executed tests; 23 passed; 4 failed (`TC-SRV-REG-002`, `TC-SRV-REG-003`, `TC-SRV-VE-002`, `TC-SRV-RV-003`). Two POSTs per register/resend API file produced no 429. No limiter mock.
