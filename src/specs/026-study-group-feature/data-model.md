# Data Model: Reservation-Backed Study Groups

**Source of truth**: `database/init_db/postgres/*.sql`  
**Feature**: `026-study-group-feature`

## Entity Relationship Overview

```text
users (host) 1 ─── * reserve_room * ─── 1 room_avail * ─── 1 study_room
                         │ 1
                         │
                         │ 0..1 (unique reserve_id)
                         ▼
                    study_group 1 ─── * group_request * ─── 1 users (participant)
                         │
                         └── host is created_by and is not represented by group_request
```

Every Study Group has exactly one reservation. Freely reservations have no Study Group. The host counts toward capacity but has no `group_request` row. Deleting that reservation permanently removes its linked Study Group and requests through foreign-key cascades.

## Existing Entity: `reserve_room`

| Field | Type | Rules |
|---|---|---|
| `reserve_id` | UUID | Primary key, generated |
| `user_id` | UUID | Required FK to `users.user_id`; must equal `study_group.created_by` |
| `avail_id` | Integer | Required FK to `room_avail.avail_id` |
| `start_date` | Date | Required; must be a valid reservable date |
| `checkin_time` | Timestamp | Existing optional field |
| `pin` | Varchar(10) | Existing optional field |
| `expired_at` | Timestamp | Existing optional field |
| `status` | Varchar(20) | `pending`, `reserved`, or `used`; default `reserved` |

### Constraints and indexes

- PK: `reserve_id`.
- FKs: `user_id → users`, `avail_id → room_avail`, cascading deletion as defined by the authoritative schema.
- Partial unique: `(avail_id, start_date)` where status is active (`pending`, `reserved`, `used`).
- Query index: `(user_id, start_date, status)`.
- Cancellation deletes an eligible reservation, immediately releasing its slot.

### State transitions

```text
reserved ──► pending ──► used
    │           │
    └───────────┴──────► deleted     (future eligible reservation only)
```

Existing PIN/check-in behavior may use Pending/Used; Study Group cancellation must not rewrite Used reservations.

## Existing Entity: `study_group`

| Field | Type | Rules |
|---|---|---|
| `group_id` | UUID | Primary key, generated |
| `created_by` | UUID | Required FK to host `users.user_id` |
| `reserve_id` | UUID | Required unique FK to `reserve_room.reserve_id` |
| `subject` | Varchar(30) | Required, trimmed, exactly one subject |
| `title` | Text | Required, trimmed, nonblank |
| `description` | Text | Required by feature, trimmed, nonblank |
| `requirements` | Text[] | Required ordered array of 1–5 trimmed nonblank items |
| `capacity` | Integer | Required; copied from reserved `study_room.capacity`, > 0 |
| `current_num` | Integer | Required; default 1 for host; `1 ≤ current_num ≤ capacity` while active |
| `status` | Varchar(20) | Operational workflow uses `upcoming`, `full`, `inprogress`, `completed`, `expired`. The current SQL CHECK still lists `cancelled` for legacy compatibility, but current code MUST NOT write it. |
| `created_at` | Timestamp | New, required, default current time; supports newest ordering/audit |
| `updated_at` | Timestamp | New, required, default current time; updated on metadata/lifecycle mutations |

### Constraints and indexes

- PK: `group_id`.
- FKs: `created_by → users`, `reserve_id → reserve_room`, cascading deletion as defined by the authoritative schema.
- Unique: `reserve_id` (one group per reservation).
- Checks: existing capacity/count/status checks plus requirements cardinality 1–5.
- Query index: `(created_by, status)`; reservation date/time joins supply required ordering.
- Service validates nonblank array elements and enforces host equals reservation owner.

### Effective state transitions

```text
                  capacity reached
upcoming ◄────────────────────────► full
    │                                 │
    ├──────── scheduled start ────────┤
    ▼                                 ▼
inprogress ───── scheduled end ───► completed
    
upcoming/full ── host dissolution or reservation cancellation ──► deleted by cascade
upcoming/full ── invalid/elapsed without normal session lifecycle ──► expired
```

- Stored terminal states (`completed`, `expired`) remain terminal. A legacy `cancelled` row, if present, remains read-only.
- Before mutations, effective status is recomputed from reservation date and slot times using authoritative server/database time.
- Full is derived whenever a pre-start group has `current_num = capacity`; it returns to Upcoming when a place opens.

## Existing Entity: `group_request`

| Field | Type | Rules |
|---|---|---|
| `request_id` | UUID | Primary key, generated |
| `group_id` | UUID | Required FK to `study_group.group_id` |
| `user_id` | UUID | Required FK to participant `users.user_id`; cannot equal host |
| `created_at` | Timestamp | Required submission time, default current time |
| `decided_at` | Timestamp | New nullable decision time; set on Approved/Denied transitions |
| `content` | Text | Optional existing request message; current UI limit 100 characters |
| `type` | Varchar(20) | `request` or `invite`; default `request`. Join actions create `request`; host email invitations create `invite`. |
| `status` | Varchar(20) | `pending`, `approved`, `denied`, `expired`; default `pending` |

