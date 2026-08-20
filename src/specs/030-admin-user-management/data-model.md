# Database Schema & Data Models: Admin User Management

**Feature Identifier**: `030-admin-user-management`

---

## Database Schema Changes (PostgreSQL)

To support account status tracking, joined/activity timelines, and detailed administrative logging, we will apply the following modifications to the database schema.

### 1. `users` Table Modifications

We will extend the existing `users` table with status-governing columns, login tracking metrics, and creation timestamps:

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `status` | VARCHAR(20) | NOT NULL, CHECK | `'active'` | Governance state. Allowed values: `'active'`, `'suspended'` |
| `suspended_reason` | TEXT | NULL | `NULL` | Context explanation logged on account suspension. Required when `status='suspended'` |
| `last_login_at` | TIMESTAMP | NULL | `NULL` | Timestamp matching the user's last successful login transaction |
| `created_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | Joined timestamp recorded on account registration |

#### SQL Migration Script:
```sql
-- Phase 1 Migration: Modify users table structure
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS suspended_reason TEXT DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NULL;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;

-- Drop check constraint if exists and re-add to prevent duplication
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE public.users ADD CONSTRAINT chk_status CHECK (status IN ('active', 'suspended'));
```

---

### 2. `admin_audit_logs` Table Creation

A dedicated administrative audit logs table is required to track privileged mutations separately from standard user history logs:

| Column Name | Data Type | Constraints | Default Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `log_id` | UUID | PRIMARY KEY | `gen_random_uuid()` | Unique log identifier |
| `actor_id` | UUID | NOT NULL, FK | *None* | Reference to the administrator performing the action (`users.user_id`) |
| `target_id` | UUID | NOT NULL, FK | *None* | Reference to the user whose account is being modified (`users.user_id`) |
| `action` | VARCHAR(50) | NOT NULL | *None* | Type of administrative action. E.g. `'ROLE_CHANGE'`, `'ACCOUNT_SUSPENSION'`, `'ACCOUNT_UNSUSPENSION'` |
| `prev_value` | TEXT | NULL | `NULL` | The raw field value prior to the modification |
| `new_value` | TEXT | NULL | `NULL` | The raw field value after the modification |
| `reason` | TEXT | NULL | `NULL` | Reason text provided for suspensions (or other mutations) |
| `created_at` | TIMESTAMP | NOT NULL | `CURRENT_TIMESTAMP` | Log record timestamp |

#### SQL Migration Script:
```sql
-- Phase 2 Migration: Create admin_audit_logs table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    log_id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid NOT NULL,
    target_id uuid NOT NULL,
    action character varying(50) NOT NULL,
    prev_value text DEFAULT NULL,
    new_value text DEFAULT NULL,
    reason text DEFAULT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES public.users(user_id) ON DELETE RESTRICT,
    CONSTRAINT fk_audit_target FOREIGN KEY (target_id) REFERENCES public.users(user_id) ON DELETE RESTRICT
);
```

---

## Performance & Optimization Indexes

To ensure fast search autocomplete rendering, composite filtering, and page navigation across directories containing thousands of users, the following indices must be configured:

```sql
-- Composite index for admin directory search queries
CREATE INDEX IF NOT EXISTS idx_users_search_composite 
ON public.users (role, status, username, email);

-- Accent-insensitive/Case-insensitive search acceleration
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users (LOWER(email));

-- Optimized sorting index for audit lookup
CREATE INDEX IF NOT EXISTS idx_audit_logs_timeline ON public.admin_audit_logs (created_at DESC);
```

---

## Data Backfill Strategy

To prevent runtime errors in existing data rows that do not possess these fields:
1. **Assign Default Status**: Any pre-existing rows will be backfilled to possess `status = 'active'`.
2. **Backfill Timestamps**: Pre-existing rows will have their `created_at` timestamp set to the date of migration execution or a sensible historical baseline (e.g. `'2024-01-01 00:00:00'`).
3. **Audit Log Consistency**: Foreign keys on audit log relations are bounded by `ON DELETE RESTRICT` constraint rules, preventing administrators from deleting active target history records or deleting users who have audit dependencies.

```sql
-- Data Backfill Migration script
UPDATE public.users 
SET status = 'active' 
WHERE status IS NULL;

UPDATE public.users 
SET created_at = '2024-01-01 00:00:00' 
WHERE created_at IS NULL;
```

---

## Concurrency Invariants & Administrative Safeguards

### 1. Final Active Admin Safeguard
To prevent locking the database out of administrative privileges (which would happen if the only active admin demoted their own role or suspended themselves):
- Any update on role/status where the target user possesses the role `'admin'` and status `'active'` MUST run a validation count:
  ```sql
  SELECT COUNT(*) FROM public.users WHERE role = 'admin' AND status = 'active';
  ```
- If the returned count is `1`, and the transaction aims to demote (e.g. update role to `'user'`) or suspend (update status to `'suspended'`) the target admin, the transaction MUST rollback and throw a serialization error (`400 Bad Request`, code: `FINAL_ADMIN_MUTATION`).

### 2. Self-Mutation Safeguard
To enforce audit separation of duties, the system blocks administrators from modifying their own roles or toggling their own suspension states.
- The controller will assert:
  ```javascript
  if (req.user.userId === targetUserId) {
    return res.status(400).json({ error: { code: 'SELF_MUTATION_BLOCKED', message: 'You cannot change your own role or status.' } });
  }
  ```
