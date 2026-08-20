# API Contract: Get User Fees

## Endpoint

`GET /api/user/fees`

## Authentication

Requires valid user JWT token (`verifyToken`).

## Response (200)

```json
{
  "success": true,
  "data": {
    "outstanding": [
      {
        "penalty_id": "uuid",
        "borrow_id": "uuid",
        "issue": "DAMAGED",
        "description": "Torn pages",
        "penalty_amount": 8.50,
        "record_date": "2026-07-20"
      }
    ],
    "history": [
      {
        "penalty_id": "uuid",
        "borrow_id": "uuid",
        "issue": "OVERDUE",
        "penalty_amount": 3.20,
        "record_date": "2026-06-15",
        "paid_at": "2026-06-15T10:00:00.000Z"
      }
    ]
  },
  "message": "Fees retrieved successfully"
}
```

## Behavior

- `outstanding`: filters `book_penalty` where `user_id = current_user` AND `is_paid = false`
- `history`: filters `book_penalty` where `user_id = current_user` AND `is_paid = true`
