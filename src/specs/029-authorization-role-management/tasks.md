---

description: "Task list for Authorization & Role Management implementation"
---

# Tasks: Authorization & Role Management

**Input**: Design documents from `specs/029-authorization-role-management/`

**Prerequisites**: [plan.md](plan.md) (required), [spec.md](spec.md) (user stories), [research.md](research.md), [data-model.md](data-model.md), [contracts/authorization-management-api.md](contracts/authorization-management-api.md)

**Tests**: Tests are OPTIONAL and were not explicitly requested in the feature specification. No dedicated test tasks are included; end-to-end validation is covered by `quickstart.md` (final polish phase).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `server/src/...` (Express, ES Modules `.mjs`)
- **Frontend**: `client/app/...` (Next.js App Router)
- **Database**: `database/init_db/postgres/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema changes required by every user story

- [X] T001 Create database migration `database/init_db/postgres/08_authorization_migration.sql` adding `token_version integer NOT NULL DEFAULT 0` and `must_change_password boolean NOT NULL DEFAULT false` to `public.users` (exact column names per `04_datauser.sql`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token-version invalidation plumbing and the authorization module skeleton that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Embed `token_version` into the JWT payload in `signToken` (`server/src/utils/authHelpers.mjs`); include it from the user row with a default of `0` for backward compatibility
- [X] T003 [P] Compare `token_version` in `authenticate()` (`server/src/middlewares/auth.middleware.mjs`); on mismatch throw `INVALID_TOKEN` so a demoted user's previous token is rejected on its next request
- [X] T004 [P] Extend the Socket.IO handshake (`server/src/config/socket.mjs`) to compare `token_version`; add an `emitAuthorizationChanged(entry)` helper broadcasting `authorization:changed`
- [X] T005 [P] Create `server/src/routes/authorization.routes.mjs` with `verifyToken` + `authorizeRole('admin')` guarded stubs for `/users`, `/users/:userId/promote`, `/users/:userId/demote`, `/invite-admin`, `/history`; mount at `/api/authorization` in `server/src/server.mjs`
- [X] T006 Create shared service helpers in `server/src/services/authorization.services.mjs`: `assertActiveStatus` (FR-002), `verifySudoPassword` (bcrypt compare, FR-010), `writeAudit` (insert `authorize_history` + `admin_audit_logs` on the same client, FR-011), and `getActiveAdminCountForUpdate` (FOR UPDATE count for FR-009)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Promote a User to Librarian or Admin (Priority: P1) 🎯 MVP

**Goal**: An admin can list accounts and promote an active, liability-free user to `librarian` or `admin` (with sudo verification for `admin`), recording the change in the audit trail.

**Independent Test**: On the authorization tab, an admin searches for a clean active user and promotes them to librarian → success toast, role badge updates, history entry appears. A user with active borrows or unpaid fines → blocked with `LIABILITIES_PENDING`.

### Implementation for User Story 1

- [X] T007 [P] [US1] Add `listUsersForManagement` to `server/src/models/authorization.models.mjs` (search by username/email, role/status filters, pagination, liability counts from `borrow_book` + `book_penalty`, `isSelf`, `isLastAdmin`)
- [X] T008 [P] [US1] Add `promoteUser` to `server/src/services/authorization.services.mjs` (FR-002 active guard, FR-003 liability guard, sudo verify when target is `admin`, transaction: update `users.role` + `writeAudit` + emit `authorization:changed`)
- [X] T009 [US1] Add `getUsers` + `promote` controllers to `server/src/controllers/authorization.controllers.mjs` (contract: `GET /api/authorization/users`, `POST /api/authorization/users/:userId/promote`; unified `{ success, error }` shape)
- [X] T010 [US1] Create `client/app/utils/authorizationApi.ts` with `listUsers`, `promote`, `demote`, `inviteAdmin`, `getHistory` calling the backend via `NEXT_PUBLIC_API_URL` (loading/error/success handling)
- [X] T011 [P] [US1] Create `AccountTableRow` molecule in `client/app/components/molecules/AccountTableRow.tsx` (avatar, display name, email, role badge, status badge, branch, actions area)
- [X] T012 [P] [US1] Create `SudoVerifyModal` in `client/app/components/modals/SudoVerifyModal.tsx` (current-password field, error state on wrong password, FR-010)
- [X] T013 [US1] Create `RoleChangeModal` (promote variant) in `client/app/components/modals/RoleChangeModal.tsx` (target summary, target-role selector, inline liability result, embedded `SudoVerifyModal` when promoting to admin)
- [X] T014 [US1] Create `RoleManagementPanel` organism in `client/app/components/organisms/RoleManagementPanel.tsx` (toolbar with search + role/status filters + "Invite Admin" button, accounts table, pagination, loading/error/empty states, FR-014/FR-015)
- [X] T015 [US1] Replace the placeholder in `client/app/dashboard/admin/authorization/page.tsx` to render `RoleManagementPanel` (FR-014)
- [X] T016 [US1] Add `admin.authorization.*` i18n keys to `client/app/locales/en.json` and `client/app/locales/vi.json` for the role management UI

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Demote a Librarian Back to User (Priority: P1)

**Goal**: An admin can demote a librarian to `user`; the change takes effect immediately (token invalidated) and forces re-authentication.

**Independent Test**: Demote a librarian to user → role updates, their old token is rejected on its next request (`401 INVALID_TOKEN`), history shows `librarian → user`.

### Implementation for User Story 2

- [X] T017 [P] [US2] Add `demoteUser` to `server/src/services/authorization.services.mjs` (FR-002 active guard, transaction: update `users.role` + increment `users.token_version` + `writeAudit` + emit `authorization:changed`, FR-005/FR-013)
- [X] T018 [US2] Add `demote` controller to `server/src/controllers/authorization.controllers.mjs` (contract: `POST /api/authorization/users/:userId/demote`)
- [X] T019 [P] [US2] Add demote variant to `RoleChangeModal` in `client/app/components/modals/RoleChangeModal.tsx` (target-role selector, warning that all active sessions will be terminated, FR-016)
- [X] T020 [US2] Wire the LIBRARIAN row "Demote to User" action in `client/app/components/organisms/RoleManagementPanel.tsx`
- [X] T021 [US2] Add demote i18n keys to `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Add a New Administrator (Email Invite) (Priority: P1)

