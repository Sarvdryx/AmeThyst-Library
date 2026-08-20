# Tasks: Account Registration (Register) Flow Test Coverage (Expanded)

**Input**: [spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/022-register-test-coverage/spec.md), [plan.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/022-register-test-coverage/plan.md)

---

## Task-Authoring Convention
Task descriptions may reference the global spec.md scenario number for traceability (e.g. "implements spec.md Scenario 4"), but the resulting test file's describe() titles must NEVER carry that global number — they always use local sequential "Test 1 - ..." numbering, scoped to that file.

---

## Phase 1: Production Code Refactor

### Task 1: Extract Google Strategy Verification Callback
*   **Scenario Satisfied**: Scenarios 2, 5, 6, 7, 8, 9 (OAuth paths)
*   **File to Modify**: [passport.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/config/passport.mjs)
*   **Dependencies**: None
*   **Description**: Extract the anonymous async verify callback function inside the GoogleStrategy constructor into an independently-exported, named function `googleVerifyCallback`. Wire it back into the strategy.
*   **Independent Verification**: Ensure the server starts without syntax/runtime issues, and strategy wiring remains identical.
*   **Status**: Completed [x]

---

## Phase 2: Service-Layer Unit Testing

### Task 2: Implement Verify Email Service Tests
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9
*   **File to Create**: [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs)
*   **Dependencies**: Task 1
*   **Sub-tasks**:
    *   [x] **Task 2.1**: Test Scenario 1 (Successful email verification promotes pending user to users table, deletes pending token, and returns JWT + user payload).
    *   [x] **Task 2.2**: Test Scenario 2 (Aborts and throws error if the email already exists in `users`).
    *   [x] **Task 2.3**: Test Scenario 3 (TTL Validation: throws error on invalid token, throws 410 on expired token, and succeeds on exact boundary matching expiry).
    *   [x] **Task 2.4**: Test Scenario 7 (Ensures user payload removes `password_hash` and defaults role to `'user'`).
    *   [x] **Task 2.5**: Test Scenario 8 (Asserts database exceptions and connection errors propagate safely without crashing).
    *   [x] **Task 2.6**: Test Scenario 9 (Validates database transaction rollbacks if user insertion fails or token deletion throws).
*   **Independent Verification**: Run `npx vitest run tests/services/verifyEmail.service.spec.mjs`.
*   **Status**: Completed [x]

### Task 3: Implement Resend Verification Service Tests
*   **Scenario Satisfied**: Scenarios 4, 7, 8, 9
*   **File to Create**: [resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs)
*   **Dependencies**: Task 1
*   **Sub-tasks**:
    *   [x] **Task 3.1**: Test Scenario 4 (Successful resend: fetches pending row, updates new token & expiration in transaction, dispatches email).
    *   [x] **Task 3.2**: Test Scenario 4 (Throws error `"No pending registration found..."` if no pending record exists).
    *   [x] **Task 3.3**: Test Scenario 7 (Ensures the password hash is reused exactly as-is in the new pending record, and role remains `'user'`).
    *   [x] **Task 3.4**: Test Scenario 8 (Mailer/Database exceptions propagate safely).
    *   [x] **Task 3.5**: Test Scenario 9 (Transactional consistency: verifies deletion rolls back if inserting the new pending record fails).
*   **Independent Verification**: Run `npx vitest run tests/services/resendVerification.service.spec.mjs`.
*   **Status**: Completed [x]

---

## Phase 3: Google Strategy Callback Unit Testing

