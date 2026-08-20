# Data Model: Production Reliability

## 1. Auth & Suspension
No schema changes. 
- The `users` table already has `status` (active/suspended), `suspended_reason`, and `token_version`.
- We will rely on these existing columns.

## 2. Notifications

A new table `notifications` will be created to store per-user fan-out notifications. 

### Table: `notifications`

| Column | Type | Constraints | Description |
|---|---|---|---|
| `notification_id` | `uuid` | Primary Key, Default `gen_random_uuid()` | Unique identifier for the notification. |
| `user_id` | `uuid` | Foreign Key (`users.user_id`), NOT NULL | Owner of the notification. |
| `category` | `varchar(50)` | NOT NULL | Type of notification (e.g., `ANNOUNCEMENT`, `STUDY_GROUP_INVITE`). |
| `source_ref_id` | `varchar(255)` | NOT NULL | Identifies the source entity (e.g., Announcement ID or Invitation Request ID). |
| `payload` | `jsonb` | NOT NULL | Structured metadata for rendering. |
| `is_read` | `boolean` | Default `false`, NOT NULL | Read status. |
| `created_at` | `timestamp` | Default `CURRENT_TIMESTAMP`, NOT NULL | Creation timestamp. |

**Indexes & Constraints:**
- **Unique Constraint (`idx_notifications_user_source`):** `UNIQUE (user_id, category, source_ref_id)` to ensure idempotency when handling duplicates or retries.
- **Index (`idx_notifications_user_unread`):** On `(user_id, created_at DESC)` where `is_read = false` to rapidly query unread inbox status.
- **Ownership Validation:** All API queries must strictly filter by the authenticated `user_id`.

## 3. Email Delivery
No schema changes.
- Email failure will leave the pending user in the existing `pending_users` table.
- We will NOT add `is_verified` to the `users` table or change user status constraints. The `pending_users` table is the sole source of truth for unverified registrations.
