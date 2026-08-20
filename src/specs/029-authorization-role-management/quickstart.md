# Quickstart: Authorization & Role Management

**Date**: 2026-08-07 | **Feature**: [spec.md](spec.md) | **Contracts**: [authorization-management-api.md](contracts/authorization-management-api.md) | **Data Model**: [data-model.md](data-model.md)

This guide is a validation/run guide for proving the feature works end-to-end. Implementation details live in `tasks.md` / the implementation phase.

---

## Prerequisites

- PostgreSQL running with the schema from `database/init_db/postgres` (tables `users`, `authorize_history`, `admin_audit_logs`, `borrow_book`, `book_penalty`, `branches`).
- Apply the two additive migrations:
  1. `ALTER TABLE public.users ADD COLUMN token_version integer NOT NULL DEFAULT 0;`
  2. `ALTER TABLE public.users ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;`
- Backend `.env` configured (`DATABASE_URL`, `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`, `CLIENT_URL`, `PORT=5000`).
- Frontend `.env.local` configured with `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- Seed accounts (from `04_datauser.sql`): an `admin` (`admin.library@gmail.com`), two `librarian`s, plus at least one `user` for testing promotion.

---

## Setup

```bash
# backend
cd server
npm install
npm run dev        # http://localhost:5000

# frontend
cd client
npm install
npm run dev        # http://localhost:3000
```

---

## Validation Scenarios

### Scenario 1 — Admin-only access (FR-001, SC-004)

1. Sign in as the seed admin; open `/dashboard/admin/authorization`. Expect the Role Management and Authorization History panels to render within 2 seconds.
2. Sign in as a librarian and navigate to the same page. Expect a `403 FORBIDDEN` / access denied message.

### Scenario 2 — Promotion with liability guard (FR-003, SC-002)

1. Create a `user` with an active `borrow_book` record (status `borrowed`).
2. In the Role Management panel, attempt to promote them. Expect the action to be blocked with `LIABILITIES_PENDING` and an explanation in the modal.
3. Repeat with a `user` who has an unpaid `book_penalty`. Expect the same block.

### Scenario 3 — Successful promotion & audit (FR-004, FR-011, SC-006)

1. Sign in as admin; promote a clean `user` to `librarian`.
2. Expect a success toast, the row's role badge to update to `librarian`, and a new entry in the Authorization History panel showing `user → librarian` within 2 seconds (no page reload).

### Scenario 4 — Demotion terminates access immediately (FR-005, FR-013, SC-003)

1. Sign in as the admin in one tab; sign in as a `librarian` in another.
2. Demote the librarian to `user`.
3. In the librarian tab, call any librarian-only endpoint (e.g., a book-management API) with their old token. Expect `401 INVALID_TOKEN`, forcing re-login.

### Scenario 5 — Last-admin & self-action protection (FR-008, FR-009, SC-005)

1. Attempt to demote the admin's own account. Expect `SELF_ACTION_FORBIDDEN`.
2. Attempt to demote an admin when only one active admin exists (temporarily demote the other admins, or test on a scratch DB). Expect `LAST_ADMIN_PROTECTED`.
3. (Concurrency) Fire two simultaneous demote requests against the sole-remaining-admin scenario. Expect at most one succeeds and the other returns `LAST_ADMIN_PROTECTED` — the system never reaches zero admins.

### Scenario 6 — Sudo re-authentication (FR-010, SC-010)

1. Attempt to promote a user to `admin` with an incorrect sudo password. Expect `INVALID_CREDENTIALS` and no change.
2. Repeat with the correct password. Expect success.

### Scenario 7 — Admin invite with temporary password (FR-006, SC-008)

1. Invite `new.admin@university.edu` with a valid sudo password.
2. Expect an email containing a temporary password; the new account exists with `role=admin` and `must_change_password=true`.
3. Log in with the temporary password. Expect a forced password-change screen; after changing, all admin endpoints become accessible.
4. Invite the same email again. Expect `EMAIL_TAKEN`.

### Scenario 8 — Real-time history (FR-012/FR-019, SC-007)

1. Keep the Authorization History panel open in one tab.
2. In another tab, perform a promote, demote, and invite.
3. Expect each new entry to appear in the open panel within 2 seconds, highlighted, without reload.

---

## Expected Outcomes

- All role-change guardrails produce clear, user-friendly error messages (no silent failures, no crashes) — SC-010.
- Every role change is visible in `authorize_history` and `admin_audit_logs` — SC-006.
- The UI renders correctly on desktop, tablet, and mobile, in light and dark themes, with English and Vietnamese text — SC-011, SC-012.
