# API Contract: Confirm Return

## Endpoint

`POST /api/librarian/confirm-return`

## Authentication

Requires valid librarian JWT token (`verifyToken` + `authorizeRole('librarian')`).

## Request Body

```json
{
  "borrow_id": "uuid",
  "branch_id": "uuid",
  "conditions": ["slight_cover_scratches", "folded_pages"],
  "description": "Cover has light scratches, pages 12-15 folded at corner",
  "is_lost": false
}
```

## Response (200)

```json
{
  "success": true,
  "data": {
    "returnId": "uuid",
    "penaltyId": "uuid",
    "penaltyAmount": 5.50,
    "issue": "DAMAGED",
    "inventoryUpdated": false
  },
  "message": "Return confirmed successfully"
}
```

### Response Variations

**Perfect condition + on time**:
```json
{
  "success": true,
  "data": {
    "returnId": "uuid",
    "penaltyId": null,
    "penaltyAmount": 0,
    "issue": null,
    "inventoryUpdated": true
  },
  "message": "Return confirmed successfully"
}
```

**Lost**:
```json
{
  "success": true,
  "data": {
    "returnId": null,
    "penaltyId": "uuid",
    "penaltyAmount": 31.98,
    "issue": "LOST",
    "inventoryUpdated": false
  },
  "message": "Return confirmed successfully"
}
```

**Damaged + Overdue**:
```json
{
  "success": true,
  "data": {
    "returnId": "uuid",
    "penaltyId": "uuid",
    "penaltyAmount": 12.75,
    "issue": "COMBINED",
    "inventoryUpdated": false
  },
  "message": "Return confirmed successfully"
}
```

## Error Responses

### 400 — Missing required fields
```json
{
  "success": false,
  "data": null,
  "message": "borrow_id and branch_id are required"
}
```

### 404 — Borrow record not found
```json
{
  "success": false,
  "data": null,
  "message": "Borrow record not found"
}
```

## Behavior

- Uses database transaction (`BEGIN/COMMIT/ROLLBACK`)
- Calculates penalty based on conditions + overdue status
- Routes records based on scenario (see spec.md scenarios table)
- Updates `borrow_book.status` to `'returned'`
- Sets `borrow_book.pin = NULL` and `expired_at = NULL`
- Only increments `library.available_quantity` for perfect condition returns
