# API Contracts: Backend Avatar Cropping

This document outlines the API contracts for the crop feature, detailing request parameters, payloads, validation rules, headers, and response formats.

## 1. Crop and Upload Avatar

* **Endpoint**: `/user/avatar/crop`
* **Method**: `POST`
* **Authentication**: Bearer JWT token required
* **Headers**:
  * `Authorization`: `Bearer <JWT_TOKEN>`

### Payload Options

The endpoint accepts two payload structures depending on the source of the avatar image.

#### A. File Upload Flow (Multipart Form Data)

Used when the user selects a local file.

* **Headers**:
  * `Content-Type`: `multipart/form-data`
* **Request Fields**:
  * `avatar` (File, Required): The raw image file. Size must be $\le 5\text{MB}$. MIME type must start with `image/`.
  * `zoom` (Number/String, Required): The zoom multiplier. Must be a numeric value between `1.0` and `5.0` inclusive.
  * `offsetX` (Number/String, Required): Horizontal displacement on the canvas. Must be a finite number.
  * `offsetY` (Number/String, Required): Vertical displacement on the canvas. Must be a finite number.

**Example Request (Raw Boundary)**:
```http
POST /user/avatar/crop HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="avatar"; filename="my_photo.png"
Content-Type: image/png

<binary-data>
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="zoom"

2.5
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="offsetX"

15
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="offsetY"

-42
------WebKitFormBoundary7MA4YWxkTrZu0gW--
```

---

#### B. Pasted URL Flow (JSON Payload)

Used when the user pastes a direct URL to an image.

* **Headers**:
  * `Content-Type`: `application/json`
* **Request Body (JSON)**:
  ```json
  {
    "imageUrl": "https://example.com/images/user_avatar.jpg",
    "zoom": 1.5,
    "offsetX": 0,
    "offsetY": -12.5
  }
  ```
* **Validation Rules**:
  * `imageUrl`: A valid URL string. Should prioritize HTTPS but support HTTP. Must resolve to a resource with an `image/*` Content-Type header.
  * `zoom`: Floating-point number between `1.0` and `5.0` inclusive.
  * `offsetX`: Finite number.
  * `offsetY`: Finite number.

---

### Responses

#### 200 OK (Successful Upload)
Returned when the image has been fetched/read, mathematically cropped using Sharp, resized to $512 \times 512\text{px}$, and uploaded to Cloudinary.
* **Content-Type**: `application/json`
* **Response Body**:
  ```json
  {
    "avatar": "https://res.cloudinary.com/dwxdthllf/image/upload/v1700000000/avatars/cropped_avatar.jpg"
  }
  ```

#### 400 Bad Request (Validation Errors)
Returned if inputs fail format validation, file is missing, size > 5MB, or zoom is out-of-bounds.
* **Content-Type**: `application/json`
* **Response Body**:
  ```json
  {
    "error": "Validation failed: zoom must be between 1.0 and 5.0"
  }
  ```

#### 500 Internal Server Error (Server Processing Failures)
Returned if URL fetching, Sharp cropping, or Cloudinary upload fails.
* **Content-Type**: `application/json`
* **Response Body**:
  ```json
  {
    "error": "Failed to crop and upload avatar: Connection timed out when fetching image URL."
  }
  ```
