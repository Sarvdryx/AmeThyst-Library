# API Contract: Book Wishlist

## General Settings
- **Base URL**: `/api/wishlist`
- **Authentication**: JWT Bearer token required in `Authorization` header (`Bearer <token>`).
- **Authorization**: Accessible by users with `role: 'user'` only.

---

## Endpoints

### 1. Get User Wishlist
Retrieve the list of books in the authenticated user's wishlist.

- **Method**: `GET`
- **Path**: `/api/wishlist`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  [
    {
      "id": "1",
      "title": "Harry Potter and the Sorcerer's Stone",
      "author": "J.K. Rowling",
      "coverImage": "https://example.com/covers/hp1.jpg"
    }
  ]
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token provided or token invalid.
  - `403 Forbidden`: User role is not `user`.

---

### 2. Check Book Wishlist Status
Check if a specific book is in the authenticated user's wishlist.

- **Method**: `GET`
- **Path**: `/api/wishlist/status/:bookId`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "wishlisted": true
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token provided.
  - `403 Forbidden`: User role is not `user`.

---

### 3. Add Book to Wishlist
Add a book to the user's wishlist in Postgres and trigger a Memgraph sync.

- **Method**: `POST`
- **Path**: `/api/wishlist/:bookId`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Book successfully added to wishlist"
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Book is already in the wishlist.
  - `401 Unauthorized`: No token provided.
  - `403 Forbidden`: User role is not `user`.
  - `404 Not Found`: Book ID does not exist in the database.

---

### 4. Remove Book from Wishlist
Remove a book from the user's wishlist in Postgres and trigger a Memgraph sync.

- **Method**: `DELETE`
- **Path**: `/api/wishlist/:bookId`
- **Headers**:
  - `Authorization: Bearer <token>`
- **Success Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Book successfully removed from wishlist"
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: No token provided.
  - `403 Forbidden`: User role is not `user`.
  - `404 Not Found`: Book was not present in the user's wishlist.
