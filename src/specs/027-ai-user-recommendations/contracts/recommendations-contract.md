# Interface Contract: AI Recommendations API

This contract specifies the API endpoints, request/response headers, and schemas for the recommendation system backend.

## 1. Get Recommendations
Fetches active personalized ("Based on your reading history") and system-wide ("Trending this week") recommendations for the logged-in user.

- **Endpoint**: `GET /api/dashboard/user/recommendations`
- **Authentication**: Required (`verifyToken` middleware)
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response**:
  - **Status**: `200 OK`
  - **Body (JSON)**:
    ```json
    {
      "success": true,
      "data": {
        "historyBased": [
          {
            "id": "1001",
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "coverImage": "https://example.com/clean_code.jpg"
          }
        ],
        "trending": [
          {
            "id": "1002",
            "title": "Design Patterns",
            "author": "Erich Gamma, Richard Helm",
            "coverImage": "https://example.com/design_patterns.jpg"
          }
        ]
      }
    }
    ```

---

## 2. Renew Recommendations
Marks all current active recommendations for the logged-in user as renewed (archived) and triggers the candidate generator and GBDT ranker to create a fresh recommendation list.

- **Endpoint**: `POST /api/dashboard/user/recommendations/renew`
- **Authentication**: Required (`verifyToken` middleware)
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response**:
  - **Status**: `200 OK`
  - **Body (JSON)**:
    ```json
    {
      "success": true,
      "message": "Recommendations successfully regenerated.",
      "data": {
        "historyBased": [
          {
            "id": "1003",
            "title": "Refactoring",
            "author": "Martin Fowler",
            "coverImage": "https://example.com/refactoring.jpg"
          }
        ]
      }
    }
    ```

---

## 3. Log Recommendation Click
Tracks a user's click interaction on a recommended book, updating the click status to prevent display repetition and logging user response metrics.

- **Endpoint**: `POST /api/dashboard/user/recommendations/:bookId/click`
- **Authentication**: Required (`verifyToken` middleware)
- **Headers**:
  - `Authorization: Bearer <token>`
- **URL Parameters**:
  - `bookId`: `string` (The unique ID of the clicked book)
- **Response**:
  - **Status**: `200 OK`
  - **Body (JSON)**:
    ```json
    {
      "success": true,
      "message": "Recommendation click interaction successfully logged."
    }
    ```

## 4. Retraining Status Query (Librarian/Admin Only)
Fetches the logs and status of the background machine learning retraining tasks.

- **Endpoint**: `GET /api/dashboard/admin/recommendations/retrain-status`
- **Authentication**: Required (`verifyToken` and `authorizeRole('admin')` middleware)
- **Headers**:
  - `Authorization: Bearer <token>`
- **Response**:
  - **Status**: `200 OK`
  - **Body (JSON)**:
    ```json
    {
      "success": true,
      "data": {
        "lastRetrainedAt": "2026-07-05T02:00:00.000Z",
        "status": "idle",
        "lastRunDurationSeconds": 45.2,
        "logs": [
          "2026-07-05T02:00:00Z: Starting GraphSAGE pipeline training...",
          "2026-07-05T02:00:25Z: GraphSAGE representation compilation complete.",
          "2026-07-05T02:00:25Z: Starting LightGBM ranker fit...",
          "2026-07-05T02:00:45Z: LightGBM model saved successfully to lightgbm_ranker.txt."
        ]
      }
    }
    ```
