# API Contract: View Book Details

## 1. Get Book Details
**Endpoint**: `GET /api/library/books/:id`

### Success Response (200 OK)
```json
{
  "id": "1",
  "title": "Harry Potter and the Deathly Hallows",
  "author": "J.K. Rowling",
  "description": "A comprehensive exploration...",
  "category": "Fantasy",
  "isbn": "978-3-16-148410-0",
  "language": "English",
  "coverImage": "/Rectangle1270.png",
  "inventory": {
    "floor": 3,
    "wing": "East Wing",
    "shelfId": "AR-204",
    "availableCopies": 2
  }
}
```

## 2. Get Recommendations
**Endpoint**: `GET /api/library/books/:id/recommendations`

### Success Response (200 OK)
```json
[
  {
    "id": "101",
    "title": "Urbanism in the Digital Age",
    "author": "Dr. Julian Vance",
    "category": "URBAN PLANNING",
    "image": "/urban-planning.png"
  },
  {
    "id": "102",
    "title": "Sustainable Structuralism",
    "author": "Sarah G. Aris",
    "category": "SUSTAINABILITY",
    "image": "/sustainability.png"
  }
]
```

## 3. Create Reservation
**Endpoint**: `POST /api/library/reserve`
**Request Body**:
```json
{
  "userId": "user_123",
  "bookId": "1"
}
```

### Success Response (201 Created)
```json
{
  "id": "res_987",
  "status": "confirmed",
  "pickupDeadline": "2026-06-20T17:00:00Z"
}
```

### Error Response (400 Bad Request)
```json
{
  "error": "Book currently unavailable for reservation"
}
```
