# Data Model: Study Group Logic Hardening

This feature changes no database schema. The authoritative definitions remain in `database/init_db/postgres`.

## Existing Entities

### Study Group

Relevant attributes:

- Identifier.
- Creator identifier.
- Reservation identifier.
- Subject, title, description, optional ordered requirements.
- Capacity and current member count.
- Persisted/effective lifecycle status.

Invariants:

- Exactly one reservation backs a group.
- The creator counts as one member but has no participation row.
- `1 <= current members <= capacity` for a live API-created group.
- Capacity changes occur only through locked, committed participation transitions.

### Participation Relationship

Relevant attributes:

- Request identifier.
- Group identifier.
- User identifier.
- Type: `request` or `invite`.
- Status: `pending`, `approved`, `denied`, or `expired`.
- Content, creation instant, and decision instant.

Identity rules:

- The request identifier is globally unique.
- A mutation is identified by group, request, current user/owner relationship, expected type, and expected status.
- At most one Pending or Approved relationship is active for a user/group.

### Room Reservation

Relevant attributes:

- Reservation identifier, owner, availability slot, calendar date, and status.
- Slot start/end times are interpreted in Vietnam local time.

Invariants:

- Creation uses a real calendar date.
- The selected start instant is strictly in the future.
- Only one active reservation occupies the same slot/date.
- Deleting the reservation dissolves the linked group through existing cascades.

### Paged Group Result

Attributes:

- Current page.
- Page size.
- Total items.
- Total pages.
- Ordered page items.

Rules:

- Filters and authorization exclusions are applied before pagination.
- The client does not derive total pages from its current page items.
- A realtime update may reduce the current page to the new last valid page.

### Notification Event

Relevant attributes:

- Stable event identifier and type.
- Actor and recipient.
- Group/schedule/location snapshot.
- Destination.
- Event creation instant and read state.
- Optional post-commit member count.

Rules:

- Members is required for invitation and member-entry events.
- Members is optional/omitted for the FR-023 event set.
- Lifecycle browser persistence remains account-scoped and non-durable across devices/offline periods.

## State Transitions

### Join Request

```text
none
  → pending request
  → approved
  → denied

pending request
  → deleted by the same requester (cancel)

denied request
  → prior denied rows removed after cooldown
  → one new pending request
```

Only `type=request` rows may follow these transitions.

### Invitation

```text
none
  → pending invite
  → approved by recipient
  → denied by recipient

pending invite
  → deleted only as compensation when required invitation delivery fails
```

Only `type=invite` rows may follow these transitions. Invitation denial does not create join-request cooldown.

## Concurrency Preconditions

- Approval and invitation acceptance lock the group and relationship before checking type, status, lifecycle, and capacity.
- Conditional transition succeeds only from the expected Pending type.
- Member count changes only if the relationship transition succeeds.
- Duplicate or retried submissions cannot create a second active Pending/Approved relationship.

## Validation Rules

- Calendar date must round-trip to the supplied year, month, and day.
- Slot start is interpreted using the project’s Vietnam-local reservation convention.
- Exact start and elapsed start are not future and are rejected for creation.
- Requirements remain zero to five trimmed non-empty entries.
- Role authorization uses the current persisted account role, not a stale client claim.

## Timestamp Semantics

The current schema has no authoritative Study Group creation/update timestamp. Reservation date must not be exposed as either timestamp. Feature 027 removes unsupported Study Group `createdAt` and `updatedAt` fields from responses and consumers. It does not remove or rename timestamps owned by participation, invitation, reservation, or notification entities. Adding truthful Study Group audit columns requires separate approval and is outside this feature.

## Existing Constraints

Verified that `database/init_db/postgres/05_init_rest.sql` provides `chk_capacity_currentnum` and `chk_capacity_positive`, and `database/init_db/postgres/06_indexes.sql` provides `uq_group_request_active_participation`. No SQL changes are required.
