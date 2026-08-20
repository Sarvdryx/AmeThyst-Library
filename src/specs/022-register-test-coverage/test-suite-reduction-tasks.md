# Tasks: Reduce Register Flow Test Count

**Input**: `src/specs/022-register-test-coverage/test-suite-reduction-plan.md`
**Prerequisites**: `test-suite-reduction-spec.md`, `test-suite-reduction-plan.md`
**Tests**: The 12 existing `test_auth_register` files. Do not add files.

This feature’s scope is test design and execution only.

---

## Phase 1 — Reduce suite to 27 tests

- [X] T001 Reduce `src/server/tests/config/googleAuth.strategy.spec.mjs` to 2 passing tests (`TC-CFG-GA-001`, `TC-CFG-GA-002`); remove `TC-CFG-GA-003`
- [X] T002 Keep `src/server/tests/controllers/register.controller.spec.mjs` at 2 passing tests; remove `TC-CTL-REG-003`
- [X] T003 Keep `src/server/tests/controllers/verifyEmail.controller.spec.mjs` at 2 passing tests; remove `TC-CTL-VE-003`
- [X] T004 Keep `src/server/tests/controllers/resendVerification.controller.spec.mjs` at 2 passing tests (`TC-CTL-RV-001`, `TC-CTL-RV-002`)
- [X] T005 Keep `src/server/tests/controllers/googleAuth.controller.spec.mjs` at 2 passing tests (`TC-CTL-GA-001`, `TC-CTL-GA-002`)
- [X] T006 Reduce `src/server/tests/integration/register.api.spec.mjs` to 2 passing tests; remove `TC-INT-REG-003`
- [X] T007 Reduce `src/server/tests/integration/verifyEmail.api.spec.mjs` to 2 passing tests; remove `TC-INT-VE-003`
- [X] T008 Reduce `src/server/tests/integration/resendVerification.api.spec.mjs` to 2 passing tests; keep `TC-INT-RV-001` and `TC-INT-RV-002` (no-pending case, formerly `TC-INT-RV-003`)
- [X] T009 Reduce `src/server/tests/integration/googleAuth.api.spec.mjs` to 2 passing tests; remove `TC-INT-GA-003`

---

## Phase 2 — Specification tests for expiration and consistency

- [X] T010 Write `TC-SRV-REG-002` in `src/server/tests/services/register.service.spec.mjs` for `FR-EXP-01` (exact-now pending expiration)
- [X] T011 Write `TC-SRV-REG-003` in `src/server/tests/services/register.service.spec.mjs` for `FR-CON-01` (initial verification delivery consistency)
- [X] T012 Write `TC-SRV-VE-002` in `src/server/tests/services/verifyEmail.service.spec.mjs` for `FR-EXP-02` (exact-now token expiration)
- [X] T013 Write `TC-SRV-RV-003` in `src/server/tests/services/resendVerification.service.spec.mjs` for `FR-CON-02` (resend delivery consistency)
- [X] T014 Keep `TC-SRV-REG-001`, `TC-SRV-VE-001`, `TC-SRV-VE-003`, `TC-SRV-RV-001`, and `TC-SRV-RV-002` as passing tests in the three service files

---

## Phase 3 — Verify execution results

- [X] T015 Run `npm run test:auth:register` from `src/server` and record the execution result (27 executed tests; latest run 23 passed, 4 failed)
- [X] T016 Confirm the only Fail results are `TC-SRV-REG-002`, `TC-SRV-REG-003`, `TC-SRV-VE-002`, `TC-SRV-RV-003`
- [X] T017 Record expected vs observed behavior for each Fail result in `test-suite-reduction-plan.md`
- [X] T018 Map Fail results to `FR-EXP-01`, `FR-CON-01`, `FR-EXP-02`, and `FR-CON-02` in `test-suite-reduction-spec.md` and `test-suite-reduction-plan.md`
- [X] T019 Confirm no `it.skip`, `it.todo`, `test.fails`, or `it.each` in the 12 files
- [X] T020 Confirm unique test IDs and `@A_R1`–`@A_R10` mapping
- [X] T021 Confirm no false 429, no new test files, no production/package/`vitest.config.mjs` changes
- [X] T022 Run `git diff --check`

---

## Notes

- Working directory for Vitest: `src/server`
- Official project script: `npm run test:auth:register`
- Do not modify `src/server/vitest.config.mjs`
- Do not create fragmented replacement test files
- Do not modify production source
- Do not modify or replace the existing `spec.md`, `plan.md`, or `tasks.md`
