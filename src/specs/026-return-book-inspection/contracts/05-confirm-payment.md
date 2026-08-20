# API Contract: Confirm Payment (Librarian)

## Endpoint

`POST /api/librarian/loan-fees/confirm-payment`

## Authentication

Requires valid librarian JWT token (`verifyToken` + `authorizeRole('librarian')`).

## Request Body

```json
{
  "penalty_id": "uuid"
}
```

## Response (200)

```json
{
  "success": true,
  "data": {
    "penalty_id": "uuid",
    "is_paid": true,
    "paid_at": "2026-07-21T15:35:00.000Z"
  },
  "message": "Payment confirmed successfully"
}
```

## Error Responses

### 404 — Penalty not found
```json
{
  "success": false,
  "data": null,
  "message": "Penalty record not found"
}
```

### 409 — Already paid
```json
{
  "success": false,
  "data": null,
  "message": "This penalty has already been paid"
}
```

## Behavior

- Updates `book_penalty.is_paid = true` and `paid_at = NOW()`
- Changes reflected immediately on User Fees tab
