# Data Model & Schema Mapping: Backend Avatar Cropping

This document details the data structures, internal state objects, and backend query updates involved in the interactive avatar crop modal feature.

## 1. Crop Metadata Payload Structure

The crop metadata coordinates are generated on the frontend's preview viewport ($280 \times 280\text{px}$) and mapped back to the original image dimensions on the backend.

| Property | Data Type | Origin | Valid Range | Description |
| :--- | :--- | :--- | :--- | :--- |
| `zoom` | Number (Float) | Frontend Slider / Mouse Wheel | $1.0$ to $5.0$ inclusive | The scale multiplier applied to the base fitted image size. |
| `offsetX` | Number (Float) | Frontend Drag interaction | Finite numbers | Horizontal pixel shift inside the crop display container. |
| `offsetY` | Number (Float) | Frontend Drag interaction | Finite numbers | Vertical pixel shift inside the crop display container. |

---

## 2. Frontend Local Page State (`AvatarUploader.tsx`)

To manage the modal view and render preview frames onto the HTML Canvas, the component maintains the following React state variables:

| State Variable | Data Type | Default Value | Description |
| :--- | :--- | :--- | :--- |
| `cropModalOpen` | Boolean | `false` | Controls the visibility of the absolute crop modal overlay. |
| `imageSrc` | String (Nullable) | `null` | The local blob URL (for files) or pasted link (for URLs) loaded into the canvas. |
| `imageFile` | File (Nullable) | `null` | The raw selected `File` object (stored for upload). Null for URL paste flow. |
| `zoom` | Number | `1.0` | The active slider/scroll zoom scale. |
| `offset` | Object (`{ x, y }`) | `{ x: 0, y: 0 }` | The current horizontal and vertical offset values. |
| `isDragging` | Boolean | `false` | Flag indicating if a drag operation is in progress on the canvas. |
| `dragStart` | Object (`{ x, y }`) | `{ x: 0, y: 0 }` | The initial pointer/mouse coordinate when dragging starts. |

---

## 3. Database Update mapping

Once the backend performs cropping and uploads the output to Cloudinary, it stores the resulting secure URL directly in the `avatar` column of the `users` table.

```sql
UPDATE users
SET avatar = $1
WHERE user_id = $2
RETURNING user_id, email, username, phone_number, avatar, role;
```

* **Inputs**:
  * `$1` (string): The secure URL returned by Cloudinary (e.g. `https://res.cloudinary.com/...`).
  * `$2` (UUID): The authenticated `userId` extracted from the request's JWT token context.
