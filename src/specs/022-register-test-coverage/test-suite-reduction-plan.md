# Implementation Plan: Reduce Register Flow Test Count

**Branch**: `022-register-test-coverage` (existing; no new branch)
**Date**: 2026-08-14
**Spec**: `src/specs/022-register-test-coverage/test-suite-reduction-spec.md`
**Status**: 12 files, 27 tests. Latest recorded execution: 23 passed / 4 failed. Limiters were not mocked.

This plan does **not** add test files. All work edits the existing 12 `test_auth_register` files in place.

---

## 1. Technical Context

| Item | Value |
| --- | --- |
| Language | JavaScript ESM (Node) |
| Test runner | Vitest, project `test_auth_register` |
| HTTP test | Supertest + Express app mounting `auth.routes.mjs` |
| Server root | `src/server` |
| Config | `src/server/vitest.config.mjs` — explicit 12-file include (leave unchanged) |
| Production | Do not modify auth services, controllers, routes, models, helpers, mailer, limiters, schema, or package files |
| Helpers | No new helper files. Local arrange functions only |

`src/server/node_modules` may be absent. Install only if required to run Vitest. Restore `package-lock.json` if the install mutates it.

---

## 2. Verified Current Behavior

Production is the contract. Stale tests that expect 409, `'Verification email sent…'`, `'No pending registration found…'`, JWT in JSON, or `?token=` are wrong.

**Register** (`registerUser` → `register` → `POST /auth/register` + `registerLimiter` + `validateRegistration`)

- Generic: `'If this email can be registered, a verification message will be sent.'`
- Existing user or active pending (`now <= expired_at`): return generic; no hash/mail/delete. HTTP **201**.
- Expired pending (`now > expired_at`): `deletePendingByEmail`, then hash + `withTransaction`/`replacePendingUser`, mailer **after COMMIT**. HTTP 201.
- Thrown infra: controller **500** `{ error }`. The 409 branch is unreachable for current service returns.
- `registerLimiter`: 5 / 60 min → 429 `RATE_LIMITED`.

**Verify** (`verifyEmail` → `verifyEmailHandler` → `POST /auth/verify-email`, no limiter)

- Success: `{ user: buildUserPayload(user), userRow: user }` — **no `signToken`**.
- Controller: `createAuthSession` + `setAuthCookies` + **200 `{ user: session.user }`**.
- Missing token: 400 `'Verification token is required'`.
- Unknown token: 400 `'Invalid or expired verification link.'`
- Expired (`>`): delete pending, 410.
- `expired_at === now`: success.
- Duplicate email: delete pending, 400 `'Email already exists.'`
- Transaction fail: 500 + ROLLBACK.

**Resend** (`resendVerificationEmailService` → `resendVerification` → `POST /auth/resend-verification` + `recoveryLimiter` + `validateEmailBody`)

- Generic: `'If a pending registration exists, a verification message will be sent.'`
- No pending: **return** generic (does not throw). HTTP 200.
- Success: reuse hash/username, replace pending, mailer after COMMIT. HTTP 200.
- Controller catch (DB/mailer throw): **200 generic**, not 500.
- Missing email at controller: 400 `'Email is required'`.
- Missing/invalid email at API: 400 `{ success: false, error: { code: 'VALIDATION_ERROR', … details.email } }`.
- `recoveryLimiter`: 3 / 15 min.

**Google** (`googleVerifyCallback` → `googleCallback`)

- Verified email required; lowercase; avatar `photos[0]` or `null`; INSERT `GOOGLE_AUTH` / role `user`.
- Returning `GOOGLE_AUTH`: `done(null, user)`, no INSERT.
- Password hash ≠ `GOOGLE_AUTH`: `done(null, false, { message: 'account_exists_with_password' })`.
- `status === 'suspended'`: `done(null, false, { message: 'USER_SUSPENDED' })`.
- DB error: `done(err, null)`. Direct `pool.query` (no transaction).
- Success HTTP: session cookies + 302 `${CLIENT_URL}/auth/callback` with **no query**.
- Failure: 302 `${CLIENT_URL}/login`.

---

## 3. Current Before-State Test Inventory

