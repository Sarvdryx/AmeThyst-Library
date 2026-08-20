# Technical Plan: Production Reliability

## 1. Context and Approach
This plan addresses the three core challenges documented in the unified specification (032-production-reliability): client build failures linked to authentication paths, email delivery failures in restricted deployment environments, and the divergence of persistent cross-device notifications.

We implement the smallest, safest corrections to resolve build blockers, standardizing around the `USER_SUSPENDED` error response for suspended accounts. We use the Brevo transactional-email HTTPS API, ensuring failed registration handoffs leave a recoverable unverified user. Finally, we implement a per-user fan-out persistent notifications table in PostgreSQL to replace volatile browser-local state.

## 2. Technical Steps

### Step 1: Foundational Client & Build Repair
- **File:** `src/client/app/providers/AuthProvider.tsx`
  - *Action:* Fix the syntax error near line 58. Replace `else {` with `} else {`.
- **File:** `src/client/app/login/page.tsx`
  - *Action:* Delete the duplicated floating component code (lines 102 to 170) outside of `LoginPage`.
- **Validation:** Run `npm run build` in the `src/client` directory to confirm the blockers are removed. Use strictly standard validation commands (no suppressed rules).

### Step 2: Database Migration for Notifications & Verification
- **File:** `src/database/init_db/postgres/08_notifications.sql` (Create new)
  - *Action:* Define the `notifications` table per the data model, including a `uuid` primary key, `uuid` user foreign key, `category`, `source_ref_id`, `payload` JSONB, `is_read` boolean, and `created_at`. Add indexes for `(user_id, created_at DESC)` and unique constraints on `(user_id, category, source_ref_id)`.
  - *Note:* If running in existing environments, this SQL must be manually executed or appended to existing initialization workflows.

### Step 3: Suspended-Account Design
- **Files:** `src/server/src/controllers/auth.controllers.mjs` (and any related API controllers)
  - *Action:* Ensure `USER_SUSPENDED` structured error code is returned when querying `req.user.status === 'suspended'`.
- **Files:** `src/server/src/socket` (Socket event emitting)
  - *Action:* When an admin suspends a user, broadcast `account:suspended` via `io.to(userRoom)`. Implement a minimal delay (e.g., 500ms) before manually disconnecting the active socket objects.
- **Files:** `src/client/app/providers/AuthProvider.tsx`, `src/client/utils/apiClient.ts`
  - *Action:* Ensure fetch interceptors globally dispatch an `account-suspended` window event instead of redirect looping when encountering `USER_SUSPENDED` HTTP responses or Socket.IO events.

### Step 4: Email-Delivery Design (Recoverable Registration)
- **File:** `src/server/src/utils/mailer.mjs`
  - *Action:* Call Brevo's transactional-email API over HTTPS using `BREVO_API_KEY` and a verified `EMAIL_FROM` sender.
  - *Action:* Update the signature wrappers to remain identical where practical.
- **File:** `src/server/src/controllers/auth.controllers.mjs` (Register flow)
  - *Action:* Retain the existing `pending_users` table workflow for registrations instead of `is_verified` boolean to minimize architectural changes.
  - *Action:* If initial delivery rejects, retain the pending token and return `502 Bad Gateway`. If resend delivery rejects, restore the previous token and expiry.
  - *Action:* Login flow naturally blocks `pending_users` since they aren't in `users` yet, return a specialized payload to trigger the "Check your inbox" screen with "Resend" action.

### Step 5: Persistent Notifications
- **Files:** `src/server/src/controllers/notification.controllers.mjs`, `src/server/src/routes/notification.routes.mjs` (Create new)
  - *Action:* Implement `GET /` (full inbox fetch), `PATCH /:id/read`, `PATCH /read-all`, and `POST /migrate-local`.
  - *Action:* Secure routes so every notification query is scoped to `req.user.user_id`.
- **Files:** `src/server/src/socket` (Integration)
  - *Action:* In the study group service, replace local realtime-only notifications with an insert into the `notifications` DB table. Then emit `notification:new` with the saved payload.
- **Files:** `src/client/app/components` (Notification UI hook)
  - *Action:* Fetch from the API on mount to capture offline events. Listen to socket `notification:new` and `notification:read` for live sync. Send API PATCH requests instead of storing to `localStorage`.

## 3. Verification Plan
- **Automated Tests:** Execute `npm run test` on server and client. Ensure authentication/registration tests still pass while mocking the send function or `fetch` at the test boundary.
- **Manual Verification:**
  - Create a new account with the server offline or email failing to confirm unverified login gating ("Check your inbox").
  - Suspend a user from an admin panel and confirm all their open browser tabs display the modal instantly without looping.
  - Publish an announcement while a test user is offline, log them in, and confirm the notification appears in their inbox. Mark it read on Mobile, and confirm Desktop syncs within 3 seconds.
