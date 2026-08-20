# Confirm Loan

Confirms the book loan after successful PIN verification. Sets status to `borrowed`, `due_date` to +14 days, creates a calendar event, and cleans up `expired_reserve`.

## POST `/api/library/confirm-loan`

### Request

```json
{
  "borrow_id": "uuid-or-id"
}
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "borrow_id": "uuid-or-id",
    "status": "borrowed",
    "due_date": "2026-07-15T10:30:00.000Z"
  },
  "message": "Loan confirmed successfully"
}
```

### Error: Borrower ineligible (409)

```json
{
  "success": false,
  "data": null,
  "message": "Borrower has overdue books or is suspended. Cannot confirm loan."
}
```

### Error: Invalid borrow_id (404)

```json
{
  "success": false,
  "data": null,
  "message": "Borrow record not found."
}
```