| File | Count | IDs |
| --- | ---: | --- |
| `googleAuth.strategy.spec.mjs` | 7 | TC-CFG-GA-001…007 |
| `register.service.spec.mjs` | 13 | TC-SRV-REG-001…013 |
| `verifyEmail.service.spec.mjs` | 8 | TC-SRV-VE-001…008 |
| `resendVerification.service.spec.mjs` | 6 | TC-SRV-RV-001…006 |
| `register.controller.spec.mjs` | 13 | TC-CTL-REG-001…013 |
| `verifyEmail.controller.spec.mjs` | 6 | TC-CTL-VE-001…006 |
| `resendVerification.controller.spec.mjs` | 4 | TC-CTL-RV-001…004 |
| `googleAuth.controller.spec.mjs` | 2 | TC-CTL-GA-001…002 |
| `register.api.spec.mjs` | 13 | TC-INT-REG-001…013 |
| `verifyEmail.api.spec.mjs` | 6 | TC-INT-VE-001…006 |
| `resendVerification.api.spec.mjs` | 5 | TC-INT-RV-001…005 |
| `googleAuth.api.spec.mjs` | 3 | TC-INT-GA-001…003 |
| **Total** | **86** | |

Stale contracts: register 409 / old messages; resend throw + 400/500; verify `{ token, user }` + `signToken`; Google `?token=` redirect.

---

## 4. Target After-State Test Inventory

| File | Target | IDs | Result |
| --- | ---: | --- | --- |
| `googleAuth.strategy.spec.mjs` | 2 | TC-CFG-GA-001…002 | pass |
| `register.service.spec.mjs` | 3 | TC-SRV-REG-001…003 | 001 pass; 002–003 **fail** |
| `verifyEmail.service.spec.mjs` | 3 | TC-SRV-VE-001…003 | 001,003 pass; 002 **fail** |
| `resendVerification.service.spec.mjs` | 3 | TC-SRV-RV-001…003 | 001–002 pass; 003 **fail** |
| `register.controller.spec.mjs` | 2 | TC-CTL-REG-001…002 | pass |
| `verifyEmail.controller.spec.mjs` | 2 | TC-CTL-VE-001…002 | pass |
| `resendVerification.controller.spec.mjs` | 2 | TC-CTL-RV-001…002 | pass |
| `googleAuth.controller.spec.mjs` | 2 | TC-CTL-GA-001…002 | pass |
| `register.api.spec.mjs` | 2 | TC-INT-REG-001…002 | pass |
| `verifyEmail.api.spec.mjs` | 2 | TC-INT-VE-001…002 | pass |
| `resendVerification.api.spec.mjs` | 2 | TC-INT-RV-001…002 | pass |
| `googleAuth.api.spec.mjs` | 2 | TC-INT-GA-001…002 | pass |
| **Total** | **27** | | **23 passed / 4 failed** |

IDs are renumbered sequentially per file. Old IDs are not preserved 1:1.

---

## 5. Exact 12-File Target Structure

Keep only:

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

Do not create `*.success.spec.mjs`, `*.anti-enumeration.spec.mjs`, `*.failures.spec.mjs`, or any fragment. Do not convert Vitest include to globs.

---

## 6. Proposed 2–3 Retained Tests Per File

### `googleAuth.strategy.spec.mjs`

1. **TC-CFG-GA-001** `@A_R5` `@A_R7` — First-time INSERT with photo avatar, then same callback with missing photos → avatar `null`.
2. **TC-CFG-GA-002** `@A_R2` `@A_R6` — Returning `GOOGLE_AUTH` plus password-account collision.

Removed: `TC-CFG-GA-003` pool `done(err)`.

### `register.service.spec.mjs`

1. **TC-SRV-REG-001** `@A_R1` `@A_R7` — Pass. Lookups, hash, no plaintext, mailer after transaction, generic message.
2. **TC-SRV-REG-002** `@A_R3` `@A_R7` — Fail (`FR-EXP-01`). Treat `expired_at === now` as expired.
3. **TC-SRV-REG-003** `@A_R8` `@A_R9` — Fail (`FR-CON-01`). Mail failure must not leave committed pending data.

### `verifyEmail.service.spec.mjs`

