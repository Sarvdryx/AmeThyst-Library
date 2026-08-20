# API Contract: Hybrid Book Searching & Analytics Logging

## 1. Execute Hybrid Search
**Endpoint**: `POST /api/search`

### Request Body
```json
{
  "query": "dystopian rebellion teh",
  "logHistory": true,
  "filters": {
    "publicationDate": {
      "start": "2010",
      "end": "2026"
    },
    "genres": ["Sci-Fi", "Fiction"],
    "pageCount": {
      "min": 100,
      "max": 500
    },
    "languages": ["en", "vi"]
  }
}
```

*Note: `logHistory` decides whether the search execution results in a persistent log database write. Live keystroke debounces pass `logHistory: false`; User submission clicks, Enters, or Filter changes pass `logHistory: true`. Misspelled connector words like "teh" in the query will be filtered out by the backend regex pre-processor.*

### Success Response (200 OK)
```json
{
  "books": [
    {
      "id": "book_123",
      "title": "Fahrenheit 451",
      "author": "Ray Bradbury",
      "description": "Guy Montag is a fireman. His job is to destroy the most illegal of commodities...",
      "genres": ["Fiction", "Sci-Fi"],
      "isbn": "978-1451673319",
      "publisher": "Simon & Schuster",
      "publicationDate": "2012-01-10T00:00:00Z",
      "pageCount": 256,
      "language": "en",
      "coverImage": "/fahrenheit451.png",
      "rrfScore": 0.0333
    }
  ],
  "totalResults": 1,
  "searchHistoryId": "history_log_777"
}
```

*Note: If `logHistory: false` or the user is not logged in, `searchHistoryId` returns `null`.*

### Empty Matches Response (200 OK)
```json
{
  "books": [],
  "totalResults": 0,
  "searchHistoryId": null
}
```

---

## 2. Get User Search History
**Endpoint**: `GET /api/search/history`
**Headers**: `Authorization: Bearer <token>`

### Success Response (200 OK)
```json
{
  "history": [
    {
      "id": "history_log_777",
      "searchContent": "dystopian rebellion",
      "filters": {
        "publicationDate": { "start": "2010", "end": "2026" },
        "genres": ["Sci-Fi", "Fiction"],
        "pageCount": { "min": 100, "max": 500 },
        "languages": ["en", "vi"]
      },
      "clickedBookIds": ["book_123"],
      "timestamp": "2026-06-25T14:41:00Z"
    }
  ]
}
```

### Unauthorized Response (401 Unauthorized)
```json
{
  "error": "Authentication required to access search history"
}
```

---

## 3. Log Book Interaction (Intent Clicks)
**Endpoint**: `POST /api/search/history/click`
**Headers**: `Authorization: Bearer <token>`

### Request Body
```json
{
  "searchHistoryId": "history_log_777",
  "bookId": "book_123"
}
```

### Success Response (200 OK)
```json
{
  "message": "Click interaction logged successfully",
  "searchHistoryId": "history_log_777",
  "clickedBookIds": ["book_123"]
}
```

### Bad Request Response (400 Bad Request)
```json
{
  "error": "Missing searchHistoryId or bookId"
}
```

### Unauthorized Response (401 Unauthorized)
```json
{
  "error": "Authentication required to log click interaction"
}
```
