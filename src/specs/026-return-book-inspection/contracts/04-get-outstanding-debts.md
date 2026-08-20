# API Contract: Get Outstanding Debts (Librarian)

## Endpoint

`GET /api/librarian/loan-fees/outstanding?search={username}`

## Authentication

Requires valid librarian JWT token (`verifyToken` + `authorizeRole('librarian')`).

## Query Parameters

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `search` | string | No | Filter by username (partial match) |

## Response (200)

```json
{
  "success": true,
  "data": [
    {
      "user_id": "uuid",
      "username": "john_doe",
      "penalties": [
        {
          "penalty_id": "uuid",
          "borrow_id": "uuid",
          "issue": "DAMAGED",
          "description": "Torn pages",
          "penalty_amount": 8.50,
          "record_date": "2026-07-20",
          "is_paid": false
        }
      ]
    }
  ],
  "message": "Outstanding debts retrieved successfully"
}
```

## Empty Response

```json
{
  "success": true,
  "data": [],
  "message": "No outstanding debts found"
}
```