1. **TC-SRV-VE-001** `@A_R1` `@A_R7` — Pass. Promote, delete pending, `{ user, userRow }`.
2. **TC-SRV-VE-002** `@A_R3` `@A_R7` — Fail (`FR-EXP-02`). Reject token when `expired_at === now`.
3. **TC-SRV-VE-003** `@A_R2` — Pass. Duplicate email: delete pending, throw `'Email already exists.'`

### `resendVerification.service.spec.mjs`

1. **TC-SRV-RV-001** `@A_R4` `@A_R7` — Pass. Refresh token/TTL, reuse hash, mailer, generic message.
2. **TC-SRV-RV-002** `@A_R4` `@A_R2` — Pass. No pending: return generic; no replace/mail.
3. **TC-SRV-RV-003** `@A_R4` `@A_R8` `@A_R9` — Fail (`FR-CON-02`). Preserve previous token/TTL when replacement mail fails.

### `register.controller.spec.mjs`

Mock `registerUser`. Do not assert hash/SQL/mailer.

1. **TC-CTL-REG-001** `@A_R1` `@A_R10` — Service called with body; 201 generic.
2. **TC-CTL-REG-002** `@A_R2` `@A_R10` — Service generic still 201 (not 409).

Removed: `TC-CTL-REG-003` 500 mapping.

### `verifyEmail.controller.spec.mjs`

Mock `verifyEmail`, `createAuthSession`, `setAuthCookies`.

1. **TC-CTL-VE-001** `@A_R1` `@A_R7` `@A_R10` — 200 `{ user: session.user }`; session+cookies; body has no `token`.
2. **TC-CTL-VE-002** `@A_R3` `@A_R10` — Missing token 400; expired 410.

Removed: `TC-CTL-VE-003` 500 mapping.

### `resendVerification.controller.spec.mjs`

1. **TC-CTL-RV-001** `@A_R4` `@A_R10` — 200 passthrough generic; missing email 400 `'Email is required'`.
2. **TC-CTL-RV-002** `@A_R8` `@A_R10` — Service throw → 200 generic.

### `googleAuth.controller.spec.mjs`

Mock `createAuthSession` and `setAuthCookies`. Handler is `googleCallback[1]`.

1. **TC-CTL-GA-001** `@A_R5` `@A_R6` `@A_R10` — Session + cookies; redirect `${CLIENT_URL}/auth/callback` without query.
2. **TC-CTL-GA-002** `@A_R7` — Redirect URL contains neither `password_hash` nor `GOOGLE_AUTH`.

### `register.api.spec.mjs`

1. **TC-INT-REG-001** `@A_R1` `@A_R10` — 201 generic; mailer called (route wiring).
2. **TC-INT-REG-002** `@A_R2` `@A_R10` — Existing user 201 generic; mailer not called.

Removed: `TC-INT-REG-003` insert ROLLBACK (covered by `FR-CON-01` / `TC-SRV-REG-003`).

### `verifyEmail.api.spec.mjs`

Mock `createAuthSession` so session insert does not consume pool mocks.

1. **TC-INT-VE-001** `@A_R1` `@A_R7` `@A_R10` — 200 `{ user }` (no JWT field).
2. **TC-INT-VE-002** `@A_R3` `@A_R10` — Missing token 400 required-token.

Removed: `TC-INT-VE-003` insert ROLLBACK.

### `resendVerification.api.spec.mjs`

1. **TC-INT-RV-001** `@A_R4` `@A_R9` `@A_R10` — 200 generic; mailer; COMMIT.
2. **TC-INT-RV-002** `@A_R2` `@A_R4` `@A_R10` — No pending → 200 generic; no mailer.

Removed: former missing-email `VALIDATION_ERROR` case (covered by `TC-CTL-RV-001`). The retained no-pending test was renumbered from `TC-INT-RV-003` to `TC-INT-RV-002`.

### `googleAuth.api.spec.mjs`

Mock Passport authenticate + `createAuthSession`.

1. **TC-INT-GA-001** `@A_R10` — `GET /auth/google` 302 to Google.
2. **TC-INT-GA-002** `@A_R5` `@A_R6` `@A_R10` — Callback 302 `${CLIENT_URL}/auth/callback` without `token=`.

Removed: `TC-INT-GA-003` failure `/login`.

