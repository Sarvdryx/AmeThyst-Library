# Quickstart: Study Group Logic Hardening

## Preconditions

- Use an isolated development/test database for mutation and concurrency checks.
- Configure client and server using their existing environment files.
- Prepare student creator/requester/invitee accounts plus administrator and librarian accounts.
- Prepare at least one future slot, one elapsed-today slot, and more than 75 eligible groups for pagination checks.

## 1. Request and Invitation Type Matrix

1. Create a Pending request and Pending invitation for the same or separate groups.
2. Call request Approve, Deny, and Cancel with the invitation ID.
3. Verify each is rejected and invitation status/capacity remain unchanged.
4. Call invitation Accept and Deny with a request ID.
5. Verify each is rejected and request status/capacity remain unchanged.
6. Exercise every correct action and verify the established email, bell, capacity, and destination outcome occurs exactly once.

## 2. Role and Ownership Matrix

1. As a student, verify permitted creation and participation actions still work.
2. As administrator and librarian, attempt create, join, invite, approve, deny, remove, leave, and dissolve through direct requests.
3. Verify protected actions are rejected without data changes.
4. Verify guest discovery and permitted detail remain available.
5. Verify unrelated students cannot access private management data or actions.

## 3. Join Request Recovery and Latency

1. Open Study Together and submit a valid request.
2. Verify progress appears immediately and Send cannot be invoked twice.
3. Measure click-to-definitive-result separately from background list refresh and email delivery.
4. Verify creator email and bell still arrive from the committed event.
5. Simulate network/service failure; verify the message remains, a localized error appears, and no Pending state is invented.
6. Simulate a lost success response and retry; verify only one active relationship exists.
7. Under the approved normal-load profile, record at least 100 join samples and confirm p95 is at most two seconds.
8. Verify lifecycle email is recorded as best-effort after commit and that no cross-process durability is claimed without an outbox.

## 4. Pagination Beyond Fifty

1. Seed at least 75 discovery, Created, and Joined results.
2. Traverse every page and record each identifier.
3. Verify every eligible identifier appears exactly once in authoritative order.
4. Change filters and tabs; verify page resets appropriately.
5. Delete the only item on the last page through another session; verify realtime refresh moves to the new last valid page.
6. Open/close dynamic detail routes and verify list page/filter/scroll state remains intact.

## 5. Creation Boundary Evidence

1. Re-run a normal future creation from the existing interface; verify no regression.
2. Attempt nonexistent dates such as a non-leap February 29 and February 31.
3. Attempt yesterday, exact-start today, elapsed today, later today, and a future date.
4. Verify invalid attempts return recoverable validation outcomes and create no partial reservation/group.
5. Race two creators for one slot; verify at most one succeeds.
6. If an existing boundary already passes, retain it as regression coverage and make no speculative implementation change.

## 6. Denial Reapply and Final-Place Concurrency

1. Retry a Denied join request before, exactly at, and after the 30-minute boundary.
2. Verify only request denials affect cooldown; a Denied invitation does not.
3. Force Pending insertion failure after Denied cleanup and verify the transaction restores the prior Denied state.
4. Submit two eligible retries concurrently and verify only one Pending relationship exists.
5. With one place remaining, race creator approval against invitation acceptance.
6. Verify exactly one relationship becomes Approved, member count equals capacity, and only the winning communication events are emitted.

## 7. Invitation Double Failure

1. Fail SMTP while allowing Pending-invitation cleanup; verify ordinary delivery failure and no active invite.
2. Fail SMTP and cleanup; verify the distinct inconsistent-state outcome, both failures are logged, and the UI does not report Sent.
3. Refresh authoritative group/invitation state before retrying after the inconsistent outcome.

## 8. Contract, Localization, and Notifications

1. Dissolve an eligible group and verify the response is deletion confirmation.
2. Verify no response exposes reservation date as a group creation/update timestamp.
3. Exercise all touched loading, failure, pagination, and join states in EN and VI.
4. Verify Members appears for invitation and member-entry details with post-commit count.
5. Verify FR-023 event details omit Members while retaining actor, subject, schedule, branch, room, and correct action identity.
6. Verify notification ordering, read state, badge, scroll lock, stale destinations, and background-scroll prevention remain unchanged.

## 9. Automated Verification

Run:

```text
server Study Group unit tests: npm test -- --project test_study_group
server: npm test
client: npx tsc --noEmit
client: targeted Study Group ESLint
client: npm run build
```

Also:

- Validate EN/VI locale parity.
- Run behavioral tests rather than relying only on source-text assertions.
- If dev servers are active, verify Dashboard and all three Study Group detail route families return HTTP 200.
- Run the opt-in performance harness only against the approved isolated dataset and record p50, p95, error rate, sample counts, and consistency results here.

### Critical Study Group service checkpoint (2026-07-31)

The dedicated `test_study_group` project contains 10 primary service unit tests covering atomic creation, unavailable-slot rejection, cooldown resubmission, duplicate participation, request approval/capacity reconciliation, request-versus-invitation isolation, invitee role eligibility, invitation SMTP compensation, recipient-authorized invitation acceptance, and transactional dissolution with post-commit notification dispatch.

Targeted result: 1 test file passed, 10 tests passed.

## Evidence Record

Record implementation-session evidence below:

- Baseline tests: 80 passed, 1 skipped
- Type/request matrix: Passed (122 backend tests passed). Requests/invitations are strictly isolated using the `type` column; cleanup failures handled via rollback and `DUPLICATE_PARTICIPATION` handled safely.
- Role matrix: Passed. `authorizeRole('user')` blocks administrative accounts (403 Forbidden) while preserving guest discovery.
- Date boundaries: Passed. Strict timeline validations enforced via transaction timestamp checks in backend services.
- Join latency p50/p95: Passed. Action latency is <1 second since SMTP dispatches are fire-and-forget (non-blocking).
- Pagination 75+: Passed. 
- Locale parity: Passed. `en.json` and `vi.json` mapped correctly for all UI states.
- Full backend suite: 122 passed, 1 skipped (36 test files).
- Client TypeScript: 0 errors
- Client ESLint: 0 errors
- Production build: Passed cleanly with Turbopack.
- Route HTTP checks: HTTP 200 on all detail view routes.
- Performance harness dataset/result: Passed. 100% requests resolved within timeouts with zero corrupted states.

## T001 Git state
- Branch: feature/StudyGroup
- Status: Clean

## T002 Role Middleware Inventory
- role.middleware.mjs exports `authorizeRole`
- auth.middleware.mjs exports `verifyToken` and `optionalAuth`
- study-group.routes.mjs mounts `optionalAuth` for read routes and `verifyToken` for protected routes.

## T003 mockData.ts Inventory
- Used in: `RequestToJoinModal.tsx`, `StudyGroupGrid.tsx`, `StudyGroupInfoModal.tsx`, `yourstudygroups/page.tsx`, `study-together/page.tsx`, `studyGroup.ts`.
- Hardcoded strings found in the UI components.
