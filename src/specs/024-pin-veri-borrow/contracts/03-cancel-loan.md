# Cancel Loan

Cancels the book loan, deletes the borrow record, and increments the book's quantity by 1 for the branch.

## POST `/api/library/cancel-loan`

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
    "borrow_id": "uuid-or-id"
  },
  "message": "Loan cancelled successfully. Book quantity updated."
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