---

## 7. Old-to-New Test Migration Matrix

| Old ID | Action | Destination / reason |
| --- | --- | --- |
| TC-CFG-GA-001 | retain+merge | TC-CFG-GA-001 (photo path) |
| TC-CFG-GA-002 | merge | TC-CFG-GA-001 (null avatar act) |
| TC-CFG-GA-003 | merge | TC-CFG-GA-002 (returning) |
| TC-CFG-GA-004 | merge | TC-CFG-GA-002 (password collision) |
| TC-CFG-GA-005 | remove | Infrastructure callback coverage removed |
| TC-CFG-GA-006 | remove | Low-value “no transaction wrapper” detail |
| TC-CFG-GA-007 | remove | Suspended covered as known production path; password collision is the retained rejection |
| TC-SRV-REG-001 | retain | TC-SRV-REG-001 |
| TC-SRV-REG-002 | merge | TC-SRV-REG-002 (existing user, corrected to generic return) |
| TC-SRV-REG-003 | merge | TC-SRV-REG-002 (active pending + exact-now) |
| TC-SRV-REG-004 | merge | TC-SRV-REG-003 (expired then proceed) |
| TC-SRV-REG-005 | merge | TC-SRV-REG-001 (mailer) |
| TC-SRV-REG-006 | merge | TC-SRV-REG-001 (hash/confidentiality) |
| TC-SRV-REG-007 | merge | TC-SRV-REG-001 (pending fields / role via helper args) |
| TC-SRV-REG-008 | remove | One-per-dependency failure |
| TC-SRV-REG-009 | remove | One-per-dependency failure |
| TC-SRV-REG-010 | remove | One-per-dependency failure |
| TC-SRV-REG-011 | remove | One-per-dependency failure |
| TC-SRV-REG-012 | merge | TC-SRV-REG-003 (tx skip mailer) |
| TC-SRV-REG-013 | remove | Mailer-after-commit covered by success ordering; skip-mailer is the higher-risk boundary |
| TC-SRV-VE-001 | retain | TC-SRV-VE-001 (contract: `{ user, userRow }`) |
| TC-SRV-VE-002 | retain | TC-SRV-VE-003 |
| TC-SRV-VE-003 | merge | TC-SRV-VE-002 |
| TC-SRV-VE-004 | merge | TC-SRV-VE-002 |
| TC-SRV-VE-005 | merge | TC-SRV-VE-002 |
| TC-SRV-VE-006 | merge | TC-SRV-VE-001 (no password_hash) |
| TC-SRV-VE-007 | remove | Generic lookup throw; infra represented at register/Google |
| TC-SRV-VE-008 | remove | Tx skip-mailer lives on register/resend; duplicate is higher-value verify case |
| TC-SRV-RV-001 | retain | TC-SRV-RV-001 (generic message corrected) |
| TC-SRV-RV-002 | retain | TC-SRV-RV-002 (corrected: return generic, do not throw) |
| TC-SRV-RV-003 | merge | TC-SRV-RV-001 (reuse hash) |
| TC-SRV-RV-004 | remove | Lookup throw; tx skip-mailer retained |
| TC-SRV-RV-005 | remove | Mailer throw after commit is lower than skip-mailer |
| TC-SRV-RV-006 | retain | TC-SRV-RV-003 |
| TC-CTL-REG-001 | retain | TC-CTL-REG-001 (service mock; 201 generic) |
| TC-CTL-REG-002 | merge | TC-CTL-REG-002 (201 not 409) |
| TC-CTL-REG-003 | merge | TC-CTL-REG-002 |
| TC-CTL-REG-004…007 | remove | Service internals repeated at controller |
| TC-CTL-REG-008…011 | remove | One-per-dependency HTTP 500 |
| TC-CTL-REG-012 | remove | Controller infrastructure mapping removed |
| TC-CTL-REG-013 | remove | Mailer 500 lower than generic infra mapping |
| TC-CTL-VE-001 | retain | TC-CTL-VE-001 (session `{ user }`, not JWT body) |
| TC-CTL-VE-002 | merge | TC-CTL-VE-002 |
| TC-CTL-VE-003 | merge | TC-CTL-VE-002 |
| TC-CTL-VE-004 | remove | Invalid-token 400 absorbed as lower than missing+expired pair |
| TC-CTL-VE-005 | remove | Controller infrastructure mapping removed |
| TC-CTL-VE-006 | remove | Duplicate HTTP 400 covered at service; controller keeps status mapping via expired/missing |
| TC-CTL-RV-001 | merge | TC-CTL-RV-001 (generic passthrough) |
| TC-CTL-RV-002 | merge | TC-CTL-RV-001 (missing email) |
| TC-CTL-RV-003 | remove | Stale: service no longer throws “No pending…” |
| TC-CTL-RV-004 | retain | TC-CTL-RV-002 (corrected: 200 generic, not 500) |
| TC-CTL-GA-001 | retain | TC-CTL-GA-001 (session redirect, no query) |
| TC-CTL-GA-002 | retain | TC-CTL-GA-002 |
| TC-INT-REG-001 | retain | TC-INT-REG-001 (generic + mailer) |
| TC-INT-REG-002 | retain | TC-INT-REG-002 (201 generic, no mailer) |
| TC-INT-REG-003 | remove | Active pending HTTP duplicate of service anti-enum |
| TC-INT-REG-004 | remove | Expired lifecycle owned by service |
| TC-INT-REG-005 | merge | TC-INT-REG-001 |
| TC-INT-REG-006 | remove | Hashing owned by service |
| TC-INT-REG-007 | remove | Role owned by service/helper |
| TC-INT-REG-008…011 | remove | One-per-dependency 500 |
| TC-INT-REG-012 | remove | Transaction consistency represented by `TC-SRV-REG-003` |
| TC-INT-REG-013 | remove | SMTP-after-commit lower than rollback |
| TC-INT-VE-001 | retain | TC-INT-VE-001 (`{ user }` not token) |
| TC-INT-VE-002 | remove | Duplicate email HTTP owned by service |
| TC-INT-VE-003 | retain | TC-INT-VE-002 |
| TC-INT-VE-004 | remove | Unknown token owned by service |
| TC-INT-VE-005 | remove | Expired 410 owned by service+controller |
| TC-INT-VE-006 | remove | Rollback scenario removed |
| TC-INT-RV-001 | retain | TC-INT-RV-001 (generic message) |
| TC-INT-RV-002 | remove | Missing-email `VALIDATION_ERROR` covered by `TC-CTL-RV-001` |
| TC-INT-RV-003 | retain | TC-INT-RV-002 (200 generic, not 400; sequential renumber) |
| TC-INT-RV-004 | remove | DB throw maps to 200 at controller; covered by TC-CTL-RV-002 |
| TC-INT-RV-005 | remove | Mailer throw maps to 200; skip-mailer at service |
| TC-INT-GA-001 | retain | TC-INT-GA-001 |
| TC-INT-GA-002 | retain | TC-INT-GA-002 (no query token) |
| TC-INT-GA-003 | remove | Callback failure redirect removed |

