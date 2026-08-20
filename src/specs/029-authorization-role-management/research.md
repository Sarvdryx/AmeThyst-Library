# Research: Authorization & Role Management

**Date**: 2026-08-07 | **Feature**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

This document records the design decisions made in Phase 0 to resolve the unknowns identified in the Technical Context. Every decision is grounded in an inspection of the existing codebase (`server/src/`, `client/app/`, `database/init_db/postgres/`).

---

## D1. Immediate Token Invalidation (Demotion)

### Decision
Add `users.token_version INT NOT NULL DEFAULT 0`. Embed the current `token_version` inside the signed JWT payload (in `utils/authHelpers.mjs` `signToken`). In `middlewares/auth.middleware.mjs` `authenticate()`, after re-reading the user row from the database, compare `decoded.token_version` with the stored value; on mismatch, reject the token as invalid (`INVALID_TOKEN`). On any demotion, increment the target's `token_version` inside the same transaction that updates the role. Extend the Socket.IO handshake middleware (`config/socket.mjs`) with the same comparison so an active socket connection is also invalidated.

### Rationale
The current system issues stateless JWTs (7-day expiry, `jsonwebtoken`) with no session store and no refresh tokens. However, `authenticate()` already re-reads the `users` row on **every** request, so adding one integer column and a comparison is a minimal, surgical change. It satisfies SC-003 literally: a demoted account's previous token is rejected on its very next request, forcing re-authentication with the restricted role.

### Alternatives considered
- **Token blacklist table**: Requires tracking every issued token `jti`; the app never stored issued tokens, so this would mean a large new infrastructure. Rejected.
- **User session table with `revoked_at`**: Clean, but the app has no persistent session concept — tokens are created ad hoc at login. Larger change than needed. Rejected.
- **Rely only on the existing per-request DB role lookup**: A demoted user's token would still authenticate (role read fresh from DB), so they would remain signed in as a lower-role account. This does not *terminate* access or force re-authentication, failing SC-003. Rejected.

---

## D2. Admin Email Invite + Temporary Password

### Decision
Add `users.must_change_password BOOLEAN NOT NULL DEFAULT false`. The invite flow:
1. Validate the email is not already in `users` (and not a suspended account).
2. Generate a strong random temporary password, hash it with `bcryptjs` (`SALT_ROUNDS = 10`).
3. `INSERT INTO users (email, password_hash, username, role='admin', status='active', must_change_password=true)` inside a transaction.
4. Send an email containing the temporary password via the existing `nodemailer` utility (`utils/mailer.mjs`, new `sendAdminInviteEmail`).
5. On login, if `must_change_password` is true, the login response flags it; the frontend routes to a forced password-change screen. The existing password-change endpoint clears the flag.
6. Backend guard: any request from an account with `must_change_password = true` (other than the password-change endpoint) is rejected so the invitee cannot proceed until they set their own password.

### Rationale
`pending_users` is reserved for the public registration + email-verification flow and would force the invitee to verify an email link before they can log in — contradicting the requirement that the invitee "logs in with the temporary password". Creating the account directly in `users` with an explicit flag reuses the existing `bcryptjs`, `nodemailer`, and change-password plumbing (`PUT /user/profile/password`), and the flag is reliable across sessions.

### Alternatives considered
- **Reuse `pending_users` with `role='admin'`**: The invitee could not log in immediately (email verification link required first). Rejected.
- **Store the temporary password in plaintext / allow indefinite use**: Insecure and unmanageable. Rejected.
- **No flag; detect "is a temp password" at login**: No reliable way to distinguish a bcrypt temp-password hash from a user-set one. Rejected.

---

## D3. Audit Trail & History Display

### Decision
Write to **both** audit tables inside the same transaction as every role change:
- `authorize_history` (`authorize_id`, `modified_at`, `modified_by`, `modified_to`) — the mandated, canonical audit of actor/target/timestamp.
- `admin_audit_logs` (`log_id`, `actor_id`, `target_id`, `action`, `prev_value`, `new_value`, `reason`, `created_at`) — the detailed record storing `action` (`PROMOTE` / `DEMOTE` / `ADMIN_INVITE`) and `prev_value`/`new_value` (old/new role) so the UI can render "USER → LIBRARIAN".

The authorization history GET endpoint reads `admin_audit_logs` (ordered `created_at DESC`) joined with actor/target user info for display.

### Rationale
`authorize_history` stores only actor, target, and timestamp — it cannot express the role transition required by the UI and by the spec's "Change (e.g., USER → LIBRARIAN)" column. `admin_audit_logs` already provides exactly the `action`/`prev_value`/`new_value` shape needed. Writing to both keeps the mandated table authoritative while reusing the existing detailed table — no schema change to either.

### Alternatives considered
- **Add `prev_role`/`new_role` columns to `authorize_history`**: Works, but duplicates the purpose of `admin_audit_logs` and adds a redundant schema change. Rejected.
- **Derive the change from the target's current role**: Loses fidelity — consecutive changes on the same account would collapse into one row and the history would be wrong. Rejected.

---

## D4. Real-Time Authorization History

### Decision
Broadcast a Socket.IO event `authorization:changed` (payload = the new history entry) after each successful role change, mirroring the existing announcement pattern (`services/announcement.services.mjs` → `getIO().emit('announcement:changed', ...)`; `config/socket.mjs` `emitUserNotification`). The frontend `AuthorizationHistoryPanel` subscribes to the event on mount and prepends new entries without a page reload. A periodic HTTP refetch (on focus) is kept as a fallback for socket reconnect gaps.

### Rationale
Socket.IO already exists and is proven in the project (announcements, notifications). It satisfies SC-007 ("new entries appear within 2 seconds without a full page reload"). The existing socket middleware authenticates via the same JWT, so only admins (or any signed-in client) receive it; non-admins ignore the event, and the page itself is admin-only.

### Alternatives considered
- **Polling every N seconds**: Simpler but does not meet "within 2 seconds without a full page reload" reliably and wastes requests. Rejected.
- **Dedicated admin-only room**: Tighter scoping, but the page is already admin-only and the codebase convention is a global `io.emit`. Not needed. Rejected for simplicity.

---

## D5. Race-Safe Last-Admin Protection

### Decision
Inside a single transaction, lock the active admin rows with `SELECT ... WHERE role='admin' AND status='active' FOR UPDATE`, count them, and if the count is ≤ 1 while the requested action demotes/removes an admin, abort with a clear error. Otherwise perform the role update (and `token_version` increment) in the same transaction. This serializes concurrent demotion attempts so the count check and the mutation cannot interleave.

### Rationale
Meets SC-005 ("100% of attempts to demote the sole remaining admin are rejected, including under concurrent attempts"). The row-level `FOR UPDATE` lock is the standard PostgreSQL idiom and requires no new infrastructure.

### Alternatives considered
- **DB constraint guaranteeing at least one admin**: Not expressible as a simple `CHECK` in PostgreSQL (subqueries not allowed in CHECK constraints). Rejected.
- **Optimistic concurrency with retry**: More moving parts for the same guarantee. Rejected.
