# Implementation Plan: Account Registration (Register) Flow Test Coverage (Expanded Scope)

**Branch**: `022-register-test-coverage` | **Date**: 2026-07-18
**Spec**: [/specs/022-register-test-coverage/spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/022-register-test-coverage/spec.md)

---

## 1. Production Code Refactor: Passport Testability

To achieve isolated unit testing of the Google OAuth verify logic without triggering external network calls, initializing Passport strategy setups, or importing the heavy passport configuration at runtime, we will perform a refactor in [passport.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/config/passport.mjs).

*   **Current State**: The verification logic is an anonymous inline async function:
    ```javascript
    passport.use(
      new GoogleStrategy(
        { ... },
        async (accessToken, refreshToken, profile, done) => { ... }
      )
    );
    ```
*   **Refactored State**: The verification callback is extracted into a named, exported async function:
    ```javascript
    export const googleVerifyCallback = async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const username = profile.displayName;
        const avatar = profile.photos?.[0]?.value ?? null;

        let result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (result.rows.length === 0) {
          result = await pool.query(
            `INSERT INTO users (email, username, avatar, password_hash, role)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING user_id, email, username, avatar, role`,
            [email, username, avatar, 'GOOGLE_AUTH', 'user']
          );
        }

        return done(null, result.rows[0]);
      } catch (err) {
        return done(err, null);
      }
    };
    ```
    This function is wired back into the `GoogleStrategy` initialization:
    ```javascript
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
        googleVerifyCallback
      )
    );
    ```
*   **Scope & Safety**: This is a pure refactor. No business logic or SQL queries are changed. It enables unit testing in [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) by passing mock dependencies.

---

## 2. Test Architecture & Directory Structure

To cover the expanded registration journey, we will implement 9 new test files alongside the existing 3 passing register test files:

```text
src/server/
├── src/
│   └── config/
│       └── passport.mjs                            # Refactor: Export googleVerifyCallback
└── tests/
    ├── config/
    │   └── googleAuth.strategy.spec.mjs            # NEW: Strategy callback unit tests
    ├── controllers/
    │   ├── register.controller.spec.mjs            # EXISTING: Unchanged
    │   ├── verifyEmail.controller.spec.mjs         # NEW: verifyEmailHandler unit tests
    │   ├── resendVerification.controller.spec.mjs  # NEW: resendVerification unit tests
    │   └── googleAuth.controller.spec.mjs          # NEW: googleCallback controller tests
    ├── services/
    │   ├── register.service.spec.mjs               # EXISTING: Unchanged
    │   ├── verifyEmail.service.spec.mjs            # NEW: verifyEmail service unit tests
    │   └── resendVerification.service.spec.mjs     # NEW: resendVerification service unit tests
    └── integration/
        ├── register.api.spec.mjs                   # EXISTING: Unchanged
        ├── verifyEmail.api.spec.mjs                # NEW: verify-email API tests
        ├── resendVerification.api.spec.mjs         # NEW: resend-verification API tests
        └── googleAuth.api.spec.mjs                 # NEW: Google OAuth redirection API tests
```

---

## 3. Scenario-to-Layer Coverage Matrix

Not all scenarios are observable at every layer. The following matrix shows where each of the 10 unified scenarios is tested and asserted:

| Scenario | Service Layer Tests | Controller Layer Tests | Strategy Layer Tests | Integration Layer Tests |
| :--- | :--- | :--- | :--- | :--- |
| **S1: Success End-to-End** | [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs) | [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs) | N/A | [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) |
| **S2: Reject Duplicate Email** | [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs) | [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs) | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) |
| **S3: Token TTL Lifecycle** | [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs) | [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs) | N/A | [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) |
| **S4: Resend Verification** | [resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs) | [resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs) | N/A | [resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs) |
| **S5: Google First-time Sign-in** | N/A | [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs) | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs) |
| **S6: Google Returning User** | N/A | [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs) | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs) |
| **S7: Invariants (Hash/JWT/Role)** | [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs) | [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs) | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs) |
| **S8: Infrastructure Failures** | verify/resend services | verify/resend controllers | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | verify/resend/google APIs |
| **S9: Transaction Boundaries** | verify/resend services | N/A | [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs) | verify/resend/google APIs |
| **S10: HTTP Response/Redirect** | N/A | All controllers | N/A | All API integration files |