---

## 8. Tests to Retain

Primary retained scenarios (renumbered): all `…-001` success paths; strategy returning/collision; register/resend anti-enum; verify token lifecycle; controller HTTP mapping; API route contracts; Google initiator/callback.

---

## 9. Tests to Merge

Related assertions belonging to one scenario: hashing, role, mailer, lookups, generic shape, avatar fallback, returning+collision, existing+active pending, expired+tx skip mailer, missing-token+410, success+missing-email on resend controller.

---

## 10. Tests to Remove

Reasons: one-per-dependency failures; cross-layer repeats of hashing/SQL/mailer; Google no-transaction and dedicated suspended; verify generic DB throw and standalone rollback; stale “No pending throw” / 409 / JWT-body / query-token cases whose corrected assertions live in a retained test.

Removed IDs are **not** claimed preserved unless listed as merged.

---

## 11. Reason for Every Merge or Removal

See §7. Summary: keep highest-risk scenario per file (success, security/anti-enum/lifecycle, one infra/tx boundary). Drop the rest.

---

## 12. Layer-Specific Coverage Strategy

- **Service**: business + security + lifecycle + tx/mailer order. No HTTP.
- **Controller**: mock service/session; assert extraction, status, body. No bcrypt/SQL/mailer.
- **Integration**: real router + validation + mocked pool/mailer/OAuth. One success, one security/validation, one failure/rollback.
- **Strategy**: Passport callback only.

