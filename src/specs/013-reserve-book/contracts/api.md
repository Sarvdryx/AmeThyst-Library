# API Contracts: Reserve Book Feature

**Date**: 2026-06-25
**Feature**: 013-reserve-book

## Base URL

```
http://localhost:5000/api
```

## Authentication

All authenticated endpoints require JWT token in Authorization header:

```
Authorization: Bearer <jwt_token>
```

Token is obtained from `POST /auth/login` or `POST /auth/register`.

---

## Endpoints

### 1. Reserve Book

**POST** `/library/reserve`

Reserve a book at a specific branch for the authenticated user.

**Request Headers**:
```
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

**Request Body**:
```json
{
  "bookId": "27161156",
  "branchId": 1
}
```

**Request Validation**:
- `bookId`: Required, string, must exist in `books` table
- `branchId`: Required, integer, must exist in `branches` table
- `Authorization`: Required, valid JWT token

**Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "bookId": "27161156",
    "bookTitle": "The Great Gatsby",
    "branchId": 1,
    "branchName": "Nguyen Van Cu Campus Library",
    "branchAddress": "227 Nguyen Van Cu Street, District 5, HCMC",
    "shelf": "NVC.H95",
    "reserveDate": "2026-06-25",
    "expiresAt": "2026-06-27T10:00:00Z",
    "status": "pending",
    "pin": "847291"
  }
}
```

**Response (400 Bad Request - Book Unavailable)**:
```json
{
  "success": false,
  "error": {
    "code": "BOOK_UNAVAILABLE",
    "message": "No available copies at the selected branch"
  }
}
```

**Response (400 Bad Request - Already Reserved)**:
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_RESERVED",
    "message": "You already have an active reservation for this book"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response (404 Not Found)**:
```json
{
  "success": false,
  "error": {
    "code": "BOOK_NOT_FOUND",
    "message": "Book not found"
  }
}
```

**Response (500 Internal Server Error)**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

---

### 2. Get Book Details (Existing - Enhanced)

**GET** `/library/books/:id`

Returns book details with per-branch availability.

**Request Headers**:
```
Authorization: Bearer <jwt_token> (optional)
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "27161156",
    "title": "The Great Gatsby",
    "author": ["F. Scott Fitzgerald"],
    "description": "A story of the fabulously wealthy Jay Gatsby...",
    "isbn": "9780743273565",
    "language": "English",
    "publisher": "Scribner",
    "publicationYear": 1925,
    "numPages": 180,
    "rating": 4.5,
    "coverImage": "https://covers.openlibrary.org/b/id/27161156-L.jpg",
    "inventory": [
      {
        "branchId": 1,
        "location": "Nguyen Van Cu Campus Library",
        "address": "227 Nguyen Van Cu Street, District 5, HCMC",
        "shelf": "NVC.H95",
        "availableCopies": 18
      },
      {
        "branchId": 2,
        "location": "Linh Trung Campus Library",
        "address": "Quarter 6, Linh Trung Ward, Thu Duc City, HCMC",
        "shelf": "LT.H51",
        "availableCopies": 12
      }
    ],
    "userReservation": null
  }
}
```

**Response (200 OK - User Has Reservation)**:
```json
{
  "success": true,
  "data": {
    "id": "27161156",
    "title": "The Great Gatsby",
    "inventory": [...],
    "userReservation": {
      "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "branchId": 1,
      "branchName": "Nguyen Van Cu Campus Library",
      "reserveDate": "2026-06-25",
      "expiresAt": "2026-06-27T10:00:00Z",
      "status": "pending",
      "pin": "847291"
    }
  }
}
```

**Notes**:
- `userReservation` is populated only if user is authenticated and has active reservation
- `inventory` array includes `branchId` for frontend branch selection

---

### 3. Cancel Reservation

**DELETE** `/library/reserve/:reservationId`

Cancel an active reservation.

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "message": "Reservation cancelled successfully",
    "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }
}
```

**Response (400 Bad Request - Cannot Cancel)**:
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL",
    "message": "Reservation cannot be cancelled (already borrowed or expired)"
  }
}
```

**Response (401 Unauthorized)**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**Response (403 Forbidden)**:
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "You can only cancel your own reservations"
  }
}
```

---

### 4. Get User Reservations

**GET** `/library/reservations`

Get all active reservations for the authenticated user.

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `status`: Filter by status (pending, borrowed, returned, expired, cancelled)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reservations": [
      {
        "reservationId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "bookId": "27161156",
        "bookTitle": "The Great Gatsby",
        "bookCover": "https://covers.openlibrary.org/b/id/27161156-L.jpg",
        "branchId": 1,
        "branchName": "Nguyen Van Cu Campus Library",
        "reserveDate": "2026-06-25",
        "expiresAt": "2026-06-27T10:00:00Z",
        "status": "pending",
        "pin": "847291"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

---

## Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `BOOK_UNAVAILABLE` | 400 | No available copies at selected branch |
| `ALREADY_RESERVED` | 400 | User already has active reservation for this book |
| `BOOK_NOT_FOUND` | 404 | Book does not exist |
| `BRANCH_NOT_FOUND` | 404 | Branch does not exist |
| `CANNOT_CANCEL` | 400 | Reservation cannot be cancelled |
| `FORBIDDEN` | 400 | User cannot access this reservation |
| `UNAUTHORIZED` | 401 | Authentication required or token invalid |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

- **Reserve Book**: 10 requests per minute per user
- **Get Book Details**: 60 requests per minute per user
- **Cancel Reservation**: 10 requests per minute per user

---

## Frontend Integration Notes

### Book Detail Page Flow

1. User navigates to `/library/[id]`
2. Page fetches book details with `GET /library/books/:id`
3. If authenticated, response includes `userReservation`
4. User clicks on branch card to select pickup location
5. User clicks "Reserve" button
6. Frontend sends `POST /library/reserve` with `bookId` and `branchId`
7. On success, page re-fetches book details to update availability
8. On error, display appropriate error message

### Authentication Flow

1. User must be logged in to reserve
2. If not logged in, redirect to login page
3. After login, return to book detail page
4. Include JWT token in all authenticated requests

### Branch Selection UI

1. Branch cards in availability grid become clickable
2. Selected branch highlighted with border color
3. Reserve button text updates to "Reserve from [Branch Name]"
4. Disabled state when no branches have availability