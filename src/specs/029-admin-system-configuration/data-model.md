# Data Model: Admin System Configuration

**Feature**: `029-admin-system-configuration`  
**Persistence**: File-backed only; no database entities or migrations

## 1. File-backed Persistence Model

`system-configuration.models.mjs` is the persistence boundary for the JSON source of truth. It receives the canonical path from the config module and exposes file-oriented operations to the service; it is not a database model and creates no SQL or graph entities.

Responsibilities:

- Read the complete JSON document during startup and return parsed data for service validation.
- Write canonical serialized content to a uniquely named sibling temporary file, flush and close it, and atomically replace the target.
- Remove best-effort temporary artifacts after failure without changing the canonical target.
- Accept an injected path and file-operation implementation in API integration tests so write failure and interruption immediately before replacement can be reproduced without touching the repository file.

The pure `system-configuration.utils.mjs` utility owns canonical schema validation and serialization. Middleware and Service both call that utility; Middleware never imports Service. The Service owns version derivation, the immutable active snapshot, optimistic concurrency, and the single-process write queue. Exactly one Node.js backend process may own the canonical file.

## 2. Canonical System Configuration

The JSON document is a complete policy snapshot. Partial documents and additional keys are invalid.

```json
{
  "MAX_BORROW_LIMIT": 5,
  "FEE_ADMIN": 1,
  "FEE_ADDON": 0.5,
  "DAMAGE_COEFFICIENTS": {
    "perfect_condition": 0,
    "slight_cover_scratches": 0.05,
    "folded_pages": 0.1,
    "pencil_marks": 0.15,
    "ink_marks": 0.4,
    "torn_pages": 0.5,
    "water_damage": 0.7,
    "damaged_binding": 0.3,
    "missing_mats": 0.3,
    "missing_pages": 1,
    "lost": 2
  }
}
```

### Fields

| Field | Type | Required | Validation | Meaning |
|---|---|---:|---|---|
| `MAX_BORROW_LIMIT` | integer | Yes | Finite integer `>= 1`; no separate feature-defined upper bound | Maximum simultaneous active borrowings per patron |
| `FEE_ADMIN` | number | Yes | Finite number `>= 0` | Base administrative amount added to each chargeable damage condition |
| `FEE_ADDON` | number | Yes | Finite number `>= 0` | Amount for each applicable damage condition after the first |
| `DAMAGE_COEFFICIENTS` | object | Yes | Exact fixed key set | Multipliers used by condition/lost calculations |

### Damage coefficient fields

Every coefficient is required and must be a finite number greater than or equal to zero. `perfect_condition` has the stronger invariant `=== 0`.

| Key | Initial value | Editable | Application |
|---|---:|---:|---|
| `perfect_condition` | 0 | No | Always represents no damage charge |
| `slight_cover_scratches` | 0.05 | Yes | Damage calculation |
| `folded_pages` | 0.10 | Yes | Damage calculation |
| `pencil_marks` | 0.15 | Yes | Damage calculation |
| `ink_marks` | 0.40 | Yes | Damage calculation |
| `torn_pages` | 0.50 | Yes | Damage calculation |
| `water_damage` | 0.70 | Yes | Damage calculation |
| `damaged_binding` | 0.30 | Yes | Damage calculation |
| `missing_mats` | 0.30 | Yes | Damage calculation |
| `missing_pages` | 1.00 | Yes | Damage calculation |
| `lost` | 2.00 | Yes | General lost-item multiplier |

### Whole-document invariants

- The top-level key set and coefficient key set are exact; unknown and missing keys are rejected.
- Every field is required. `null`, empty strings, and whitespace-only strings are invalid and cannot be persisted.
- JSON values must be numbers, not numeric strings.
- `NaN` and infinity are invalid even if introduced through an in-memory caller.
- `MAX_BORROW_LIMIT` must satisfy `Number.isInteger(value)` and be greater than or equal to `1`; it is itself the borrowing-policy limit, not a maximum allowed configuration input.
- Saving always validates and replaces the entire document.
- The active snapshot is deeply frozen or returned as a defensive copy so consumers cannot mutate it.
- Canonical serialization uses stable key order and a trailing newline for deterministic versioning and readable diffs.

## 3. Configuration Version

The version is API metadata derived from the canonical configuration; it is not stored in the JSON document.

| Field | Type | Rules |
|---|---|---|
| `version` | string | Lowercase SHA-256 hexadecimal digest of canonical serialized configuration |

The client sends the last loaded version as `expectedVersion` on save. If it differs from the active version, the update transitions to `conflict` and performs no write.

## 4. Configuration Draft

Client-only working state for the fixed form.

| Field | Type | Meaning |
|---|---|---|
| `savedConfiguration` | System Configuration | Last complete snapshot received from the server |
| `draftConfiguration` | System Configuration-like input state | Values currently displayed/edited; numeric fields may temporarily be strings while typing |
| `version` | string | Version paired with `savedConfiguration` |
| `fieldErrors` | map | Localized validation issue keyed by stable field path |
| `status` | enum | `loading`, `ready`, `dirty`, `invalid`, `saving`, `saved`, `conflict`, or `failed` |

An editable draft field may temporarily be empty while the administrator is typing, but that immediately places the draft in `invalid` state. Save remains unavailable until every field contains a valid value.

### Draft state transitions

```text
loading ──GET success──> ready
loading ──GET failure──> failed
ready ──edit valid─────> dirty
ready/dirty ──edit invalid──> invalid
dirty ──save───────────> saving
saving ──PUT success───> saved ──settle──> ready
saving ──409───────────> conflict ──reload──> ready
saving ──other failure─> failed ──edit/retry──> dirty
dirty/invalid/failed ──discard──> ready
```

## 5. Business Rule Projection

Consumers capture one active System Configuration snapshot at the start of an operation.

### Borrowing eligibility

```text
eligible = currentBorrowCount < MAX_BORROW_LIMIT
```

Lowering the limit never cancels active loans; it affects the next reservation/borrowing eligibility check.

### Damage cost

```text
coefficientTotal = sum(coefficient for each distinct applicable damage condition)
additionalConditionCount = max(0, applicableConditionCount - 1)
damageCost = coefficientTotal × bookPrice
             + applicableConditionCount × FEE_ADMIN
             + additionalConditionCount × FEE_ADDON
```

The existing cap and overdue calculation behavior remain unchanged. Perfect condition alone produces zero.

### Lost cost

```text
lostCost = explicitlySuppliedItemSpecificLostAmount
           ?? (DAMAGE_COEFFICIENTS.lost × bookPrice)
```

The optional item-specific amount is only honored when an existing caller explicitly supplies it. This feature does not create, persist, query, or infer that amount. Existing overdue handling, when applicable to a lost return, remains additive and out of configuration scope.

## 6. Persistence State

```text
uninitialized ──valid file load──> active
uninitialized ──missing/invalid file──> startup_failed
active ──valid save + replace──> active(new version)
active ──invalid request───────> active(same version)
active ──stale version────────> active(same version)
active ──write/replace failure─> active(same version)
```

The in-memory snapshot changes only after durable replacement succeeds.

An integration-test-injected Model failure after the temporary file is flushed but before target replacement must follow the `write/replace failure` transition: the previous canonical file and active snapshot remain unchanged. This deterministic scenario verifies interrupted-save recovery without requiring a feature-specific unit test.