Register controller currently drives the real service. Rewrite it to mock `registerUser`.

Verify/Google HTTP must mock `createAuthSession` (and `setAuthCookies` in unit tests) because production no longer signs JWT in the controller.

---

## 13. Mock and Isolation Strategy

- Service: mock models, `withTransaction`/`replacePendingUser`, mailer, bcrypt.
- Controller: mock the service module (and session helpers for verify/Google).
- Integration: mock `postgres.mjs` pool/connect, mailer, bcrypt (register), Passport (Google), `createAuthSession` (verify/Google). Keep real `withTransaction` against mocked client.
- `vi.clearAllMocks()` in `beforeEach`. Fake timers restored in `finally`.
- Mock `getUserRecommendations` where verify success would fire it.
- No new helper files.

---

## 14. Rate-Limiter Decision

Do **not** mock limiters first. The reduced register API file executes 2 POST requests against a limit of 5. The reduced resend API file executes 2 POST requests against a limit of 3. Neither file reaches the configured rate-limit threshold.

**Decision (verified)**: No limiter mock is required. Focused and full-project runs of the reduced suite returned no 429 responses. Production limiter configuration remains unchanged.

---

## 15. Tag Migration Matrix

| Tag | Retained tests | Notes |
| --- | --- | --- |
| `@A_R1` | TC-SRV-REG-001, TC-SRV-VE-001, TC-CTL-REG-001, TC-CTL-VE-001, TC-INT-REG-001, TC-INT-VE-001 | pass |
| `@A_R2` | TC-CFG-GA-002, TC-SRV-VE-003, TC-SRV-RV-002, TC-CTL-REG-002, TC-INT-REG-002, TC-INT-RV-002 | pass |
| `@A_R3` | TC-SRV-REG-002, TC-SRV-VE-002, TC-CTL-VE-002, TC-INT-VE-002 | REG-002 / VE-002 Fail |
| `@A_R4` | TC-SRV-RV-001, TC-SRV-RV-002, TC-SRV-RV-003, TC-CTL-RV-001, TC-INT-RV-001, TC-INT-RV-002 | RV-003 Fail |
| `@A_R5` | TC-CFG-GA-001, TC-CTL-GA-001, TC-INT-GA-002 | pass |
| `@A_R6` | TC-CFG-GA-002, TC-CTL-GA-001, TC-INT-GA-002 | pass |
| `@A_R7` | TC-SRV-REG-001, TC-SRV-REG-002, TC-SRV-VE-001, TC-SRV-VE-002, TC-SRV-RV-001, TC-CFG-GA-001, TC-CTL-VE-001, TC-CTL-GA-002, TC-INT-VE-001 | REG-002 / VE-002 Fail |
| `@A_R8` | TC-SRV-REG-003, TC-SRV-RV-003, TC-CTL-RV-002 | REG-003 / RV-003 Fail |
| `@A_R9` | TC-SRV-REG-003, TC-SRV-RV-003, TC-INT-RV-001 | REG-003 / RV-003 Fail |
| `@A_R10` | All retained controller and API tests | pass |

Failed tests still count as executed tag evidence. Status is Fail, not skip.

Every tag has ≥1 retained test. Extra occurrences at every layer are not required.

---

## 16. Test-ID Migration Strategy

Renumber sequentially inside each file (`001`–`003`). Document old→new in §7. Unique IDs across the project remain unique because prefixes differ (`TC-CFG-GA`, `TC-SRV-REG`, …).

---

## 17. File-by-File Implementation Order

1. Baseline: count + run current project (expect stale failures).
2. `register.service.spec.mjs`
3. `verifyEmail.service.spec.mjs`
4. `resendVerification.service.spec.mjs`
5. `register.controller.spec.mjs`
6. `verifyEmail.controller.spec.mjs`
7. `resendVerification.controller.spec.mjs`
8. `googleAuth.controller.spec.mjs`
9. `googleAuth.strategy.spec.mjs`
10. `register.api.spec.mjs`
11. `verifyEmail.api.spec.mjs`
12. `resendVerification.api.spec.mjs`
13. `googleAuth.api.spec.mjs`
14. Full verification (files, layers, tags, project, counts, diff).

