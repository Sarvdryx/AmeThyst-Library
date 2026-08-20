# API Contracts: PIN Generation for Book Pickup

**Date**: 2026-06-26
**Feature**: 014-pin-generation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. Generate / View Pickup PIN

**POST** `/library/reserve/:reservationId/pin`

Generate a new pickup PIN for a reservation, or return the existing active PIN if one is already valid.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body**: None (empty object or omit body)

**Path Parameters**:
- `reservationId` (UUID) — The reservation's `borrow_id`

**Response (200 OK — New PIN Generated)**:
```json
{
  "success": true,
  "data": {
    "pin": "847291",
    "expiresAt": "2026-06-26T14:35:00.000Z",
    "status": "pending"
  }
}
```

**Response (200 OK — Existing Active PIN Returned)**:
```json
{
  "success": true,
  "data": {
    "pin": "847291",
    "expiresAt": "2026-06-26T14:33:22.000Z",
    "status": "pending"
  }
}
```

**Response (400 Bad Request — Reservation Not Pending)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_PENDING",
    "message": "PIN can only be generated for reservations with 'reserved' status"
  }
}
```

**Response (404 Not Found — Reservation Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Reservation not found"
  }
}
```

**Response (403 Forbidden — Not Owner)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only generate PINs for your own reservations"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

### 2. Cancel Reservation (Modified — supports reserved + pending)

**DELETE** `/library/reserve/:reservationId`

Cancel a reservation and delete the `borrow_book` row. Now supports both `reserved` and `pending` status (previously only `pending` was allowed).

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Path Parameters**:
- `reservationId` (UUID) — The reservation's `borrow_id`

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "expired"
  }
}
```

**Response (400 Bad Request — Cannot Cancel Borrowed)**:
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Only reserved or pending reservations can be cancelled"
  }
}
```

**Response (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Reservation not found"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Behavior**:
- If status is `reserved`: deletes row, restores available_quantity, decrements borrow_num
- If status is `pending`: deletes row (clears active PIN), restores available_quantity, decrements borrow_num
- If status is `borrowed`: returns 400 error (cannot cancel after checkout)

---

### 3. Get My Borrowed Records (Existing — Enhanced)

**GET** `/library/my-borrowed`

Returns the user's current and historical borrow records. **No changes to existing contract.** The response already includes `status` field which will now contain `"pending"` for reservations with active PINs.

**Note**: The `pin` field is intentionally **NOT** included in this response for security. PINs are only fetched via the dedicated PIN endpoint.

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `CANNOT_CANCEL` | 400 | Only reserved or pending reservations can be cancelled |
| `NOT_PENDING` | 400 | Reservation must be in 'reserved' status to generate PIN |
| `NOT_FOUND` | 404 | Reservation does not exist or does not belong to user |
| `FORBIDDEN` | 403 | User does not own this reservation |
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Frontend Integration Notes

### PIN Generation Flow

1. User navigates to `/dashboard/user/borrowed`
2. User sees book cards in "Currently Borrowing" tab
3. Book cards with `status: "reserved"` show a "View PIN" button
4. User clicks "View PIN" → frontend sends `POST /api/library/reserve/:reservationId/pin`
5. Backend generates or returns existing PIN → frontend opens `PinModal`
6. Modal displays PIN with 5-minute countdown timer
7. User closes modal → PIN remains active for the full 5 minutes
8. User can click "View PIN" again to see the same active PIN with updated countdown

### Countdown Timer Behavior

- Timer is calculated client-side from `expiresAt` returned by the API
- Timer updates every second via `setInterval`
- When timer reaches 0: modal shows "PIN Expired" message, button resets
- No additional API calls needed for countdown — purely client-side

### Cancel Reservation Flow

1. User navigates to `/dashboard/user/borrowed`
2. Book cards with `status: "reserved"` or `status: "pending"` show a "Cancel" button
3. User clicks "Cancel" → frontend shows confirmation dialog
4. On confirmation, frontend sends `DELETE /api/library/reserve/:reservationId`
5. Backend deletes the `borrow_book` row, restores inventory, decrements borrow_num
6. Frontend removes the book card from the "Currently Borrowing" tab and shows success toast

### Error Handling

- If API returns `NOT_PENDING`: show toast "Please generate a PIN from the reservation page"
- If API returns `CANNOT_CANCEL`: show toast "Only reserved or pending reservations can be cancelled"
- If API returns `NOT_FOUND` or `FORBIDDEN`: show toast "Reservation not found"
- If API returns network error: show toast "Connection error. Please try again."
