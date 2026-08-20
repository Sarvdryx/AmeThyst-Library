# Interface Contract: Search History API

**Base URL**: `http://localhost:5000/api/search/history`  
**Authentication**: Required (`verifyToken` middleware, Bearer token or cookie)

---

## 1. Get Top Recent Searches

Retrieves the top 5 most recent unique search queries submitted by the authenticated user.

- **HTTP Method**: `GET`
- **Path**: `/api/search/history`
- **Query Parameters**:
  - `limit` *(optional, integer, default: 5)*: Maximum number of recent search terms to return.

### Headers
```http
Authorization: Bearer <JWT_TOKEN>
```

### Response 200 OK
```json
{
  "success": true,
  "data": [
    {
      "search_id": "c1f2e3d4-5678-90ab-cdef-1234567890ab",
      "search_content": "Artificial Intelligence",
      "created_at": "2026-08-14T09:10:00.000Z"
    },
    {
      "search_id": "a9b8c7d6-e5f4-3210-fedc-ba9876543210",
      "search_content": "Data Structures",
      "created_at": "2026-08-14T08:45:00.000Z"
    }
  ]
}
```

### Response 401 Unauthorized
```json
{
  "success": false,
  "error": "Access token is missing or invalid"
}
```

---

## 2. Record Search Query

Saves a new search query or updates the timestamp of an existing search query for the authenticated user.

- **HTTP Method**: `POST`
- **Path**: `/api/search/history`

### Headers
```http
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

### Request Body
```json
{
  "search_content": "Quantum Computing"
}
```

### Response 200 OK / 201 Created
```json
{
  "success": true,
  "data": {
    "search_id": "e5f4d3c2-b1a0-9876-5432-10fedcba9876",
    "search_content": "Quantum Computing",
    "created_at": "2026-08-14T09:25:00.000Z"
  }
}
```

### Response 400 Bad Request
```json
{
  "success": false,
  "error": "search_content is required and cannot be empty"
}
```
