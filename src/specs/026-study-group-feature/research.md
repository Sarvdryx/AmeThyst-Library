# Phase 0 Research: Reservation-Backed Study Groups

**Feature**: `026-study-group-feature`  
**Date**: 2026-07-19

## 1. Creation Transaction Boundary

**Decision**: Expose one authenticated Study Group creation operation whose service transaction inserts `reserve_room` first and `study_group` second, returning both identifiers after commit.

**Rationale**: This preserves the required business sequence while preventing an observable orphan reservation or group. The current two-call client pattern cannot guarantee compensation after network/process failure.

**Alternatives considered**:

- Two public calls plus client cancellation: rejected because compensation can fail or never run.
- Create group before reservation: rejected because it violates the core invariant.
- Distributed workflow/outbox: unnecessary for one PostgreSQL database.

## 2. Cancellation and Dissolution Representation

**Decision**: Do not add `cancelled` to `reserve_room.status`. Cancel an eligible reservation by permanently deleting it. Dissolving a Study Group deletes its reservation, and the schema's `ON DELETE CASCADE` relationships delete the linked group and participation rows.

**Rationale**: The team explicitly chose not to retain cancellation history. Deletion releases the slot without introducing a status that the authoritative reservation CHECK constraint rejects.

**Alternatives considered**:

- Retain a Cancelled reservation/group: rejected because dissolved history is intentionally not stored.
- Keep `reserved` but special-case the group: creates two sources of truth and risks blocked slots.
- Use `return_room`: misrepresents a cancellation as completed room use.

## 3. Existing Schema Integrity

**Decision**: Repair the existing entities with PKs/FKs/uniques and query indexes; do not create replacement tables.

**Rationale**: The authoritative SQL defines IDs and relationship columns but omits primary/foreign keys for `reserve_room`, `study_group`, `group_request`, and `return_room`. Business invariants cannot safely depend on application checks alone.

**Alternatives considered**:

- Application-only checks: race-prone and permits invalid direct writes.
- New parallel schema: violates the requirement to reuse equivalent structures.
- Restrictive deletion: conflicts with the selected permanent-dissolution rule; use the schema's cascades.

## 4. Slot and Membership Concurrency

**Decision**: Combine partial unique indexes, transaction-local row locks, conditional updates, and conflict translation.

**Rationale**: The current check-then-insert reservation code has a race. A partial unique index on `(avail_id, start_date)` for active reservation statuses is authoritative. Approval/dissolution/member actions lock the group/request rows and update counts once.

**Alternatives considered**:

- In-memory mutex: ineffective across server processes/restarts.
- Serializable isolation for every request: broader overhead than targeted constraints/locks.
- Optimistic client checks: cannot secure capacity.

## 5. Member Count

**Decision**: Retain `study_group.current_num` because it is authoritative schema, count the host as one, and mutate/reconcile it only inside locked transactions.

**Rationale**: Removing it would be an unnecessary schema redesign. The service can assert it matches `1 + active approved requests` for active groups and prevent negative/over-capacity values.

**Alternatives considered**:

- Always compute count: cleaner normalization but contradicts the existing stored field and requires wider changes.
- Trust client count: rejected for authorization/concurrency reasons.

## 6. Denial Cooldown and Request History

**Decision**: Add nullable `group_request.decided_at`; set it on approve/deny and insert a new Pending row after 30 full minutes from the latest denial. Add a partial unique index allowing only one Pending/Approved row per user/group.

**Rationale**: `created_at` records submission time, not denial time. Historical Denied rows must remain while a new request becomes Pending.

**Alternatives considered**:

- Reuse `created_at`: calculates the wrong boundary.
- Update Denied back to Pending: erases denial history.
- Global cooldown cache: loses authority after restart and duplicates persisted state.

## 7. Lifecycle Status

**Decision**: Centralize an effective-status calculation from `start_date`, `room_avail.start_time/end_time`, capacity, stored terminal statuses, and library timezone; apply it on reads and before every action, persisting reconciled nonterminal transitions when appropriate.

**Rationale**: A scheduler alone can lag or stop. Server-derived status guarantees stale clients cannot manage a session after start. `full` is Upcoming-at-capacity, not an independent time phase.

**Alternatives considered**:

- Scheduler only: correctness gap during downtime.
- Client-derived status: insecure and timezone-sensitive.
- Database triggers on clock time: triggers do not fire merely because time passes.

## 8. Pagination, Filtering, and Ordering

**Decision**: Perform discovery/dashboard filtering, ordering, and pagination server-side; return page metadata and display-ready reservation/group projections.

**Rationale**: It preserves existing controls while avoiding unbounded payloads and inconsistent client ordering. Created and joined priority order belongs to one authoritative layer.

**Alternatives considered**:

- Fetch all and filter locally: acceptable only for mock scale and degrades over time.
- Separate endpoint per status: creates unnecessary interface fragmentation.

## 9. Backend Resource Boundary

**Decision**: Add dedicated `study-group.routes/controllers/services/models.mjs`, mounted at `/api/study-groups`, and reuse transaction-aware room primitives only where reservation behavior overlaps.

**Rationale**: This follows the constitution and isolates Study Group rules from Freely Mode.

**Alternatives considered**:

- Put all logic in room files: couples modes and increases regression risk.
- Put SQL in services/controllers: violates the layered architecture.

## 10. Frontend Integration

**Decision**: Extract shared DTO/view types from `mockData.ts`, add a Study Group API/adapter module, and reuse the current RoomDetailPanel, Study Together components, dashboard, cards, grids, and modals.

**Rationale**: Existing components already express most layouts, but currently consume display-ready mocks and dummy callbacks. Adapters prevent transport details from leaking into UI and allow runtime mocks to be removed.

**Alternatives considered**:

- Rewrite pages/components: violates reuse and risks visual drift.
- Keep production types in mockData: makes removing mock runtime data fragile.

## 11. Testing Strategy

**Decision**: Add Vitest/Supertest coverage at model, service, controller, and integration levels; use build/lint plus documented manual/E2E frontend flows until a client test runner is separately adopted.

**Rationale**: Server tooling already exists and can test transaction/concurrency rules. No client test framework is configured, so adding one is not required to deliver this feature plan.

**Alternatives considered**:

- Add a frontend test stack now: valuable but expands tooling scope.
- Manual backend testing only: insufficient for concurrency and rollback invariants.

## 12. Time and Timezone

**Decision**: Treat database timestamps consistently in the library’s Asia/Ho_Chi_Minh operating timezone and use server/database time for cooldown and lifecycle decisions.

**Rationale**: Current schema uses timestamps without timezone. Centralized server interpretation avoids client clock manipulation and inconsistent 30-minute boundaries.

**Alternatives considered**:

- Client clocks: untrusted and inconsistent.
- Global timestamp-type migration: desirable long term but outside this feature’s bounded schema alignment.
