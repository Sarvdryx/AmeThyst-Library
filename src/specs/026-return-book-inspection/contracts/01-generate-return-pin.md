# API Contract: Generate Return PIN

## Endpoint

`POST /api/user/borrowed/generate-return-pin`

## Authentication

Requires valid user JWT token (`verifyToken` middleware).

## Request Body

```json
{
  "borrow_id": "uuid"
}
```

## Response (200)

```json
{
  "success": true,
  "data": {
    "pin": "123456",
    "expiresAt": "2026-07-21T15:30:00.000Z"
  },
  "message": "Return PIN generated successfully"
}
```

## Error Responses

### 400 — Invalid borrow_id
```json
{
  "success": false,
  "data": null,
  "message": "borrow_id is required"
}
```

### 404 — Borrow record not found / not in borrowed status
```json
{
  "success": false,
  "data": null,
  "message": "Borrow record not found or book is not currently borrowed"
}
```

### 409 — Active PIN already exists
```json
{
  "success": false,
  "data": {
    "pin": "123456",
    "expiresAt": "..."
  },
  "message": "An active return PIN already exists"
}
```

## Behavior

- Only valid for `borrow_book` records with `status = 'borrowed'`
- Sets `status = 'pending_return'` with 3-minute PIN expiry
- No branch filter — returnable at any library branch
- If an active (non-expired) PIN already exists, return it instead of generating a new one
