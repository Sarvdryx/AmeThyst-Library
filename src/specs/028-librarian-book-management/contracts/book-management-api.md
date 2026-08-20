# API Contracts: Librarian Book Management

**Base URL**: `http://localhost:5000/api/books`  
**Authorization**: Bearer Token / Session Cookie (Role: `librarian` or `admin`)

---

## 1. Create New Book Catalog & Branch Stocks

- **Endpoint**: `POST /api/books`
- **Auth Guard**: Required (`librarian` / `admin`)
- **Request Body**:
```json
{
  "title": "Fahrenheit 451",
  "original_title": "Fahrenheit 451",
  "description": "A dystopian novel by Ray Bradbury.",
  "num_pages": 249,
  "publisher": "Ballantine Books",
  "publication_date": "1953-10-19",
  "isbn": "9781451673319",
  "author": ["Ray Bradbury"],
  "genres": ["Dystopian", "Sci-Fi"],
  "language_code": "eng",
  "book_format": "Paperback",
  "price": 12.99,
  "image_url": "/uploads/covers/fahrenheit451.jpg",
  "branch_stocks": [
    {
      "branch_id": 1,
      "quantity": 10,
      "user_shelf_number": "104"
    },
    {
      "branch_id": 2,
      "quantity": 5,
      "user_shelf_number": "201"
    }
  ]
}
```

- **Success Response (201 Created)**:
```json
{
  "success": true,
  "data": {
    "book_id": "BK8291048210",
    "title": "Fahrenheit 451",
    "isbn": "9781451673319",
    "image_url": "/uploads/covers/fahrenheit451.jpg",
    "branch_stocks": [
      {
        "branch_id": 1,
        "quantity": 10,
        "available_quantity": 10,
        "shelf": "F104"
      },
      {
        "branch_id": 2,
        "quantity": 5,
        "available_quantity": 5,
        "shelf": "F201"
      }
    ]
  },
  "message": "Book catalog entry created successfully."
}
```

- **Error Responses**:
  - `400 Bad Request`: Form validation failure (e.g. malformed ISBN or negative price).
  - `403 Forbidden`: User role is not `librarian` or `admin`.
  - `409 Conflict`: `{"success": false, "error": "ISBN 9781451673319 already exists in the catalog."}`

---

## 2. Update Book Catalog Entry & Branch Stocks

- **Endpoint**: `PUT /api/books/:book_id`
- **Auth Guard**: Required (`librarian` / `admin`)
- **Request Body**:
```json
{
  "title": "Fahrenheit 451 (Special Edition)",
  "description": "Updated description text.",
  "price": 14.99,
  "image_url": "https://example.com/cover.jpg",
  "branch_stocks": [
    {
      "branch_id": 1,
      "quantity": 12,
      "user_shelf_number": "104"
    }
  ]
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "book_id": "BK8291048210",
    "title": "Fahrenheit 451 (Special Edition)",
    "shelf": "F104"
  },
  "message": "Book catalog record updated successfully."
}
```

---

## 3. Delete Book Catalog Entry or Branch Stock Row

- **Endpoint**: `DELETE /api/books/:book_id`
- **Query Params (Optional)**: `?branch_id=1` (If omitted, deletes book catalog record and all stock rows).
- **Auth Guard**: Required (`librarian` / `admin`)

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Book catalog record deleted successfully."
}
```

- **Error Response (400 Bad Request / 409 Conflict)**:
```json
{
  "success": false,
  "error": "Cannot delete book: 2 copies are currently borrowed or reserved."
}
```

---

## 4. Transfer Inventory Between Branches

- **Endpoint**: `POST /api/books/transfer`
- **Auth Guard**: Required (`librarian` / `admin`)
- **Request Body**:
```json
{
  "book_id": "BK8291048210",
  "from_branch_id": 1,
  "to_branch_id": 2,
  "transfer_quantity": 3,
  "destination_shelf_number": "201"
}
```

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "message": "Successfully transferred 3 copies from Branch 1 to Branch 2."
}
```

---

## 5. Upload Cover Image (Device or URL)

- **Endpoint**: `POST /api/books/upload-cover`
- **Auth Guard**: Required (`librarian` / `admin`)
- **Content-Type**: `multipart/form-data` (file upload) OR `application/json` (URL validation)

- **Success Response (200 OK)**:
```json
{
  "success": true,
  "image_url": "/uploads/covers/cover_17218293.png"
}
```
