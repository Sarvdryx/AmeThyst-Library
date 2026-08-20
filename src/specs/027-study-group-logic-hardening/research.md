# Research: Study Group Logic Hardening

## Decision 1: Enforce relationship type at two layers

**Decision**: Validate the expected relationship type after the row is locked and include the same type in the conditional mutation predicate.

**Rationale**: A service check produces a clear domain outcome, while the predicate prevents a stale or incorrectly reused identifier from mutating the wrong relationship.

**Alternatives considered**:

- UI-only separation: rejected because direct requests bypass it.
- Separate database tables: rejected because schema changes are not approved and the existing discriminator is sufficient.

## Decision 2: Restrict participation to student accounts

**Decision**: Apply role authorization to authenticated personal and mutation operations while leaving the established guest discovery/detail surface unchanged.

**Rationale**: Feature 026 limits creation and participation to student users. Authentication already exposes the authoritative current role, so no new identity model is needed.

**Alternatives considered**:

- Hide controls only: rejected because it does not protect direct requests.
- Permit staff as ordinary participants: rejected because it contradicts the feature boundary.

## Decision 3: Remove SMTP from join-response latency

**Decision**: Return the committed join-request outcome and emit its realtime event without awaiting lifecycle email delivery. Schedule email after commit with explicit failure logging.

**Rationale**: The current join service awaits creator email before the controller can respond. SMTP latency therefore directly explains the observed multi-second interaction. The specification already defines lifecycle email failure as isolated from committed business state.

**Alternatives considered**:

- Keep awaiting SMTP: rejected because it makes a non-transactional fallback determine user latency.
- Add a durable outbox: rejected because it requires schema and infrastructure outside the approved scope.
- Remove the email: rejected because the communication matrix requires it.

## Decision 4: Preserve invitation delivery compensation

**Decision**: Do not apply the non-blocking lifecycle-email rule to invitation creation. Invitation success remains contingent on delivered email, with cleanup on failure.

**Rationale**: An invitation is not considered successfully sent when its required delivery fails, unlike lifecycle events whose business mutation has already committed.

**Alternatives considered**:

- Treat invitation email like lifecycle email: rejected because it could leave an active invitation the creator was told failed.

## Decision 5: Evidence-gated creation hardening

**Decision**: Write boundary tests first, then change validation only for reproduced gaps. Validate real calendar dates and compare the selected slot start against Vietnam-local current time.

**Rationale**: The user reports valid interactive creation works. The audit concern is direct server acceptance of invalid boundaries, so tests protect the working path and prevent speculative changes.

**Alternatives considered**:

- Make no change: rejected if direct invalid requests are demonstrated.
- Rewrite Room Reservation date logic broadly: rejected because it expands scope and risks Freely Mode.

## Decision 6: Use authoritative server pagination

**Decision**: Each list loads the requested page and consumes returned pagination metadata. Client-side slicing of a fixed first-50 result is removed.

**Rationale**: The API already supplies stable ordering and totals; a first-page cache cannot expose records beyond its limit.

**Alternatives considered**:

- Increase the fixed limit: rejected because the omission returns at the next threshold.
- Infinite unbounded loading: rejected because it conflicts with bounded payload and existing pagination UI.

## Decision 7: Keep one current relationship after cooldown

**Decision**: Delete prior Denied join-request rows for the user/group before inserting the new Pending row after cooldown.

**Rationale**: This matches the approved clarification, avoids multiple competing relationship histories in the user-facing model, and needs no schema change.

**Alternatives considered**:

- Retain every denial: rejected because history is not a user need in this feature.

## Decision 8: Do not invent Study Group timestamps

**Decision**: Remove Study Group `createdAt` and `updatedAt` from projections, contracts, client types, and consumers. Keep timestamps belonging to participation, invitation, reservation, and notification entities.

**Rationale**: A future scheduled date is not a creation timestamp and can corrupt ordering or presentation.

**Alternatives considered**:

- Rename them to scheduled timestamps: rejected because reservation already exposes the truthful schedule and another name would duplicate it.
- Add timestamp columns: rejected pending separate schema approval.
- Keep fallback values: rejected because field semantics remain false.

## Decision 9: Members is event-specific

**Decision**: Show post-commit Members for invitations and creator-facing member-entry events. Omit it from the non-capacity-action events listed in FR-023.

**Rationale**: This retains useful capacity tracking without adding noise to removal, denial, cancellation, dissolution, leave, or metadata-update messages.

## Decision 10: Test client behavior through pure state transitions

**Decision**: Extract join-session and pagination sequencing decisions into pure client helpers and import those helpers in executable tests. Keep browser/runtime checks for DOM rendering, focus, scroll lock, and route history.

**Rationale**: Source-text assertions cannot prove that submission, stale-response, filter-reset, or page-correction behavior executes correctly. A new browser-test dependency is unnecessary for the core state invariants.

**Alternatives considered**:

- Continue source-text matching: rejected because it does not satisfy FR-028.
- Add a new component/browser test framework immediately: rejected because it expands dependencies and configuration beyond the hardening scope.

## Decision 11: Lifecycle email is best-effort without an outbox

**Decision**: After a lifecycle transaction commits, schedule email delivery without delaying the business response, track the returned Promise, and log delivery rejection. Do not claim guaranteed delivery if the server process terminates. Invitation creation retains synchronous delivery compensation.

**Rationale**: This removes SMTP from join latency while honestly preserving the reliability limit imposed by the no-schema constraint.

**Alternatives considered**:

- Durable outbox: rejected until a schema change is separately approved.
- Await lifecycle SMTP: rejected because it makes the committed user action depend on an external mail round trip.
