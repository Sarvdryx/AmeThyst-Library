# Test Documentation & Scenario Tagging Guidelines

## Overview

To support execution of tests targeted by business scenarios, the backend test suite is organized in two complementary layers:

1. **Vitest projects** — one project per feature, grouped by a shared name prefix (e.g. `test_auth_*` for everything under the Auth feature).
2. **Scenario tags** — metadata (`@A_R1`–`@A_R10`, etc.) applied to `describe()` blocks, mapping tests to unified business requirements regardless of which file they live in.

This enables selective, developer-level execution: by feature, by sub-feature, or by business scenario.

---

## 1. Feature / Project Structure

Each feature has its own Vitest project defined in `vitest.config.mjs`, named with a shared prefix so it can be run individually or as a group:

| Project name           | Feature       | Status      |
| ----------------------- | ------------- | ----------- |
| `test_auth_register`    | Registration  | Active      |
| `test_auth_login`       | Login         | Planned     |

Running `--project "test_auth*"` executes every project whose name starts with `test_auth`, so adding a new sub-feature (e.g. `test_auth_login`) automatically joins the group — no script changes needed.

---

## 2. Business Scenarios Mapping (Registration — @A_R1–@A_R10)

The `test_auth_register` project validates 10 unified business scenarios across the registration and account-creation journey:

* **@A_R1**: Successful End-to-End Registration (Register → Verify → JWT Issued)
* **@A_R2**: Reject Duplicate Email Across Entry Points
* **@A_R3**: Pending-Registration and Verification-Token TTL Lifecycle
* **@A_R4**: Resend Verification Email (TTL Refresh & Re-use)
* **@A_R5**: Google OAuth First-Time Sign-In (Auto-Provisioning)
* **@A_R6**: Google OAuth Returning User
* **@A_R7**: Security and Data-Shape Invariants Across All Flows (Bcrypt rounds, JWT Payload, Mapped User DTO)
* **@A_R8**: Infrastructure Failure Handling (Database, SMTP Mailer, Passport errors)
* **@A_R9**: Transactional Consistency & Boundaries (and documented transactional absence in Google OAuth)
* **@A_R10**: HTTP Response and Redirect Matrix Mapping

> When a new feature project is added (e.g. `test_auth_login`), its scenarios should follow the same naming convention with a distinct prefix (e.g. `@A_L1`–`@A_Lx`) and be documented in a new section below.

---

## 3. Code Tagging Convention

Tags are applied to level-2 `describe()` blocks using the `tags` property inside the options argument, matching the native Vitest 4.1+ tagging API:

### Singular Scenario Tag
```javascript
describe('Test 2 - Google OAuth returning user', { tags: '@A_R6' }, () => {
  // ...
});
```

### Multiple Scenario Tags
```javascript
describe('Test 1 - Google OAuth first-time sign-in (Auto-provisioning)', { tags: ['@A_R5', '@A_R7'] }, () => {
  // ...
});
```

Every tag used in test files must also be declared in the corresponding project's `tags` array in `vitest.config.mjs` (name + description). `strictTags: false` is set at both the root and project level, so undeclared tags will not throw — but declaring them keeps `--list-tags` accurate and self-documenting.

---

## 4. Test Execution & Filter Commands

Run all command-line operations from the `src/server` directory.

### Run the Entire Test Suite (all projects)
```bash
npm test
```
or:
```bash
npx vitest run
```

### Run All Tests for the Auth Feature Group
```bash
npm run test:auth
```
Equivalent to:
```bash
npx vitest run --project "test_auth*"
```

### Run Tests for a Single Sub-Feature (e.g. Registration only)
```bash
npm run test:auth:register
```
Equivalent to:
```bash
npx vitest run --project test_auth_register
```

### Run Tests Filtered by a Single Scenario Tag
```bash
npm run test:auth:tag -- "@A_R1"
```
Equivalent to:
```bash
npx vitest run --project "test_auth*" --tags-filter=@A_R1
```

### Run Tests Filtered by Multiple Scenarios (Boolean Expression)
```bash
npm run test:auth:tag -- "@A_R1 and @A_R10"
```
Vitest's tag filter expressions support `and`, `or`, `not` (or `&&`, `||`, `!`) for combining tags.

### Watch Mode / Vitest UI
```bash
npm run test:auth:watch          # watch mode, auth group
npm run test:auth:ui             # UI, auth group
npm run test:auth:register:watch # watch mode, register only
npm run test:auth:register:ui    # UI, register only
```

### List Registered Tags
```bash
npx vitest run --list-tags
```