*Note: Existing tests for `POST /auth/register` (S1, S2, S3, S7, S8, S9) remain active and validated within the pre-existing files. S10 (HTTP Response/Redirect) is intentionally not separately tagged for register: see §7 — the dedicated `Test 10` block was removed at all three layers as duplicate coverage, so the register flow's HTTP status codes are asserted inline within Tests 1–4 but are not reachable via `--tags-filter=@A_R10`.*

---

## 4. Test Implementation Spec

### 4.1 Service Layer Tests
Mocking standard dependencies ([auth.models.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/models/auth.models.mjs), [authHelpers.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/utils/authHelpers.mjs), [mailer.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/utils/mailer.mjs)) with `vi.mock` at the top.

*   **[verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs)**:
    *   Verify token expiration comparisons (`new Date() > new Date(row.expired_at)`) and ensure correct deletion triggers.
    *   Test boundary condition (`time === expired_at` evaluates to valid).
    *   Verify database transaction rollbacks if user insert fails or pending deletion throws.
*   **[resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs)**:
    *   Verify that if [getPendingByEmail](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/models/auth.models.mjs#L23) returns null, an error is thrown.
    *   Ensure the existing password hash and username are reused.
    *   Assert transaction wrappers ([withTransaction](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/utils/authHelpers.mjs#L22)) wrap the replace operation.

### 4.2 Controller Layer Tests
Mocks request and response objects manually, verifying inputs, statuses, and payloads.

*   **[verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs)**:
    *   Verifies mapping of verify exceptions: missing token yields `400`, expired yields `410`, database/SQL errors yield `400`.
*   **[resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs)**:
    *   Verifies email presence validation (HTTP `400`).
    *   Verifies that "No pending" throws maps to HTTP `400`.
    *   Verifies that database/mailer failures map to HTTP `500`.
*   **[googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs)**:
    *   Mocks `req.user` with a simulated user payload.
    *   Stubs `res.redirect`. Asserts redirection string structure containing signed token and serialized URI-encoded user payload.

### 4.3 Strategy Layer Tests
*   **[googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs)**:
    *   Directly imports `googleVerifyCallback` from [passport.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/config/passport.mjs).
    *   Stubs `pool.query`.
    *   **Test 5 (First-time sign-in)**: Profile with email/displayName/photos -> verify SELECT returns empty array, verify INSERT executes with password hash `'GOOGLE_AUTH'`, role `'user'`, and inputs.
    *   **Test 6 (Returning Google user)**: Verify SELECT returns user with `'GOOGLE_AUTH'` -> returns user, no INSERT executed.
    *   **Test 7 (NFR - Password user)**: Verify SELECT returns user with standard bcrypt hash -> refuses authentication (calls done(null, false, { message: 'account_exists_with_password' })), no INSERT executed.
    *   **Test 8 (DB Query error)**: Mocks `pool.query` throw. Verifies strategy passes error to Passport's `done(err, null)`.
    *   **Test 9 (No transaction)**: Asserts query calls are made directly to connection pool rather than a transactional client.

### 4.4 API Integration Layer Tests
Using `supertest` mounting [auth.routes.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/routes/auth.routes.mjs) on a test express instance.

*   **[verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs)**:
    *   Verifies body parsing and endpoint mappings on `POST /auth/verify-email`. Mocks pool connection query behaviors.
*   **[resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs)**:
    *   Verifies `POST /auth/resend-verification` integrations, mapping mock outcomes to HTTP `200`, `400`, or `500`.
*   **[googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs)**:
    *   Mocks passport authentication middleware behavior for `/google` and `/google/callback`.
    *   Asserts redirection responses (`302 Found`) for successful authentication and authentication errors (`failureRedirect`).

---

## 5. Non-Functional Constraints

1.  **Isolation**: Absolutely zero network requests to Google or SMTP targets. Nodemailer `transporter` must be fully stubbed. Database pool queries must use mock return values.
2.  **Execution Time**: Each test execution file must execute in less than 100ms.
3.  **Stability**: All async operations must be wrapped in try/catch or await blocks to prevent unhandled promise rejections.
4.  **Preservation**: All existing tests under `tests/` must remain untouched and green.

---

## 6. Vitest Scenario Tagging Implementation Plan

To support executing tests targeted by unified business scenarios, we will implement metadata-tagging using Vitest's built-in tag features.

### 6.1 Vitest Capability Verification (Vitest 4.1.10)

Based on inspection of [package.json](file:///D:/HK3/Library/AmeThyst-Library/src/server/package.json) and checking the available CLI flags, the installed Vitest version is **4.1.10**. It genuinely supports:
*   `--tagsFilter <expression>` (or `--tags-filter`) to run only tests matching specified tags.
*   `--listTags` (or `--list-tags`) to list all available tags.
*   `--strictTags` (or `--strict-tags`) to validate tag existence (default: `true`).

### 6.2 Configuration Setup in [vitest.config.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/vitest.config.mjs)

Since `--strictTags` defaults to `true` in Vitest 4.1.10, using tags not defined in the configuration will cause the test runner to throw an error. We will modify [vitest.config.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/vitest.config.mjs) to:
*   Define the valid scenario tags `@A_R1` through `@A_R10` inside the `test.tags` configuration array, OR
*   Disable tag validation by setting `strictTags: false` in the `test` block.
*(Defining the tags `@A_R1` through `@A_R10` in `test.tags` is the recommended type-safe approach).*

### 6.3 Code Modification Approach (Amended Scope-Completion)

This amendment is a scope-completion task to bring the standard registration flow files into the Vitest tagging fold. No new configuration, dependencies, or version constraints are introduced beyond what is already documented. We will add `tags` options objects (Vitest's built-in tag key) to the level-2 `describe()` blocks of the target files listed in [spec.md](file:///D:/HK3/Library/AmeThyst-Library/src/specs/022-register-test-coverage/spec.md):
*   Add `{ tags: '@A_Rx' }` as the second argument to `describe('Test N - ...', ...)` blocks for singular scenario mappings.
*   Add `{ tags: ['@A_Rx', '@A_Ry'] }` as the second argument for multi-scenario mappings.

#### Targeted Files
1.  **Google Strategy Callback**: [googleAuth.strategy.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/config/googleAuth.strategy.spec.mjs)
2.  **Service Layer**:
    *   [verifyEmail.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/verifyEmail.service.spec.mjs)
    *   [resendVerification.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/resendVerification.service.spec.mjs)
    *   [register.service.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/services/register.service.spec.mjs) (Scope completion)
3.  **Controller Layer**:
    *   [verifyEmail.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/verifyEmail.controller.spec.mjs)
    *   [resendVerification.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/resendVerification.controller.spec.mjs)
    *   [googleAuth.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/googleAuth.controller.spec.mjs)
    *   [register.controller.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/controllers/register.controller.spec.mjs) (Scope completion)
4.  **API Integration Layer**:
    *   [verifyEmail.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/verifyEmail.api.spec.mjs)
    *   [resendVerification.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/resendVerification.api.spec.mjs)
    *   [googleAuth.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/googleAuth.api.spec.mjs)
    *   [register.api.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/integration/register.api.spec.mjs) (Scope completion)

#### Excluded Files
*   The undocumented helper test file [authHelpers.spec.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/tests/utils/authHelpers.spec.mjs) is outside the scope of Feature 022 and remains untouched.


### 6.4 Documentation Update Plan

We will update documentation (such as testing guidelines or READMEs) to explain how developers can run selective test runs using the exact syntax supported by our installed version of Vitest (4.1.10):
```bash
npx vitest run --tags-filter=@A_R5
```
*(and equivalent commands for npm scripts).*

### 6.5 Verification Plan

After implementing the changes:
1.  Run the full test suite using `npx vitest run` or `npm test` from the `src/server` directory.
2.  Confirm that all test cases (both existing and new) pass successfully with zero failures, ensuring that introducing the options metadata objects has caused no regression in test execution.

---

## 7. Test Code Quality Convention (Amended)

To eliminate code duplication and improve test failure isolation, we implement the following test code quality conventions across standard registration test suites:

*   **Shared `beforeEach` Baseline**: Standardize happy-path arrange logic by calling `arrangeHappyPath()` or setting up inline mocks once in `beforeEach()`, allowing individual test cases to override only the specific mock behaviors they need to deviate from the baseline.
*   **Failure Case Isolation**: Avoid monolithic `it()` blocks that contain sequential test scenarios separated only by inline comments. Instead, split them using descriptive separate `it()` blocks or `it.each` tables so that each validation case is independently reportable.
*   **Removal of Redundant Coverage**:
    *   Remove `Test 10 - Return appropriate registration response` from `register.service.spec.mjs`, `register.controller.spec.mjs`, and `register.api.spec.mjs` entirely, since it duplicates `Test 1`, `Test 2`, and `Test 3` coverage at every layer without asserting anything beyond what those tests already check (the `@A_R10` tag is dropped from all three files). The status-code assertions (201/409/409) already live inline in Tests 1–3; a standalone 400 case was never implemented and is not currently covered for the register flow.