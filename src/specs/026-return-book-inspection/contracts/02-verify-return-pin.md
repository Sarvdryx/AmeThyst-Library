# API Contract: Verify Return PIN

## Endpoint

`POST /api/librarian/verify-return-pin`

## Authentication

Requires valid librarian JWT token (`verifyToken` + `authorizeRole('librarian')`).

## Request Body

```json
{
  "pin": "123456"
}
```

## Response (200)

```json
{
  "success": true,
  "data": {
    "borrowId": "uuid",
    "borrower": {
      "username": "john_doe",
      "gender": "Male",
      "phone_number": "0123456789",
      "email": "john@example.com",
      "birth_date": "2000-01-15"
    },
    "book": {
      "title": "The Great Gatsby",
      "author": "F. Scott Fitzgerald",
      "publisher": "Scribner",
      "genres": "Fiction, Classic",
      "image_url": "https://...",
      "price": 15.99
    },
    "borrowing": {
      "reserve_date": "2026-07-01T10:00:00.000Z",
      "borrow_date": "2026-07-03T14:30:00.000Z",
      "due_date": "2026-07-17"
    }
  },
  "message": "Return PIN verified successfully"
}
```

## Error Responses

### 400 — Invalid PIN format
```json
{
  "success": false,
  "data": null,
  "message": "A valid 6-digit PIN is required"
}
```

### 404 — PIN not found or expired
```json
{
  "success": false,
  "data": null,
  "message": "The PIN has expired or does not exist"
}
```

## Behavior

- Uses shared `findBorrowRecordByPin(pin, 'pending_return')` 
- **No branch check** — returns can be processed at any library branch (unlike borrow PIN verification)
- Returns user info, book info, and borrowing info for the inspection UI