---

## 18. Focused Verification Commands

From `src/server`:

```text
npm run test:auth:register
```

Equivalent:

```text
npx vitest run --project test_auth_register
```

Focused file runs (optional):

```text
npx vitest run --project test_auth_register tests/services/register.service.spec.mjs
npx vitest run --project test_auth_register tests/services/verifyEmail.service.spec.mjs
npx vitest run --project test_auth_register tests/services/resendVerification.service.spec.mjs
npx vitest run --project test_auth_register tests/controllers/register.controller.spec.mjs
npx vitest run --project test_auth_register tests/controllers/verifyEmail.controller.spec.mjs
npx vitest run --project test_auth_register tests/controllers/resendVerification.controller.spec.mjs
npx vitest run --project test_auth_register tests/controllers/googleAuth.controller.spec.mjs
npx vitest run --project test_auth_register tests/config/googleAuth.strategy.spec.mjs
npx vitest run --project test_auth_register tests/integration/register.api.spec.mjs
npx vitest run --project test_auth_register tests/integration/verifyEmail.api.spec.mjs
npx vitest run --project test_auth_register tests/integration/resendVerification.api.spec.mjs
npx vitest run --project test_auth_register tests/integration/googleAuth.api.spec.mjs
```

---

## 19. Full-Project Verification

```text
npm run test:auth:register
npm run test:auth:tag -- @A_R1
… through @A_R10
```

Equivalent tag filter:

```text
npx vitest run --project "test_auth*" --tags-filter=@A_R1
```

Then: mechanical `it(` / `test(` count; duplicate ID grep; `git diff --check`; confirm 12 files, 2–3 tests each, **27 total**. Record the latest Pass/Fail counts separately.

---

## 20. Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| Stale 409/JWT/query-token expectations fail | Align tests to production; do not change production |
| `createAuthSession` hits extra SQL in verify/Google HTTP | Mock the session service |
| Register controller repeats service internals | Mock `registerUser` |
| False 429 with 3 resend tests | Run first; mock only `recoveryLimiter` if proven |
| Tag loss after merge | §15 mapping; verify `--tags-filter` / `npm run test:auth:tag` |
| Accidental new files | Edit in place; glob check = 12 |
| `npm install` mutates lockfile | Restore lockfile unless a dependency change was required |
| `it.each` temptation | Forbidden; sequential acts inside one `it()` only |

---

## 21. Definition of Done

**Structural completion**

- Exactly 12 authentication test files remain.
- Each file has 2–3 executed tests.
- Total exactly **27**.
- Unique test IDs; `@A_R1`–`@A_R10` each mapped.
- No production, package, or unnecessary helper/config changes.

**Passing regression coverage**

- **23** tests pass against current production contracts.

**Specification requirements currently Fail**

- `FR-EXP-01` / `TC-SRV-REG-002`
- `FR-CON-01` / `TC-SRV-REG-003`
- `FR-EXP-02` / `TC-SRV-VE-002`
- `FR-CON-02` / `TC-SRV-RV-003`

This feature’s scope is test design and execution only.

---

## 22. Requirement Execution Results

| Requirement | Test Case | Expected Behavior | Observed Behavior | Status |
| --- | --- | --- | --- | --- |
| `FR-EXP-01` | `TC-SRV-REG-002` | Exact-time boundary is expired | Registration remains active | Fail |
| `FR-CON-01` | `TC-SRV-REG-003` | Failed email leaves no committed pending state | Pending state remains committed | Fail |
| `FR-EXP-02` | `TC-SRV-VE-002` | Exact-time token is rejected | Verification succeeds | Fail |
| `FR-CON-02` | `TC-SRV-RV-003` | Previous token remains usable after failed resend | Replacement is committed before delivery | Fail |

Verified: `npm run test:auth:register` (equivalent: `npx vitest run --project test_auth_register`) → **12 files, 27 tests**. Latest recorded execution: **23 passed, 4 failed**. No new files. No production/package/config changes. Original `spec.md`, `plan.md`, and `tasks.md` were not modified.
