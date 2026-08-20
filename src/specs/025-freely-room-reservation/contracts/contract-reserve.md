# POST /api/rooms/reserve

**Status**: New endpoint (to be implemented)

## Auth

Requires `Authorization: Bearer <token>` header. Returns 401 if missing or invalid.

## Request Body

```json
{
  "availId": 1,
  "startDate": "2026-07-20"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `availId` | integer | yes | The availability slot ID to book |
| `startDate` | string | yes | Booking date in `YYYY-MM-DD` format |

## Response (201)

```json
{
  "success": true,
  "data": {
    "reserveId": "a1b2c3d4-...",
    "availId": 1,
    "startDate": "2026-07-20",
    "status": "reserved"
  }
}
```

## Error Responses

### 400 — Invalid input
```json
{
  "success": false,
  "error": "Missing required fields: availId, startDate"
}
```

### 401 — Unauthenticated
```json
{
  "success": false,
  "error": "No token provided"
}
```

### 409 — Slot already booked (conflict)
```json
{
  "success": false,
  "error": "This time slot is no longer available."
}
```

### 500 — Server error
```json
{
  "success": false,
  "error": "An error occurred while creating the reservation."
}
```

## Implementation Notes

- Extract `user_id` from `req.user` (set by `verifyToken` middleware)
- Insert into `reserve_room` with fields: `reserve_id` (auto), `user_id`, `avail_id`, `start_date`, `status = 'reserved'`
- Leave `checkin_time`, `pin`, `expired_at` as NULL
- Use a transaction or check to prevent double-booking: verify that `(avail_id, start_date)` does not already have an existing reservation with status `reserved` or `pending` before inserting
