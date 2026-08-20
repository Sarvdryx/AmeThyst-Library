# API Contracts: Avatar Placement Redesign

This feature is a frontend redesign and layout refactoring. No backend API contracts or schemas were added or modified. The feature integrates with the following existing API endpoints:

## 1. Get Profile

* **Endpoint**: `GET /user/profile`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Response**:
  ```json
  {
    "id": 1,
    "username": "John Doe",
    "email": "john.doe@example.com",
    "phone_number": "0987654321",
    "avatar": "https://res.cloudinary.com/.../image.jpg",
    "role": "user",
    "borrow_num": 3
  }
  ```

## 2. Update Avatar

* **Endpoint**: `POST /user/avatar`
* **Headers**: `Authorization: Bearer <JWT_TOKEN>`
* **Request Body (Multipart/Form-Data)**:
  - `avatar`: File (image/*, <= 2MB)
* **Request Body (Application/JSON)**:
  - `avatarUrl`: String (valid HTTP/HTTPS URL)
* **Response**:
  ```json
  {
    "message": "Avatar updated successfully",
    "avatar": "https://res.cloudinary.com/.../new_image.jpg"
  }
  ```
