# Research: Production Reliability

## 1. Client Build and Dead Code
- **Finding:** The `AuthProvider.tsx` has a syntax error (`else {` instead of `} else {`) near line 58.
- **Finding:** The `login/page.tsx` file has dead component code trailing after the end of the `LoginPage` component (lines 102-170). The build fails with "Return statement is not allowed here".
- **Resolution:** Correct the syntax in `AuthProvider.tsx` and completely remove the dead code in `login/page.tsx`.

## 2. Suspended-Account Design
- **Finding:** Currently, suspensions may cause silent token changes or socket drops, and differing UI flows based on whether it happens during active use, idle, reload, or reconnect.
- **Resolution:** Use a unified `USER_SUSPENDED` structured error code for all relevant auth/api failures.
- **Resolution:** Force disconnection will be preceded by a targeted socket event `account:suspended`. We will implement a small acknowledgment delay before dropping the socket, but rely on the DB as the authoritative source. If the client misses the socket event, the next API request or page load will intercept the `USER_SUSPENDED` code.

## 3. Email-Delivery Design
- **Finding:** Direct mail transport over restricted network ports is unsuitable for the demo environment.
- **Finding:** Failed email delivery for registrations previously rolled back or left an unpredictable state.
- **Resolution:** Use the Brevo transactional-email HTTPS API as the sole runtime provider. Tests replace `fetch` or the mail send function directly.
- **Resolution:** Registration commits to the `pending_users` table *first*. If the subsequent email handoff fails, the pending token is retained, the API returns `502`, and the user can request a resend. A failed resend restores the previous token and expiry.
- **Anti-enumeration:** Verification and recovery endpoints will obscure the true state by returning generic success messages.

## 4. Persistent Notification Design
- **Finding:** No formal migration mechanism like Flyway or TypeORM exists; raw SQL scripts exist in `src/database/init_db/postgres`. The user ID is `uuid`.
- **Finding:** Current notifications (like Study Group events) are purely realtime with browser-local fallback, causing device divergence.
- **Alternative 1: Per-user fan-out:** Create a `notifications` table where every recipient gets a distinct row.
- **Alternative 2: Source entity + receipts:** Create an `events` table and a `notification_receipts` table.
- **Decision:** **Per-user fan-out (Alternative 1)**. It simplifies ownership rules and isolated read/unread tracking. A single table `notifications` (id, user_id, type, reference_id, content, is_read, created_at) provides an idempotent structure.
- **Resolution:** Add `08_notifications.sql` to `src/database/init_db/postgres` as the project-consistent migration location.
