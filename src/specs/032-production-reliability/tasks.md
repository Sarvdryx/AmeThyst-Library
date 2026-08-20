# Tasks: Production Reliability

## Phase 1 — Setup and verification
- [x] T001 [P] Inspect repository state and confirm verified paths for auth, email, and notifications.
- [x] T002 [P] Establish baseline test failures and build status without modifying source code (`npm run build` in `src/client`).

## Phase 2 — Foundational build repair
- [x] T003 Correct syntax error at `else {` in `src/client/app/providers/AuthProvider.tsx`.
- [x] T004 Remove dead duplicated floating component code in `src/client/app/login/page.tsx`.
- [x] T005 Run the supported client build (`npm run build`) and validation commands to verify build success and preserved authentication behavior.
- [x] **CHECKPOINT:** Foundational build repaired. The client builds successfully.

## Phase 3 — US1: Suspended-account reliability
- [x] T006 [US1] Define shared `USER_SUSPENDED` structured error response in `src/server/src/controllers/auth.controllers.mjs` and related API controllers.
- [x] T007 [US1] Emit `account:suspended` via `io.to(userRoom)` in `src/server/src/config/socket.mjs` with bounded delay before forced disconnection.
- [x] T008 [US1] Update `src/client/app/providers/AuthProvider.tsx` to handle `USER_SUSPENDED` responses without redirect loops.
- [x] T009 [US1] Update `src/client/app/utils/apiClient.ts` to cleanly dispatch the `account-suspended` window event.
- [x] T010 [US1] Update unit, integration, and manual testing coverage for active, idle, reload, reconnect, and login paths to ensure consistent modal presentation.
- [x] **CHECKPOINT:** Complete US1 suspended-account behavior. Suspending an account reliably forces immediate, safe client disconnections globally without loops.

## Phase 4 — US2: Reliable email delivery
- [x] T011 [US2] Use the Brevo transactional-email HTTPS API as the sole runtime delivery provider.
- [x] T012 [US2] Fail fast if `BREVO_API_KEY` or `EMAIL_FROM` is missing.
- [x] T013 [US2] Update `src/server/src/controllers/auth.controllers.mjs` registration flow to commit to the `pending_users` table before initiating email delivery, instead of using an `is_verified` boolean.
  - Evidence: `auth.services.mjs` persists through `pending_users` before email delivery; delivery failure retains that row and returns `502`. Failed resend delivery restores the prior token and expiry.
- [x] T014 [US2] Update login flow to safely gate access for pending users, presenting the "Check your inbox" screen.
  - Evidence: `loginUser()` throws `USER_UNVERIFIED` for a matching pending account, and `login/page.tsx` handles that code by opening the "Check your inbox" flow.
- [x] T015 [US2] Ensure all password recovery paths in `auth.controllers.mjs` preserve anti-enumeration behavior, logging securely without leaking credentials on failure.
- [x] T016 [US2] Verify verification, resend, password recovery, study-group email, and administrator invitation flows by mocking the mail send function in tests.
- [x] **CHECKPOINT:** Complete US2 production-compatible Brevo delivery. Email failures no longer lock user registration unrecoverably.

## Phase 5 — US3: Persistent cross-device notifications
- [x] T017 [US3] Create database migration script at `src/database/init_db/postgres/08_notifications.sql` to define the `notifications` table idempotently.
- [x] T018 [US3] Implement server-side model access and services for inbox operations, ensuring cross-user data isolation.
- [x] T019 [US3] Implement `GET /`, `PATCH /:id/read`, `PATCH /read-all`, and `POST /migrate-local` in `src/server/src/controllers/notification.controllers.mjs` and wire to `src/server/src/routes/notification.routes.mjs` (creating the routes file).
- [x] T020 [US3] Update `src/server/src/config/socket.mjs` to emit `notification:new` and `notification:read` events alongside database persistence.
- [x] T021 [US3] Refactor `src/client/app/components/molecules/NotificationBell.tsx` and `src/client/app/components/molecules/NotificationDropdownPanel.tsx` to read from the API instead of `localStorage`.
- [x] T022 [US3] Implement local-state migration on client mount, posting valid source references to the server before clearing browser storage.
- [ ] T023 [US3] Verify correct read-state parity across devices (desktop/mobile sync), retry idempotency, and offline retrieval.
- [ ] **CHECKPOINT:** Complete US3 cross-device notifications. Unread states synchronize across clients and offline notifications persist.

## Phase 6 — Final integration and regression
- [ ] T024 Run the complete supported test suite (`npm run test`) and `npm run build` on both client and server.
- [ ] T025 Execute `src/specs/032-production-reliability/quickstart.md` manually to confirm deployment requirements and Brevo failure behavior.
- [ ] T026 Verify all FRs, SCs, acceptance scenarios, localization, accessibility, and themes remain fully intact.
- [ ] T027 Document deployment environment variables without logging secrets.

## Overview
- **Dependency Graph:** Phase 1 -> Phase 2 -> Phase 3 (US1) -> Phase 4 (US2) -> Phase 5 (US3) -> Phase 6.
- **User-story completion order:** US1, US2, US3.
- **Parallel execution opportunities:** After Phase 2, US1 and US2 can run independently. The database creation for US3 can also be initiated early.
- **MVP definition:** Phase 1, Phase 2, Phase 3 (US1), Phase 4 (US2). US3 is conditionally deployed post-MVP.
- **Rollback considerations:** Drop `notifications` table if US3 fails. For email troubleshooting, mock the send boundary in tests without changing runtime delivery code.
- **Exact manual verification checkpoints:** End of Phase 2 (build runs), End of Phase 3 (admin suspends active user across two tabs), End of Phase 4 (register fails gracefully to Check Inbox), End of Phase 5 (multi-device read-sync).
