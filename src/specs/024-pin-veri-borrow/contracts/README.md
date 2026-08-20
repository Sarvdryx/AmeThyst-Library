# API Contracts: Librarian PIN Verification & Book Borrowing Workflow

All endpoints are mounted under the Express.js backend at `http://localhost:5000`.

**Common Headers**:
- `Authorization: Bearer <jwt-token>` — required for all librarian endpoints
- `Content-Type: application/json`

**Common Response Format**:
```json
{
  "success": true | false,
  "data": { ... } | null,
  "message": "Human-readable message"
}
```