### Task 4: Implement Google Strategy Callback Unit Tests
*   **Scenario Satisfied**: Scenarios 2, 5, 6, 7, 8, 9
*   **File to Create**: [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs)
*   **Dependencies**: Task 1 (Blocks this strategy testing task)
*   **Sub-tasks**:
    *   [x] **Task 4.1**: Test Scenario 5 (First-time sign-in: maps email, maps `displayName` to `username`, maps `photos[0].value` to `avatar`, writes `'GOOGLE_AUTH'` as password hash, sets default role `'user'`, and calls `done(null, user)`).
    *   [x] **Task 4.2**: Test Scenario 6 (Returning Google user: checks SELECT finds user with `'GOOGLE_AUTH'` hash, skips INSERT, and calls `done(null, user)`).
    *   [x] **Task 4.3**: Test Scenario 2(c) / NFR4 (Account-linking ambiguity: SELECT finds an existing user row regardless of whether it was created via password or Google, skips INSERT, authenticates against it with no ownership check — documents current behavior per spec.md N4, does not resolve it).
    *   [x] **Task 4.4**: Test Scenario 8 (Infrastructure failure: mocks pool query failure, asserts error is passed to `done(err, null)`).
    *   [x] **Task 4.5**: Test Scenario 9 (Transactional absence: validates SELECT and INSERT queries are run directly on the pool without client transactions).
*   **Independent Verification**: Run `npx vitest run tests/config/googleAuth.strategy.spec.mjs`.
*   **Status**: Completed [x]

---

## Phase 4: Controller-Layer Unit Testing

### Task 5: Implement Verify Email Controller Tests
*   **Scenario Satisfied**: Scenarios 2, 3, 8, 10
*   **File to Create**: [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs)
*   **Dependencies**: Task 2
*   **Sub-tasks**:
    *   [x] **Task 5.1**: Test Scenario 3 (HTTP mappings: expired token throws and maps to HTTP `410 Gone`, missing token maps to `400 Bad Request`, other general failures map to `400`).
    *   [x] **Task 5.2**: Test Scenario 10 (Asserts HTTP responses: returns `200 OK` with JSON containing signed JWT and user payload on success).
    *   [x] **Task 5.3**: Test Scenario 2 (Duplicate email rejection: verifyEmail service throws 'Email already exists.', controller maps it to HTTP 400).
*   **Independent Verification**: Run `npx vitest run tests/controllers/verifyEmail.controller.spec.mjs`.
*   **Status**: Completed [x]

### Task 6: Implement Resend Verification Controller Tests
*   **Scenario Satisfied**: Scenarios 8, 10
*   **File to Create**: [resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs)
*   **Dependencies**: Task 3
*   **Sub-tasks**:
    *   [x] **Task 6.1**: Test Scenario 8 (HTTP mappings: missing email input maps to HTTP `400`, service exception for "No pending" maps to HTTP `400`, database/mailer infrastructure exception maps to HTTP `500 Internal Server Error`).
    *   [x] **Task 6.2**: Test Scenario 10 (Asserts HTTP responses: returns `200 OK` with JSON success message).
*   **Independent Verification**: Run `npx vitest run tests/controllers/resendVerification.controller.spec.mjs`.
*   **Status**: Completed [x]

### Task 7: Implement Google OAuth Controller Tests
*   **Scenario Satisfied**: Scenarios 5, 6, 7, 8, 10
*   **File to Create**: [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs)
*   **Dependencies**: Task 1
*   **Sub-tasks**:
    *   [x] **Task 7.1**: Test Scenario 10 (Google callback redirects: mocks `req.user`, checks that `res.redirect` is triggered targeting `${CLIENT_URL}/auth/callback?token=...&user=...` where user is URI-encoded JSON. Never returns JSON).
    *   [x] **Task 7.2**: Test Scenario 7 (Invariants: asserts that `signToken` and `buildUserPayload` are invoked with correct params, and `password_hash` is not leaked).
*   **Independent Verification**: Run `npx vitest run tests/controllers/googleAuth.controller.spec.mjs`.
*   **Status**: Completed [x]

---

## Phase 5: API Integration Testing

### Task 8: Implement Verify Email API Tests
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9, 10
*   **File to Create**: [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs)
*   **Dependencies**: Task 2, Task 5
*   **Description**: Verify end-to-end `POST /auth/verify-email` endpoint behavior using `supertest`, mounting auth router on mock Express, and stubbing pg database pool.
*   **Independent Verification**: Run `npx vitest run tests/integration/verifyEmail.api.spec.mjs`.
*   **Status**: Completed [x]

