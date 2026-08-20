# API Contract: Book Filtering Endpoint

**Endpoint**: `GET /api/library/books`

This contract details the queries accepted by the backend book listing API for advanced filtering, and standard responses.

## Request

### Query Parameters

| Parameter | Type | Required | Description | Example |
|---|---|---|---|---|
| `page` | Integer | No | Page number for pagination (Default: `1`). | `page=2` |
| `limit` | Integer | No | Number of books per page (Default: `24`). | `limit=12` |
| `genres` | String | No | Comma-separated list of genres. | `genres=Physics,Mathematics` |
| `branches` | String | No | Comma-separated list of branch IDs. | `branches=1,2` |
| `availableOnly` | Boolean | No | Return only books with available stock (`available_quantity > 0`). | `availableOnly=true` |
| `startYear` | Integer | No | Lower bound for publication year. | `startYear=2015` |
| `endYear` | Integer | No | Upper bound for publication year. | `endYear=2025` |

*Note: For the "Others" genre fallback, the keyword `Others` is passed in the query parameter (e.g. `genres=Others`), which queries books that do not overlap with standard mapped genres.*

---

## Responses

### 1. Success Response (200 OK)
Returns the list of filtered books and pagination metadata.

* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "books": [
      {
        "id": "27161156",
        "title": "Hillbilly Elegy: A Memoir of a Family and Culture in Crisis",
        "author": "J.D. Vance",
        "isbn": "9780062300546",
        "coverImage": "https://m.media-amazon.com/images/S/compressed.photo.goodreads.com/books/1463569814i/27161156.jpg"
      }
    ],
    "totalBooks": 1,
    "totalPages": 1,
    "currentPage": 1
  }
  ```

### 2. Validation Error (400 Bad Request)
Returned when start year is greater than end year or parameters are malformed.

* **Headers**: `Content-Type: application/json`
* **Body**:
  ```json
  {
    "error": "Validation Error",
    "details": "startYear cannot be greater than endYear"
  }
  ```