**Goal**: An admin can invite a new admin by email; the system creates the account with a temporary password, emails it, and forces a password change on first login.

**Independent Test**: Invite `new.admin@university.edu` with a valid sudo password → account created with `must_change_password=true`, email delivered with the temporary password, duplicate invite returns `EMAIL_TAKEN`, first login is forced to change the password.

### Implementation for User Story 3

- [X] T022 [P] [US3] Add `sendAdminInviteEmail` to `server/src/utils/mailer.mjs` (temporary-password email via existing nodemailer transporter)
- [X] T023 [US3] Add `inviteAdmin` to `server/src/services/authorization.services.mjs` (sudo verify, email-uniqueness check, transaction: insert `users` with temp bcrypt password + `role='admin'` + `must_change_password=true` + `writeAudit(ADMIN_INVITE)` + emit; roll back and return `EMAIL_SEND_FAILED` if the email cannot be delivered, FR-006/SC-008)
- [X] T024 [US3] Add `inviteAdmin` controller to `server/src/controllers/authorization.controllers.mjs` (contract: `POST /api/authorization/invite-admin`)
- [X] T025 [P] [US3] Create `InviteAdminModal` in `client/app/components/modals/InviteAdminModal.tsx` (email field, temporary-password explanation, embedded `SudoVerifyModal`, FR-018)
- [X] T026 [US3] Wire the "Invite Admin" toolbar button in `client/app/components/organisms/RoleManagementPanel.tsx`
- [X] T027 [US3] Add a `MUST_CHANGE_PASSWORD` backend guard in `server/src/middlewares/auth.middleware.mjs` (reject non-password-change requests while `must_change_password=true`) and clear the flag on successful password change in `server/src/controllers/user.controllers.mjs` / `changePassword`
- [X] T028 [US3] Add the forced password-change frontend flow (when login returns `mustChangePassword: true`, route to the password-change screen before other admin pages)
- [X] T029 [US3] Add invite i18n keys to `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: User Stories 1, 2, AND 3 should all work independently

---

## Phase 6: User Story 4 - Demote or Remove an Administrator (Priority: P1)

**Goal**: An admin can safely demote another admin to `librarian`/`user` with the mandatory guardrails (no self-action, never below one admin, sudo re-authentication).

**Independent Test**: Re-authenticated admin demotes another admin → role updates, admin endpoints blocked for the target, history shows `admin → user`. Self-demote and sole-admin demote attempts are rejected with `SELF_ACTION_FORBIDDEN` / `LAST_ADMIN_PROTECTED`, including under concurrent requests.

### Implementation for User Story 4

- [X] T030 [P] [US4] Add admin demotion guardrails to `demoteUser` in `server/src/services/authorization.services.mjs`: self-action check (FR-008), last-admin `FOR UPDATE` guard (FR-009), mandatory sudo verify (FR-010)
- [X] T031 [US4] Wire ADMIN row "Demote" menu (targets `librarian`/`user`) in `client/app/components/organisms/RoleManagementPanel.tsx`; disable actions on the self row and the last-admin row with tooltips
- [X] T032 [US4] Add admin-demote i18n keys (self/last-admin tooltips, warnings) to `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: All P1 user stories should now be independently functional

---

## Phase 7: User Story 5 - View the Authorization History Log (Priority: P2)

**Goal**: The authorization tab shows a real-time history log of every role change (actor, target, change, timestamp) with filtering.

**Independent Test**: Perform a promote/demote/invite in one tab → a new highlighted entry appears in the open history panel within 2 seconds without a page reload; filtering by change type works.

