# API Contracts: Room Check-In & Check-Out

**Feature**: Room Reservation, Check-In, and Check-Out
**Date**: 2026-07-31

All endpoints return the project's unified JSON envelope:

```json
{ "success": true, "data": { }, "message": "..." }
```

or on failure:

```json
{ "success": false, "data": null, "message": "..." }
```

Errors use appropriate HTTP status codes (400, 401, 403, 404, 409, 500) following existing controller conventions.

---

## 1. Generate Room Check-In PIN

**`POST /api/rooms/reserve/:reserveId/pin`** — authenticated (user)

Generates a 6-digit PIN valid for 3 minutes and transitions the reservation to `pending`. Returns the existing active PIN if one is still valid.

**Request**

| Field | Location | Type | Notes |
|-------|----------|------|-------|
| `reserveId` | path | uuid | Must belong to `req.user` and be in `reserved` or `pending` status |

**Response `200`**

```json
{
  "success": true,
  "data": {
    "pin": "482913",
    "expiresAt": "2026-07-31T09:33:00.000Z"
  }
}
```

**Errors**

| Code | Status | When |
|------|--------|------|
| `RESERVATION_NOT_FOUND` | 404 | Reservation not found / not owned by user / invalid status |
| `PIN_GENERATION_FAILED` | 500 | Uniqueness exhausted after 3 attempts |

---

## 2. Clean Up Room Check-In PIN

**`POST /api/rooms/reserve/:reserveId/pin/cleanup`** — authenticated (user)

Manually clears an active `pending` PIN back to `reserved`. Used when the user dismisses the PIN flow.

**Response `200`**

```json
{ "success": true, "data": { "cleaned": true } }
```

---

## 3. Confirm Room Check-Out

**`POST /api/rooms/reserve/:reserveId/checkout`** — authenticated (user)

Creates a `return_room` record for the reservation. Idempotent: if a return record already exists, returns it without creating a duplicate.

**Request**

| Field | Location | Type | Notes |
|-------|----------|------|-------|
| `reserveId` | path | uuid | Must belong to `req.user`; status must be `used` (checked in) and slot elapsed |

**Response `201` (or `200` if already returned)**

```json
{
  "success": true,
  "data": {
    "returnId": "5b7d...",
    "reserveId": "8c2a...",
    "checkoutTime": "2026-07-31T10:00:00.000Z"
  }
}
```

**Errors**

| Code | Status | When |
|------|--------|------|
| `RESERVATION_NOT_FOUND` | 404 | Not found / not owned / not in `used` status |
| `CHECKOUT_NOT_ELIGIBLE` | 409 | Slot time has not elapsed yet |

---

## 4. Room Reservation History (date-filtered)

**`GET /api/rooms/history?from=YYYY-MM-DD&to=YYYY-MM-DD`** — authenticated (user)

Returns the user's reservations within the inclusive date range (optional filters; omitted means all), ordered by `start_date DESC`. Each entry extends the standard reservation shape with check-in and check-out times.

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "reserveId": "8c2a...",
      "startDate": "2026-07-30",
      "startTime": "09:30:00",
      "endTime": "11:30:00",
      "status": "used",
      "roomName": "Room A1",
      "imgUrl": "https://...",
      "checkinTime": "2026-07-30T09:31:00.000Z",
      "checkoutTime": "2026-07-30T11:30:00.000Z",
      "branchId": 1,
      "branchName": "..."
    }
  ]
}
```

---

## 5. Verify Room Check-In PIN (Librarian)

**`POST /dashboard/librarian/verify-room-pin`** — authenticated (librarian)

Looks up a `pending` reservation by PIN (must be non-expired) and returns reservation, user, and room details. No branch filter (mirrors return flow).

**Request**

```json
{ "pin": "482913" }
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "reserveId": "8c2a...",
    "reservation": {
      "startDate": "2026-07-31",
      "startTime": "09:30:00",
      "endTime": "11:30:00",
      "status": "pending"
    },
    "user": { "username": "minhng", "email": "m@example.com", "phone_number": "..." },
    "room": { "roomName": "Room A1", "imgUrl": "https://...", "roomId": 1, "branchId": 1 }
  }
}
```

**Errors**

| Code | Status | When |
|------|--------|------|
| `PIN_NOT_FOUND` | 404 | "The PIN has expired or does not exist." |

---

## 6. Confirm Room Check-In (Librarian)

**`POST /dashboard/librarian/confirm-room-checkin`** — authenticated (librarian)

Transactional check-in: sets `checkin_time = NOW()`, clears `pin`/`expired_at`, sets `status = 'used'`.

**Request**

```json
{ "reserveId": "8c2a..." }
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "reserveId": "8c2a...",
    "status": "used",
    "checkinTime": "2026-07-31T09:35:00.000Z"
  }
}
```

**Errors**

| Code | Status | When |
|------|--------|------|
| `NOT_FOUND` | 404 | Reservation not found or not in `pending` status |
| `ALREADY_USED` | 409 | Reservation already checked in |