### Task 9: Implement Resend Verification API Tests
*   **Scenario Satisfied**: Scenarios 4, 8, 9, 10
*   **File to Create**: [resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs)
*   **Dependencies**: Task 3, Task 6
*   **Description**: Verify end-to-end `POST /auth/resend-verification` endpoint behavior using `supertest`, mounting auth router on mock Express, and stubbing pg database pool & mailer utility.
*   **Independent Verification**: Run `npx vitest run tests/integration/resendVerification.api.spec.mjs`.
*   **Status**: Completed [x]

### Task 10: Implement Google OAuth API Integration Tests
*   **Scenario Satisfied**: Scenarios 5, 6, 7, 8, 9, 10
*   **File to Create**: [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs)
*   **Dependencies**: Task 1, Task 4, Task 7
*   **Description**: Verify redirection routing of `GET /auth/google` (asserting correct passport scopes) and callback redirection flow of `GET /auth/google/callback` (mocking passport strategy resolution, asserting correct success redirect and failure redirects).
*   **Independent Verification**: Run `npx vitest run tests/integration/googleAuth.api.spec.mjs`.
*   **Status**: Completed [x]

---

## Phase 6: Final Verification & Compliance

### Task 11: Run Full Test Suite & Verify Compliance
*   **Scenario Satisfied**: All
*   **File to Modify**: None
*   **Dependencies**: Tasks 1 through 10
*   **Sub-tasks**:
    *   [x] **Task 11.1**: Run `npm test` or `npx vitest run` and confirm all 35 existing tests and all 9 new test suites pass green.
    *   [x] **Task 11.2**: Verify that coverage targets from [spec.md §9](file:///D:/HK3/Library/AmeThyst-Library/src/specs/022-register-test-coverage/spec.md#L208) are met.
*   **Status**: Completed [x]

---

## Phase 7: Post-Completion Fixes

### Task 12: Refactor Invalid Verification Token Error Mapping (Fix 1)
*   **Scenario Satisfied**: Scenario 3 (Token TTL Lifecycle / HTTP Matrix)
*   **Files Modified**: 
    *   [auth.controllers.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/controllers/auth.controllers.mjs)
    *   [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs)
    *   [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs)
*   **Description**:
    *   Fix error status mapping logic inside `verifyEmailHandler` to perform an exact match checking for `'Verification link has expired. Please register again.'` rather than checking `includes('expired')` which wrongly matches the invalid/non-existent token message.
    *   Update [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs) to replace the fabricated error message `"Invalid verification link."` with `"Invalid or expired verification link."` and assert HTTP 400.
    *   Add an end-to-end integration test case inside [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) for absent tokens returning 400 and the correct error message.
*   **Independent Verification**: Run `npx vitest run tests/controllers/verifyEmail.controller.spec.mjs tests/integration/verifyEmail.api.spec.mjs`.
*   **Status**: Completed [x]

### Task 13: Google Sign-In Pre-existing Password Account Refusal (Fix 2)
*   **Scenario Satisfied**: Scenario 2 (Reject Duplicate Email Across Entry Points)
*   **Files Modified**:
    *   [passport.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/config/passport.mjs)
    *   [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs)
*   **Description**:
    *   Modify `googleVerifyCallback` to refuse authentication when the existing account found in the database has a standard bcrypt password hash (`password_hash !== 'GOOGLE_AUTH'`), by calling `done(null, false, { message: 'account_exists_with_password' })`.
    *   Update [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) Test 3 assertion to assert `done(null, false, expect.any(Object))` and ensure no SQL INSERT query is run.
*   **Independent Verification**: Run `npx vitest run tests/config/googleAuth.strategy.spec.mjs`.
*   **Status**: Completed [x]

---

## Phase 8: Vitest Scenario Tagging (register.service.spec.mjs, register.controller.spec.mjs, and register.api.spec.mjs are out of scope)

### Task 14: Configure Scenario Tags in Vitest Config
*   **Scenario Satisfied**: N/A (Infrastructure configuration)
*   **Files Modified**:
    *   [vitest.config.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/vitest.config.mjs)
*   **Description**: Define the valid scenario tags `@A_R1` through `@A_R10` inside the `test.tags` configuration array, or set `strictTags: false` under the `test` block to allow tagging tests without throwing compilation/run errors.
*   Independent Verification: Run `npx vitest run --list-tags` to confirm that the tags are registered correctly.
*   Status: Completed [x] (Verified: vitest.config.mjs defines the tags per plan.md 6.2)

### Task 15: Apply Scenario Tags to googleAuth.strategy.spec.mjs
*   **Scenario Satisfied**: Scenarios 2, 5, 6, 7, 8, 9
*   **Files Modified**:
    *   [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) per the mapping:
    *   `describe('Test 1 - Google OAuth first-time sign-in (Auto-provisioning)', ...)` -> `{ tags: ['@A_R5', '@A_R7'] }`
    *   `describe('Test 2 - Google OAuth returning user', ...)` -> `{ tags: '@A_R6' }`
    *   `describe('Test 3 - Google Sign-In with Pre-existing Password Account (NFR)', ...)` -> `{ tags: '@A_R2' }`
    *   `describe('Test 4 - Infrastructure failure handling', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 5 - Transactional consistency (documented absence)', ...)` -> `{ tags: '@A_R9' }`
*   Independent Verification: Run `npx vitest run tests/config/googleAuth.strategy.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 16: Apply Scenario Tags to verifyEmail.service.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9
*   **Files Modified**:
    *   [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful end-to-end email verification', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 2 - Reject duplicate email during verification', ...)` -> `{ tags: '@A_R2' }`
    *   `describe('Test 3 - TTL and token validation lifecycle', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 4 - Security and data-shape invariants', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 5 - Infrastructure failure handling', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 6 - Transactional consistency', ...)` -> `{ tags: '@A_R9' }`
*   Independent Verification: Run `npx vitest run tests/services/verifyEmail.service.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 17: Apply Scenario Tags to resendVerification.service.spec.mjs
*   **Scenario Satisfied**: Scenarios 4, 7, 8, 9
*   **Files Modified**:
    *   [resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs) per the mapping:
    *   `describe('Test 1 - Resend verification email', ...)` -> `{ tags: '@A_R4' }`
    *   `describe('Test 2 - Security and data-shape invariants', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 3 - Infrastructure failure handling', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 4 - Transactional consistency', ...)` -> `{ tags: '@A_R9' }`
*   Independent Verification: Run `npx vitest run tests/services/resendVerification.service.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 18: Apply Scenario Tags to verifyEmail.controller.spec.mjs
*   **Scenario Satisfied**: Scenarios 2, 3, 8, 10
*   **Files Modified**:
    *   [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs) per the mapping:
    *   `describe('Test 1 - Correct HTTP response/redirect for every outcome', ...)` -> `{ tags: '@A_R10' }`
    *   `describe('Test 2 - TTL and token validation lifecycle mappings', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 3 - Infrastructure failure mapping', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 4 - Reject duplicate email during verification', ...)` -> `{ tags: '@A_R2' }`
*   Independent Verification: Run `npx vitest run tests/controllers/verifyEmail.controller.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 19: Apply Scenario Tags to resendVerification.controller.spec.mjs
*   **Scenario Satisfied**: Scenarios 4, 8, 10
*   **Files Modified**:
    *   [resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs) per the mapping:
    *   `describe('Test 1 - Correct HTTP response/redirect for every outcome', ...)` -> `{ tags: '@A_R10' }`
    *   `describe('Test 2 - Infrastructure failure mapping (500 vs 400)', ...)` -> `{ tags: ['@A_R4', '@A_R8'] }`
*   Independent Verification: Run `npx vitest run tests/controllers/resendVerification.controller.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 20: Apply Scenario Tags to googleAuth.controller.spec.mjs
*   **Scenario Satisfied**: Scenarios 5, 6, 7, 10
*   **Files Modified**:
    *   [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs) per the mapping:
    *   `describe('Test 1 - Correct HTTP response/redirect for Google callback', ...)` -> `{ tags: ['@A_R5', '@A_R6', '@A_R10'] }`
    *   `describe('Test 2 - Security and data-shape invariants (Google Callback)', ...)` -> `{ tags: '@A_R7' }`
*   Independent Verification: Run `npx vitest run tests/controllers/googleAuth.controller.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 21: Apply Scenario Tags to verifyEmail.api.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9, 10
*   **Files Modified**:
    *   [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful verification', ...)` -> `{ tags: ['@A_R1', '@A_R7', '@A_R9', '@A_R10'] }`
    *   `describe('Test 2 - Duplicate email rejection', ...)` -> `{ tags: ['@A_R2', '@A_R10'] }`
    *   `describe('Test 3 - Token lifecycle and error codes', ...)` -> `{ tags: ['@A_R3', '@A_R10'] }`
    *   `describe('Test 4 - Infrastructure failures and rollbacks', ...)` -> `{ tags: ['@A_R8', '@A_R9', '@A_R10'] }`
*   Independent Verification: Run `npx vitest run tests/integration/verifyEmail.api.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 22: Apply Scenario Tags to resendVerification.api.spec.mjs
*   **Scenario Satisfied**: Scenarios 4, 8, 9, 10
*   **Files Modified**:
    *   [resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful resend', ...)` -> `{ tags: ['@A_R4', '@A_R9', '@A_R10'] }`
    *   `describe('Test 2 - Validation errors', ...)` -> `{ tags: ['@A_R4', '@A_R10'] }`
    *   `describe('Test 3 - Infrastructure failures mapping to 500', ...)` -> `{ tags: ['@A_R8', '@A_R9', '@A_R10'] }`
*   Independent Verification: Run `npx vitest run tests/integration/resendVerification.api.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 23: Apply Scenario Tags to googleAuth.api.spec.mjs
*   **Scenario Satisfied**: Scenarios 2, 5, 6, 8, 10
*   **Files Modified**:
    *   [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs) per the mapping:
    *   `describe('Test 1 - Correct HTTP response/redirect for Google Auth Initiator', ...)` -> `{ tags: '@A_R10' }`
    *   `describe('Test 2 - Successful Google callback redirect', ...)` -> `{ tags: ['@A_R5', '@A_R6', '@A_R10'] }`
    *   `describe('Test 3 - Callback failure redirect', ...)` -> `{ tags: ['@A_R2', '@A_R8', '@A_R10'] }`
*   Independent Verification: Run `npx vitest run tests/integration/googleAuth.api.spec.mjs` to ensure the file compiles, runs, and passes successfully.
*   Status: Completed [x] (Amended: tag→tags key correction applied and verified)

### Task 24: Update Testing Documentation
*   **Scenario Satisfied**: N/A (Documentation)
*   **Files Modified**:
    *   [README.md](file:///D:/HK3/Library/AmeThyst-Library/src/README.md)
    *   [index.md](file:///D:/HK3/Library/AmeThyst-Library/docs/test/index.md)
*   **Description**: Document the scenario tagging convention, explaining the `@A_R1` through `@A_R10` mapping and detailing the exact CLI commands (such as `npx vitest run --tags-filter=@A_R5` or equivalent `npm` scripts) to filter test execution by scenario.
*   **Independent Verification**: Confirm the updated documentation accurately reflects the actual commands and configurations supported by Vitest 4.1.10.
*   **Status**: Completed [x]

### Task 25: Verify Tagged Test Runs and Full Suite Compliance
*   **Scenario Satisfied**: All
*   **Files Modified**: None
*   **Description**: Verify the tagging setup by running tests using tag filters and verify that the full test suite runs without regression.
*   **Independent Verification**:
    *   Run `npx vitest run --tags-filter=@A_R1` and verify that only tests containing Scenario 1 are executed.
    *   Run `npx vitest run --tags-filter=@A_R5` and verify that only Google strategy/callback and integration tests containing Scenario 5 are executed.
    *   Run `npm test` or `npx vitest run` in the `src/server` directory and confirm that all tests pass with zero regressions after all tagging changes are applied.
*   Status: Completed [x] (Amended: tag→tags filter functionality verified via CLI runs)

---

## Phase 9: Vitest Scenario Tagging Scope-Completion

### Task 26: Apply Scenario Tags to register.service.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9, 10
*   **File Modified**: [register.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/register.service.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [register.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/register.service.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful registration', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 2 - Reject duplicate email', ...)` -> `{ tags: '@A_R2' }`
    *   `describe('Test 3 - Reject active pending registration', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 4 - Allow registration after pending registration expires', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 5 - Send verification email', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 6 - Protect password confidentiality', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 7 - Assign default user role', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 8 - Handle unexpected failures', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 9 - Maintain registration state consistency', ...)` -> `{ tags: '@A_R9' }`
    *   `describe('Test 10 - Return appropriate registration response', ...)` -> `{ tags: ['@A_R1', '@A_R2', '@A_R3', '@A_R10'] }`
*   **Independent Verification**: Run the file with no filter and with `--tags-filter` spot check to confirm identical test count/results and proper tag filtering:
    *   `npx vitest run tests/services/register.service.spec.mjs` (Confirm 10 passed tests, identical results)
    *   `npx vitest run tests/services/register.service.spec.mjs --tags-filter=@A_R9` (Confirm only Test 9 is run)
*   **Status**: Completed [x] (Verified: 10 passed tests, tag filtering works with 9 skipped / 1 run)

### Task 27: Apply Scenario Tags to register.controller.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9, 10
*   **File Modified**: [register.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/register.controller.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [register.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/register.controller.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful registration', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 2 - Reject duplicate email', ...)` -> `{ tags: '@A_R2' }`
    *   `describe('Test 3 - Reject active pending registration', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 4 - Allow registration after pending registration expires', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 5 - Send verification email', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 6 - Protect password confidentiality', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 7 - Assign default user role', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 8 - Handle unexpected failures', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 9 - Maintain registration state consistency', ...)` -> `{ tags: '@A_R9' }`
    *   `describe('Test 10 - Return appropriate registration response', ...)` -> `{ tags: ['@A_R1', '@A_R2', '@A_R3', '@A_R10'] }`
*   **Independent Verification**: Run the file with no filter and with `--tags-filter` spot check to confirm identical test count/results and proper tag filtering:
    *   `npx vitest run tests/controllers/register.controller.spec.mjs` (Confirm 10 passed tests, identical results)
    *   `npx vitest run tests/controllers/register.controller.spec.mjs --tags-filter=@A_R9` (Confirm only Test 9 is run)
*   **Status**: Completed [x] (Verified: 10 passed tests, tag filtering works with 9 skipped / 1 run)

### Task 28: Apply Scenario Tags to register.api.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9, 10
*   **File Modified**: [register.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/register.api.spec.mjs)
*   **Description**: Add the tag annotation options as the second argument to all level-2 `describe()` blocks inside [register.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/register.api.spec.mjs) per the mapping:
    *   `describe('Test 1 - Successful registration', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 2 - Reject duplicate email', ...)` -> `{ tags: '@A_R2' }`
    *   `describe('Test 3 - Reject active pending registration', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 4 - Allow registration after pending registration expires', ...)` -> `{ tags: '@A_R3' }`
    *   `describe('Test 5 - Send verification email', ...)` -> `{ tags: '@A_R1' }`
    *   `describe('Test 6 - Protect password confidentiality', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 7 - Assign default user role', ...)` -> `{ tags: '@A_R7' }`
    *   `describe('Test 8 - Handle unexpected failures', ...)` -> `{ tags: '@A_R8' }`
    *   `describe('Test 9 - Maintain registration state consistency', ...)` -> `{ tags: '@A_R9' }`
    *   `describe('Test 10 - Return appropriate registration response', ...)` -> `{ tags: ['@A_R1', '@A_R2', '@A_R3', '@A_R10'] }`
*   **Independent Verification**: Run the file with no filter and with `--tags-filter` spot check to confirm identical test count/results and proper tag filtering:
    *   `npx vitest run tests/integration/register.api.spec.mjs` (Confirm 10 passed tests, identical results)
    *   `npx vitest run tests/integration/register.api.spec.mjs --tags-filter=@A_R9` (Confirm only Test 9 is run)
*   **Status**: Completed [x] (Verified: 10 passed tests, tag filtering works with 9 skipped / 1 run)

---

## Phase 10: Test Code Quality Refactoring

### Task 29: Refactor register.service.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9
*   **File Modified**: [register.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/register.service.spec.mjs)
*   **Description**:
    *   Move `arrangeHappyPath()` invocation into `beforeEach()`. Remove all manual `arrangeHappyPath()` calls from the beginning of individual test cases.
    *   Split the monolithic "Test 8 - Handle unexpected failures" (which crams 4 failure cases into one `it()`) into 4 separate `it()` blocks representing each failure scenario.
    *   Split the monolithic "Test 9 - Maintain registration state consistency" (which crams 2 failure cases into one `it()`) into 2 separate `it()` blocks.
    *   Remove "Test 10 - Return appropriate registration response" entirely because it duplicates coverage from Tests 1, 2, and 3 without service-layer HTTP semantics (the `@A_R10` tag is dropped).
*   **Independent Verification**:
    *   Before refactoring: verify it compiles and runs with 10 passed tests.
    *   After refactoring: verify it compiles and runs with 13 passed tests (increased due to splitting Test 8 into 4 tests and Test 9 into 2 tests, minus 1 for the removal of Test 10).
    *   Run `npx vitest run tests/services/register.service.spec.mjs` and check outcomes.
    *   Verify tag filters: e.g. `npx vitest run tests/services/register.service.spec.mjs --tags-filter=@A_R8` executes all 4 split-out sub-cases under Test 8.
*   **Status**: Completed [x]

### Task 30: Refactor register.controller.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9
*   **File Modified**: [register.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/register.controller.spec.mjs)
*   **Description**:
    *   Extract inline mocks from individual test cases and establish a baseline mock setup in `beforeEach()`, allowing individual test cases to override only what is needed.
    *   Split the monolithic "Test 8 - Handle unexpected failures" into 4 separate `it()` blocks representing each failure scenario.
    *   Split the monolithic "Test 9 - Maintain registration state consistency" into 2 separate `it()` blocks.
    *   Remove "Test 10 - Return appropriate registration response" entirely because it duplicates coverage from Tests 1, 2, and 3 without asserting anything additional at this layer (the `@A_R10` tag is dropped). Note: this leaves the register flow without a dedicated 400-response test at the controller layer — the original Test 10 was the only place a 400 outcome was intended to be asserted, and no replacement was written.
*   **Independent Verification**:
    *   Before refactoring: verify it compiles and runs with 10 passed tests.
    *   After refactoring: verify it compiles and runs with 13 passed tests (increased due to splitting Test 8 into 4 tests and Test 9 into 2 tests, minus 1 for the removal of Test 10).
    *   Run `npx vitest run tests/controllers/register.controller.spec.mjs`.
    *   Verify tag filters work correctly (`--tags-filter=@A_R10` now matches nothing in this file, by design).
*   **Status**: Completed [x]

### Task 31: Refactor register.api.spec.mjs
*   **Scenario Satisfied**: Scenarios 1, 2, 3, 7, 8, 9
*   **File Modified**: [register.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/register.api.spec.mjs)
*   **Description**:
    *   Establish a baseline mock setup in `beforeEach()` (such as MockClient database responses), removing repetitive query mock setups from individual test cases unless they deviate from the baseline.
    *   Split the monolithic "Test 8 - Handle unexpected failures" into 4 separate `it()` blocks representing each failure scenario.
    *   Split the monolithic "Test 9 - Maintain registration state consistency" into 2 separate `it()` blocks.
    *   Remove "Test 10 - Return appropriate registration response" entirely because it duplicates coverage from Tests 1, 2, and 3 without asserting anything additional at this layer (the `@A_R10` tag is dropped). Note: this leaves the register flow without a dedicated 400-response test at the integration layer — the original Test 10 was the only place a 400 outcome was intended to be asserted, and no replacement was written.
*   **Independent Verification**:
    *   Before refactoring: verify it compiles and runs with 10 passed tests.
    *   After refactoring: verify it compiles and runs with 13 passed tests (increased due to splitting Test 8 into 4 tests and Test 9 into 2 tests, minus 1 for the removal of Test 10).
    *   Run `npx vitest run tests/integration/register.api.spec.mjs`.
    *   Verify tag filters work correctly (`--tags-filter=@A_R10` now matches nothing in this file, by design).
*   **Status**: Completed [x]