### Implementation for User Story 5

- [X] T033 [P] [US5] Add `listHistory` to `server/src/models/authorization.models.mjs` (query `admin_audit_logs` JOIN `users`, action filter, pagination)
- [X] T034 [P] [US5] Add `getHistory` to `server/src/services/authorization.services.mjs` (contract: `GET /api/authorization/history`)
- [X] T035 [US5] Add `getHistory` controller to `server/src/controllers/authorization.controllers.mjs`
- [X] T036 [P] [US5] Create `HistoryLogRow` molecule in `client/app/components/molecules/HistoryLogRow.tsx` (actor, target, change e.g. "user → librarian", timestamp)
- [X] T037 [P] [US5] Create `AuthorizationHistoryPanel` organism in `client/app/components/organisms/AuthorizationHistoryPanel.tsx` (subscribes to `authorization:changed` socket event, prepends + highlights new entries, action-type filter, loading/error/empty states, FR-019/SC-007)
- [X] T038 [US5] Render `AuthorizationHistoryPanel` in `client/app/dashboard/admin/authorization/page.tsx`
- [X] T039 [US5] Add history i18n keys to `client/app/locales/en.json` and `client/app/locales/vi.json`

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T040 [P] Run the end-to-end validation scenarios in `specs/029-authorization-role-management/quickstart.md` (all 8 scenarios: access control, liability guard, promote, immediate demotion, last-admin/self, sudo, invite+temp password, real-time history)
- [X] T041 [P] Verify light/dark theme and English/Vietnamese parity for all new UI text (design tokens, no hardcoded colors/strings)
- [X] T042 [P] Security hardening review of `/api/authorization/*` endpoints: input validation middleware, unified error shape, no role leakage in responses, admin-only enforcement
- [ ] T043 Resolve lint/typecheck in `server` (ESLint) and `client` (Next.js) and perform a final integration pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001) - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - US1 → US2 → US3 → US4 share the account list, panels, and modals but each adds its own action
  - US5 (history) only needs the audit writing (T006) and can proceed alongside US3/US4
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - no dependencies on other stories. **MVP scope**.
- **User Story 2 (P1)**: Can start after Foundational - reuses US1 panel/modals
- **User Story 3 (P1)**: Can start after Foundational - adds invite flow + first-login guard
- **User Story 4 (P1)**: Depends on US2's `demoteUser` service; reuses US1 panel
- **User Story 5 (P2)**: Can start after Foundational - independent (only needs audit writer + socket emit)

### Within Each User Story

- Models before services before controllers (backend)
- API helper (`authorizationApi.ts`) before components (frontend)
- Core implementation before integration/wiring
- Story complete before moving to the next priority

### Parallel Opportunities

- Phase 1 and all Foundational `[P]` tasks run in parallel (T002–T005)
- Within each story, tasks marked `[P]` can run in parallel (models/services, API helper, molecules, modals, i18n)
- US5 (history, P2) can be staffed in parallel with US3/US4 once Foundational is done
- i18n key tasks (T016, T021, T029, T032, T039) touch only `en.json`/`vi.json` and can run parallel to their story's component work

---

## Parallel Example: User Story 1

```bash
# Launch all parallelizable tasks for User Story 1 together:
Task: "T007 Add listUsersForManagement to server/src/models/authorization.models.mjs"
Task: "T008 Add promoteUser to server/src/services/authorization.services.mjs"
Task: "T010 Create client/app/utils/authorizationApi.ts"
Task: "T011 Create AccountTableRow molecule in client/app/components/molecules/AccountTableRow.tsx"
Task: "T012 Create SudoVerifyModal in client/app/components/modals/SudoVerifyModal.tsx"

# Then wire sequentially (T009 -> T013 -> T014 -> T015):
Task: "T009 Add getUsers + promote controllers in server/src/controllers/authorization.controllers.mjs"
Task: "T013 Create RoleChangeModal (promote variant) in client/app/components/modals/RoleChangeModal.tsx"
Task: "T014 Create RoleManagementPanel organism in client/app/components/organisms/RoleManagementPanel.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001)
2. Complete Phase 2: Foundational (T002–T006) (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (promote + account list + panel)
4. **STOP and VALIDATE**: Run quickstart Scenarios 1–3 + 6
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 (demote librarian) → Test independently → Deploy/Demo
4. Add User Story 3 (invite) → Test independently → Deploy/Demo
5. Add User Story 4 (demote admin + guardrails) → Test independently → Deploy/Demo
6. Add User Story 5 (history panel) → Test independently → Deploy/Demo

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (promote)
   - Developer B: User Story 5 (history panel — independent)
3. After US1: Developer A proceeds to US2/US3, Developer B to US4, then integrate US5 into the page

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- The account-list model (T007) returns `isSelf`/`isLastAdmin`/`liabilities` up front so US4 and the promote modal need no backend rework later