### Constraints and indexes

- PK: `request_id`.
- FKs: `group_id → study_group`, `user_id → users`, cascading deletion as defined by the authoritative schema.
- Partial unique: `(group_id, user_id)` where status in (`pending`, `approved`).
- Query indexes: `(group_id, status)`, `(user_id, status)`, `(group_id, user_id, decided_at DESC)`.
- Multiple Denied rows are allowed as history; a new Pending row is allowed only after 30 full minutes from the most recent `decided_at` and only if no active row exists.
- A new `type=invite` row may reference only a recipient whose persisted `users.role` is `user`; librarian and admin recipients are rejected before insertion.

### State transitions

```text
pending ── host approves ──► approved
pending ── host denies ────► denied
any state ── host dissolves ─► row deleted by cascade
pending ── participant cancels ─► row removed
approved ─ participant leaves / host removes ─► row removed
pending ── lifecycle expiry ─► expired
denied ── after 30 minutes ─► new pending row (denied row retained)
```

All request and membership rows are permanently deleted on dissolution through `ON DELETE CASCADE`.

## Existing Entity: `room_avail`

| Field | Type | Rules |
|---|---|---|
| `avail_id` | Integer | Existing primary key |
| `room_id` | Integer | Existing FK to `study_room.room_id` |
| `start_time` | Time | Required by effective lifecycle and display |
| `end_time` | Time | Must be later than start time |

## Existing Entity: `study_room`

`study_room.capacity` is the only group-capacity source. Creation joins `reserve_room.avail_id → room_avail.room_id → study_room.capacity`, rejects capacity 0, and copies the positive value into `study_group.capacity`.

## Existing Entity: `users`

- `users.user_id` is the identity referenced by reservation owner, group host, and participant.
- Only authenticated role `user` may create/join/manage under this feature.
- Host profile projection uses existing `username` and `avatar`; private profile fields are not returned.

## Transaction Invariants

### Create Study Group

1. Begin transaction.
2. Validate/authenticate user and normalized metadata.
3. Insert active reservation; partial unique index resolves slot races.
4. Read room capacity through availability/room relationship and reject zero.
5. Insert group using the new reservation ID, host ID, and capacity/current count 1.
6. Commit; on any error rollback both records.

### Approve Request

1. Lock group and request.
2. Reconcile effective group status and verify host/Pending/Upcoming/capacity.
3. Conditionally update request to Approved with `decided_at`.
4. Increment count once; set Full if count reaches capacity.
5. Commit.

### Leave or Remove

1. Lock group and Approved request.
2. Verify actor and pre-start manageable state.
3. Remove membership row and decrement count once (never below host count 1).
4. Change Full to Upcoming if a place opens; commit.

### Dissolve

1. Lock group and reservation; verify host and Upcoming/Full.
2. Delete the reservation within the transaction.
3. Let `reserve_room → study_group` cascade delete the linked group.
4. Let `study_group → group_request` cascade delete every request and membership row.
5. Commit together; rollback all changes on error.

## Data Projections

- **Discovery summary**: group/reservation/room/host fields, effective status, capacity/count, current-user participation, `canJoin`, and cooldown retry time.
- **Created dashboard summary**: discovery fields plus pending count; excludes Cancelled rows and is ordered In Progress, Full, Upcoming, Completed, Expired, then scheduled start, then group ID.
- **Joined dashboard summary**: group fields plus relationship ID/type/status/timestamps; includes normal join requests and Approved invitations, excludes non-Approved invitations and groups with Cancelled lifecycle status, and is ordered Approved, Pending, Denied, then scheduled start, then relationship ID.
- **Invitations dashboard summary**: Pending `type=invite` relationships for the current recipient whose group has not been Cancelled, Completed, or Expired and whose scheduled start is still in the future. These records are actionable through Accept or Deny and are removed from this projection after either decision; Accepted records become visible through the Joined projection.
- **Detail**: summary plus requirements; host detail additionally exposes pending applicants and approved members. Non-host detail never exposes other applicants’ private request information.

## Migration/Data Audit Requirements

Before adding constraints to an existing database, detect and report:

- duplicate/null IDs;
- orphan user/room/reservation/group references;
- more than one group per reservation;
- duplicate active requests per user/group;
- duplicate active reservations per slot/date;
- invalid capacity/count/status values;
- invalid requirements arrays.

Do not silently delete or rewrite ambiguous historical records. A clean fresh initialization must create all constraints directly from the authoritative SQL files.
