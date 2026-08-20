# Data Model: Authorization & Role Management

**Date**: 2026-08-07 | **Feature**: [spec.md](spec.md) | **Research**: [research.md](research.md)

All tables and columns reference the actual schema under `database/init_db/postgres` (`04_datauser.sql`, `05_init_rest.sql`). Two additive columns are proposed; they are the only schema changes required by this feature.

---

## Entities

### User Account — `public.users` (existing, +2 columns)

| Column | Type | Notes |
|---|---|---|
| `user_id` | uuid PK | Default `gen_random_uuid()` |
| `branch_id` | int4 FK → `branches.branch_id` | Nullable |
| `email` | varchar(255) UNIQUE | Used for lookup and admin invites |
| `password_hash` | varchar(255) | bcrypt (SALT_ROUNDS=10) |
| `username` | varchar(100) | Display name |
| `role` | varchar(20) | `admin` \| `librarian` \| `user` (CHECK `chk_role`) |
| `status` | varchar(20) | `active` \| `suspended` (CHECK `chk_status`) |
| `suspended_reason` | text | Required when status = `suspended` |
| `avatar` | varchar(2048) | Display in account table |
| **`token_version`** | **int NOT NULL DEFAULT 0** | **NEW.** Incremented on demotion; embedded in JWT; mismatch → token rejected |
| **`must_change_password`** | **boolean NOT NULL DEFAULT false** | **NEW.** Set on admin invite; forces password change on first login |

**Role change matrix (allowed transitions):**

| From | To | Guardrails |
|---|---|---|
| `user` | `librarian` | Active status; no unreturned books; no unpaid fines |
| `user` | `admin` | Same as above + sudo re-auth |
| `librarian` | `admin` | Active status + sudo re-auth |
| `librarian` | `user` | Token invalidation |
| `admin` | `librarian` | Sudo re-auth; not self; not last admin; token invalidation |
| `admin` | `user` | Sudo re-auth; not self; not last admin; token invalidation |

---

### Authorization History — `public.authorize_history` (existing, unchanged)

| Column | Type | Notes |
|---|---|---|
| `authorize_id` | uuid PK | Default `gen_random_uuid()` |
| `modified_at` | timestamp | Default `CURRENT_TIMESTAMP`; audit timestamp |
| `modified_by` | uuid FK → `users.user_id` | Acting admin |
| `modified_to` | uuid FK → `users.user_id` | Affected account |

Canonical audit row written for every role change.

---

### Admin Audit Detail — `public.admin_audit_logs` (existing, reused)

| Column | Type | Notes |
|---|---|---|
| `log_id` | uuid PK | Default `gen_random_uuid()` |
| `actor_id` | uuid FK → `users.user_id` | Acting admin |
| `target_id` | uuid FK → `users.user_id` | Affected account |
| `action` | varchar(50) | `PROMOTE` \| `DEMOTE` \| `ADMIN_INVITE` |
| `prev_value` | text | Previous role (e.g., `user`) |
| `new_value` | text | New role (e.g., `librarian`) |
| `reason` | text | Optional reason / guardrail note |
| `created_at` | timestamp | Default `CURRENT_TIMESTAMP` |

Provides the "USER → LIBRARIAN" transition shown in the history UI.

---

### Supporting entities (read-only references)

- **Borrow Record — `public.borrow_book`**: `user_id`, `status` (`reserved` \| `pending` \| `borrowed` \| `pending_return`). Active statuses indicate unreturned books → block promotion.
- **Penalty Record — `public.book_penalty`**: `user_id`, `issue` (`overdue` \| `damaged` \| `lost` \| `combined`), `is_paid` (boolean). Unpaid rows indicate outstanding fines → block promotion.
- **Library Branch — `public.branches`**: `branch_id`, `name`, `name_short`, `address`, `contact`. Shown in the account table; optionally assigned when demoting an admin to `librarian`.

---

## State Transitions

### Promotion (`user`/`librarian` → `librarian`/`admin`)
1. Guard: target `status = 'active'`.
2. Guard: if target role is `user`, no `borrow_book` rows with active status AND no `book_penalty` rows with `is_paid = false`.
3. Guard (→ `admin`): acting admin sudo password verified.
4. Guard: target is not the acting admin.
5. Transaction: `UPDATE users SET role = <target> WHERE user_id = <target>`; insert `authorize_history` + `admin_audit_logs`.
6. Emit `authorization:changed`.

### Demotion (`librarian`/`admin` → `user`/`librarian`)
1. Guard: target `status = 'active'`.
2. Guard (→ from `admin`): acting admin sudo password verified.
3. Guard: target is not the acting admin.
4. Guard (→ from `admin`): active admin count > 1 (checked inside locked transaction).
5. Transaction: `UPDATE users SET role = <target>, token_version = token_version + 1 WHERE user_id = <target>`; insert `authorize_history` + `admin_audit_logs`.
6. Result: all previously issued tokens rejected on next request (D1).
7. Emit `authorization:changed`.

### Admin invite (email)
1. Guard: email not present in `users`.
2. Guard: acting admin sudo password verified.
3. Transaction: insert `users` row (`role='admin'`, `status='active'`, `must_change_password=true`) + `authorize_history` + `admin_audit_logs` (`ADMIN_INVITE`).
4. Send temporary-password email; if delivery fails, roll back the transaction and return an error (no partial account).
5. Emit `authorization:changed`.

### First login after invite
1. Login succeeds; response includes `mustChangePassword: true`.
2. All guarded endpoints (except password change) return `MUST_CHANGE_PASSWORD`.
3. After `PUT /user/profile/password`, clear `must_change_password = false`.

---

## Validation Rules (mapped from FRs)

- **FR-002**: role change requires `users.status = 'active'`.
- **FR-003**: promotion requires `NOT EXISTS` active `borrow_book` and `NOT EXISTS` unpaid `book_penalty`.
- **FR-008**: `modified_by <> modified_to` for role changes.
- **FR-009**: `COUNT(users WHERE role='admin' AND status='active') > 1` before demoting an admin.
- **FR-010**: sudo password = bcrypt match on acting admin's `password_hash`.
- **FR-011**: every mutation inserts into `authorize_history` (+ `admin_audit_logs`) in the same transaction.
