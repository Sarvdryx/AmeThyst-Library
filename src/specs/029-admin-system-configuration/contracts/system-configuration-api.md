# API Contract: Admin System Configuration

**Base path**: `/api/dashboard/admin/system-configuration`  
**Authentication**: `Authorization: Bearer <JWT>`  
**Authorization**: administrator role only  
**Content type**: `application/json`

## Shared response envelope

Successful responses follow:

```json
{
  "success": true,
  "data": {},
  "message": "Optional human-readable message"
}
```

Error responses follow:

```json
{
  "success": false,
  "error": {
    "code": "STABLE_ERROR_CODE",
    "message": "User-facing fallback message",
    "details": {}
  }
}
```

The client localizes by stable code/field path and uses the server message as a fallback.

## GET `/api/dashboard/admin/system-configuration`

Returns the complete active configuration and its derived version.

### Success — `200 OK`

```json
{
  "success": true,
  "data": {
    "configuration": {
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
    },
    "version": "<sha256-hex>"
  }
}
```

### Errors

| Status | Code | Condition |
|---:|---|---|
| 401 | `AUTH_REQUIRED` / `INVALID_TOKEN` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Authenticated account is not an administrator |
| 503 | `CONFIG_UNAVAILABLE` | No valid active snapshot is available |

## PUT `/api/dashboard/admin/system-configuration`

Replaces the complete configuration if the submitted version is current and every value is valid.

### Request

```json
{
  "expectedVersion": "<version returned by GET>",
  "configuration": {
    "MAX_BORROW_LIMIT": 7,
    "FEE_ADMIN": 1.25,
    "FEE_ADDON": 0.75,
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
}
```

### Success — `200 OK`

```json
{
  "success": true,
  "message": "System configuration updated successfully.",
  "data": {
    "configuration": {
      "MAX_BORROW_LIMIT": 7,
      "FEE_ADMIN": 1.25,
      "FEE_ADDON": 0.75,
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
    },
    "version": "<new-sha256-hex>"
  }
}
```

### Validation error — `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "CONFIG_VALIDATION_FAILED",
    "message": "One or more configuration values are invalid.",
    "details": {
      "fields": {
        "MAX_BORROW_LIMIT": "MUST_BE_POSITIVE_INTEGER",
        "FEE_ADMIN": "VALUE_REQUIRED",
        "DAMAGE_COEFFICIENTS.water_damage": "MUST_BE_NON_NEGATIVE_FINITE_NUMBER"
      }
    }
  }
}
```

Validation rejects missing/additional keys, `null`, empty or whitespace-only strings, numeric strings, non-finite/negative values, borrowing limits that are not positive whole numbers, and any non-zero `perfect_condition`. `MAX_BORROW_LIMIT` is the configured business limit itself; this feature does not impose a second upper-bound policy on that value. The client must keep Save unavailable when any draft field is empty, but the server enforces the same invariant for direct requests. One pure utility owns canonical configuration validation and serialization; Middleware and Service both use it so startup, API, and direct service callers cannot drift without introducing a Middleware-to-Service dependency.

### Version conflict — `409 Conflict`

```json
{
  "success": false,
  "error": {
    "code": "CONFIG_VERSION_CONFLICT",
    "message": "System configuration changed after this page was loaded. Reload and review the latest values.",
    "details": {
      "currentVersion": "<current-sha256-hex>"
    }
  }
}
```

The server performs no write. The UI retains the draft and offers reload/discard rather than silently retrying with the new version.

### Other errors

| Status | Code | Condition |
|---:|---|---|
| 401 | `AUTH_REQUIRED` / `INVALID_TOKEN` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Authenticated account is not an administrator |
| 503 | `CONFIG_WRITE_FAILED` | Temporary-file write, flush, or replacement failed; active snapshot is unchanged |

## Authorization invariants

- Authentication middleware executes before role and validation middleware.
- Unauthorized requests never receive the configuration payload.
- Validation and file operations never run for unauthorized requests.
- Client-side dashboard guarding is supplementary and is not the security boundary.
- Configuration persistence and business-rule reads never access a database. Existing authentication/account-role middleware may continue its current database lookup before this feature's controller runs.

## Idempotency and concurrency

- Repeating a PUT with the old version after a successful update returns `409`.
- Submitting an unchanged configuration with the current version is valid; the service may return the same version without rewriting.
- Concurrent writes are serialized inside exactly one Node.js backend process.
- Each success represents one complete canonical document; partial updates are not supported.

## Deployment invariant

Exactly one Node.js backend process may own `system-configuration.json`. Clustered workers, multiple PM2 processes, or multiple application instances sharing the file are unsupported because their in-memory snapshots and write queues are not coordinated across processes.

## Service objectives

- Under normal single-process load, authenticated GET and valid PUT responses complete within 2 seconds.
- The API integration suite measures this objective with the temporary configuration path and local test server; environment startup and network transit outside the application are excluded.
