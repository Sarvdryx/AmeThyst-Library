# API Contracts: Profile & Avatar Endpoints

This document describes the request/response payloads and behaviors for the user profile endpoints.

---

## 1. Get User Profile

Fetches the profile details of the authenticated user, including the avatar, role, and borrow count.

- **HTTP Method**: `GET`
- **Path**: `/user/profile`
- **Headers**:
  - `Authorization: Bearer <jwt-token>` (Required)
  - `Accept: application/json`

### Success Response

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "user_id": "a2774336-fc6b-4a8f-ba2a-069be7bb0660",
    "email": "user.library@gmail.com",
    "username": "Library User",
    "phone_number": "+84123456789",
    "avatar": "https://res.cloudinary.com/demo/image/upload/v123456/sample.jpg",
    "role": "user",
    "borrow_num": 3,
    "is_google_account": false
  }
  ```

### Error Responses

- **Status Code**: `401 Unauthorized`
  - **Body**:
    ```json
    { "error": "Access denied. No token provided." }
    ```
- **Status Code**: `404 Not Found`
  - **Body**:
    ```json
    { "error": "User not found" }
    ```

---

## 2. Update User Avatar

Updates the user's avatar. Supports file uploads using `multipart/form-data` or URL pastes using `application/json`.

- **HTTP Method**: `POST`
- **Path**: `/user/avatar`
- **Headers**:
  - `Authorization: Bearer <jwt-token>` (Required)

### Flow A: File Upload (Multipart)

- **Headers**:
  - `Content-Type: multipart/form-data`
- **Body Form Fields**:
  - `avatar`: `<Binary Image File>` (Enforced maximum size of 2MB, MIME type `image/*`)

### Flow B: Paste Image URL (JSON)

- **Headers**:
  - `Content-Type: application/json`
- **Body JSON**:
  ```json
  {
    "avatarUrl": "https://example.com/path/to/my-avatar.png"
  }
  ```

### Success Response (Both Flows)

- **Status Code**: `200 OK`
- **Content-Type**: `application/json`
- **Body**:
  ```json
  {
    "user_id": "a2774336-fc6b-4a8f-ba2a-069be7bb0660",
    "email": "user.library@gmail.com",
    "username": "Library User",
    "phone_number": "+84123456789",
    "avatar": "https://res.cloudinary.com/demo/image/upload/v123456/sample.jpg",
    "role": "user"
  }
  ```

### Error Responses

- **Status Code**: `400 Bad Request` (Invalid file format, file too large, or invalid URL format)
  - **Body**:
    ```json
    { "error": "File size exceeds 2MB limit" }
    ```
- **Status Code**: `401 Unauthorized`
  - **Body**:
    ```json
    { "error": "Access denied. Invalid token." }
    ```
- **Status Code**: `500 Internal Server Error` (Cloudinary upload failed)
  - **Body**:
    ```json
    { "error": "Cloudinary upload service failed" }
    ```
