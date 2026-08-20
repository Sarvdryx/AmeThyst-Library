# API Contracts: Profile Details Redesign

This document outlines the API contracts for retrieving and updating user profiles, showing the camelCase naming convention for the client.

## 1. Retrieve Profile

* **Endpoint**: `GET /user/profile`
* **Method**: `GET`
* **Headers**:
  - `Authorization`: `Bearer <JWT_TOKEN>`
* **Response Body (200 OK - application/json)**:
  ```json
  {
    "userId": "d3b07384-d113-4956-a5cc-9d10e012ac26",
    "email": "reader@example.com",
    "username": "Alex Johnson",
    "phoneNumber": "0987654321",
    "avatar": "https://res.cloudinary.com/dwxdthllf/image/upload/v1700000000/avatar.jpg",
    "role": "user",
    "borrowNum": 2,
    "maxBorrowLimit": 5,
    "occupation": "Student",
    "birthDate": "2002-05-15",
    "gender": "female",
    "hometown": "Hanoi",
    "description": "Avid historical fiction reader and computer science major."
  }
  ```

---

## 2. Update Profile

* **Endpoint**: `PUT /user/profile`
* **Method**: `PUT`
* **Headers**:
  - `Authorization`: `Bearer <JWT_TOKEN>`
  - `Content-Type`: `application/json`
* **Request Body (application/json)**:
  - Supports updating one or more profile fields.
  ```json
  {
    "username": "Alex Johnson",
    "phoneNumber": "0912345678",
    "occupation": "Software Engineer",
    "birthDate": "2000-08-25",
    "gender": "female",
    "hometown": "Da Nang",
    "description": "Developer interested in library science and database indexing."
  }
  ```
* **Response Body (200 OK - application/json)**:
  ```json
  {
    "userId": "d3b07384-d113-4956-a5cc-9d10e012ac26",
    "email": "reader@example.com",
    "username": "Alex Johnson",
    "phoneNumber": "0912345678",
    "avatar": "https://res.cloudinary.com/dwxdthllf/image/upload/v1700000000/avatar.jpg",
    "role": "user",
    "borrowNum": 2,
    "occupation": "Software Engineer",
    "birthDate": "2000-08-25",
    "gender": "female",
    "hometown": "Da Nang",
    "description": "Developer interested in library science and database indexing."
  }
  ```
* **Response Body (400 Bad Request)**:
  - Occurs if validations fail (e.g. invalid phone number format, empty full name).
  ```json
  {
    "error": "Invalid phone number format. Must be 9-10 digits."
  }
  ```
