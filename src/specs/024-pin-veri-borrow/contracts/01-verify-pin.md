# Verify PIN

Verifies a borrower's 6-digit PIN and validates the librarian's branch association.

## POST `/api/library/verify-pin`

### Request

```json
{
  "pin": "123456"
}
```

### Success Response (200)

```json
{
  "success": true,
  "data": {
    "borrow_id": "uuid-or-id",
    "borrower": {
      "username": "john_doe",
      "gender": "Male",
      "phone_number": "0123456789",
      "email": "john@example.com"
    },
    "book": {
      "title": "Quantum Linguistics",
      "author": "Dr. Sarah Chen",
      "publisher": "Academic Press",
      "genre": "Science",
      "price": 45.99
    }
  },
  "message": "PIN verified successfully"
}
```

### Error: PIN not found or expired (404)

```json
{
  "success": false,
  "data": null,
  "message": "The PIN has expired or does not exist."
}
```

### Error: Wrong branch (403)

```json
{
  "success": false,
  "data": null,
  "message": "You have arrived at the wrong book borrowing branch."
}
```

### Error: Unauthorized (401)

```json
{
  "success": false,
  "data": null,
  "message": "Authentication required"
}
```
