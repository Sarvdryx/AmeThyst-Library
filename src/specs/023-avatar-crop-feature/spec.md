# Feature Specification: Backend Avatar Cropping with Sharp

**Feature Branch**: `023-avatar-crop-feature`

**Created**: 2026-06-30

**Status**: Draft

**Input**: Add a crop modal feature to the existing `AvatarUploader.tsx` component in the `AmeThyst-Library` project, with backend cropping done via the `Sharp` library (not frontend canvas export, to avoid CORS issues with cross-domain image URLs). When the user uploads a file or pastes a URL, open a crop modal showing a circular 280x280px preview canvas. The user can drag the image (`offsetX`/`offsetY`) and zoom (1.0–5.0). On Save, the frontend sends ONLY metadata (`zoom`, `offsetX`, `offsetY`) plus the file or URL — it does NOT export the canvas as an image. The backend receives the request, downloads the image (if URL) or reads the buffer (if file), crops it using Sharp according to the same crop math as the frontend preview, uploads the cropped result to Cloudinary, and returns the `secure_url`. Keep the existing `POST /user/avatar` endpoint unchanged for backward compatibility.

---

## User Scenarios & Testing

### User Story 1 - Interactive Avatar Crop Modal (Priority: P1)
As a logged-in user, I want to interactively position and zoom my uploaded file or pasted image URL in a circular preview modal before saving, so that I can control exactly how my avatar is cropped.

**Why this priority**: Core user experience requirement. Eliminates CORS-related canvas export issues on the frontend and provides a consistent cropping interface for all avatars.

**Independent Test**:
1. Log in and navigate to the `/profile` page.
2. Under the profile sidebar, hover over the avatar and click "Upload File" or "Paste Image URL".
3. Upload a file or paste a valid URL (e.g. from an external domain).
4. Verify that a Crop Modal opens, displaying a circular 280x280px preview of the image.
5. Zoom the image using the slider (range 1.0 to 5.0) and drag to position the image inside the crop circle.
6. Click "Save".
7. Verify that the modal closes, a loading spinner displays, and the updated cropped image is successfully set as the avatar in the sidebar.

**Acceptance Scenarios**:
1. **Given** a user chooses to upload a file or paste a URL, **When** the image is loaded, **Then** a crop modal opens showing a circular `280px` canvas.
2. **Given** the crop modal is open, **When** the user drags the image or adjusts the slider, **Then** the canvas updates the preview in real-time, matching the zoom (1.0 to 5.0) and offset constraints.
3. **Given** the user clicks "Save", **When** the request is initiated, **Then** only the crop metadata (`zoom`, `offsetX`, `offsetY`) and the original file/URL are sent to the backend. The frontend MUST NOT invoke canvas export to generate a cropped file.
4. **Given** the save is successful, **When** the backend returns the new avatar URL, **Then** the crop modal closes and the avatar updates in the application.

---

### User Story 2 - Backend Cropping via Sharp (Priority: P1)
As a system architect, I want the backend to perform all actual cropping operations using the Sharp library based on coordinates sent by the frontend, so that cross-domain image assets can be cropped without encountering browser CORS issues.

**Why this priority**: Essential to resolve canvas drawing and export violations on cross-origin image URLs.

**Independent Test**:
1. Run backend tests or trigger the new endpoint `POST /user/avatar/crop` using a REST client (e.g., Postman).
2. Send a multipart request with a valid image file and crop metadata (`zoom = 2.0`, `offsetX = 10`, `offsetY = -20`).
3. Verify that the response status is 200 and the returned avatar URL displays a cropped image of `512x512px` dimension.
4. Repeat using a JSON payload containing an external `imageUrl` (e.g., `https://images.unsplash.com/photo-...`) along with crop metadata. Verify that the image is downloaded, cropped, and saved successfully.

**Acceptance Scenarios**:
1. **Given** a valid crop request to `POST /user/avatar/crop`, **When** the payload is processed, **Then** the backend downloads/reads the image and correctly computes the crop window using the inverse crop math.
2. **Given** the calculated crop window extends beyond the original image dimensions, **When** Sharp crops the image, **Then** the backend uses Sharp's `.extend()` to pad the image before cropping, preventing out-of-bounds failures.
3. **Given** a crop is successfully performed, **When** outputted, **Then** the image is resized to exactly `512x512px`, uploaded to Cloudinary, and the new secure URL is returned.

---

## Technical Specifications & Constants

### Constants
The following constants are shared conceptually between frontend and backend:
* **`CROP_DISPLAY_SIZE`** = `280` (The size of the crop viewport/canvas on the UI in pixels).
* **`CROP_OUTPUT_SIZE`** = `512` (The final size of the cropped image uploaded to Cloudinary).
* **`MIN_ZOOM`** = `1.0`
* **`MAX_ZOOM`** = `5.0`

### Crop Mathematics

The frontend renders the preview forward, and the backend computes the inverse to extract the exact source crop rectangle.

#### 1. Frontend Preview Math (Forward Rendering)
Let the original image dimensions be `imgWidth` and `imgHeight`.
* **`baseScale`**: Scale factor to fit the image inside the display container.
  $$\text{baseScale} = \min\left(\frac{\text{CROP\_DISPLAY\_SIZE}}{\text{imgWidth}}, \frac{\text{CROP\_DISPLAY\_SIZE}}{\text{imgHeight}}\right)$$
* **`scale`**: Active scale factor including the user's zoom.
  $$\text{scale} = \text{baseScale} \times \text{zoom}$$
* **`drawWidth` & `drawHeight`**: Dimensions of the image drawn on the canvas.
  $$\text{drawWidth} = \text{imgWidth} \times \text{scale}$$
  $$\text{drawHeight} = \text{imgHeight} \times \text{scale}$$
* **`drawX` & `drawY`**: Top-left coordinates where the image is drawn on the display container, relative to the canvas origin `(0,0)`.
  $$\text{drawX} = \frac{\text{CROP\_DISPLAY\_SIZE} - \text{drawWidth}}{2} + \text{offsetX}$$
  $$\text{drawY} = \frac{\text{CROP\_DISPLAY\_SIZE} - \text{drawHeight}}{2} + \text{offsetY}$$

#### 2. Backend Inverse Math (Source Crop Window Extraction)
Given the metadata `zoom`, `offsetX`, and `offsetY` received from the frontend:
* **`scale`**: Calculated identically using `baseScale` and `zoom`.
* **`cropX_scaled` & `cropY_scaled`**: Coordinates of the image relative to the crop viewport.
  $$\text{cropX\_scaled} = \frac{\text{CROP\_DISPLAY\_SIZE} - \text{imgWidth} \times \text{scale}}{2} + \text{offsetX}$$
  $$\text{cropY\_scaled} = \frac{\text{CROP\_DISPLAY\_SIZE} - \text{imgHeight} \times \text{scale}}{2} + \text{offsetY}$$
* **`left` & `top`**: Coordinates of the crop window's top-left corner relative to the original image's unscaled origin.
  $$\text{left} = -\frac{\text{cropX\_scaled}}{\text{scale}}$$
  $$\text{top} = -\frac{\text{cropY\_scaled}}{\text{scale}}$$
* **`cropW` & `cropH`**: Width and height of the crop window relative to the original image's unscaled coordinates.
  $$\text{cropW} = \text{cropH} = \frac{\text{CROP\_DISPLAY\_SIZE}}{\text{scale}}$$

#### 3. Handling Out-of-Bounds & Padding
If the crop window coordinates (`left`, `top`) go out of bounds (e.g. negative values) or if `left + cropW` or `top + cropH` exceed the image size, we calculate the required padding on each edge:
$$\text{padLeft} = \text{left} < 0 ? \lceil -\text{left} \rceil : 0$$
$$\text{padRight} = (\text{left} + \text{cropW}) > \text{imgWidth} ? \lceil (\text{left} + \text{cropW}) - \text{imgWidth} \rceil : 0$$
$$\text{padTop} = \text{top} < 0 ? \lceil -\text{top} \rceil : 0$$
$$\text{padBottom} = (\text{top} + \text{cropH}) > \text{imgHeight} ? \lceil (\text{top} + \text{cropH}) - \text{imgHeight} \rceil : 0$$

If any padding is greater than `0`, we perform an extend operation in Sharp:
```javascript
sharpImg = sharpImg.extend({
  top: padTop,
  bottom: padBottom,
  left: padLeft,
  right: padRight,
  background: { r: 0, g: 0, b: 0, alpha: 0 } // transparent background
});
```
After extending, the image dimensions are updated:
$$\text{newWidth} = \text{imgWidth} + \text{padLeft} + \text{padRight}$$
$$\text{newHeight} = \text{imgHeight} + \text{padTop} + \text{padBottom}$$
The adjusted crop window coordinates on the padded image are:
$$\text{newLeft} = \text{left} + \text{padLeft}$$
$$\text{newTop} = \text{top} + \text{padTop}$$

We round all parameters to integers and clamp to avoid float precision bugs:
$$\text{finalWidth} = \text{round}(\text{cropW})$$
$$\text{finalHeight} = \text{round}(\text{cropH})$$
$$\text{finalLeft} = \max(0, \min(\text{newWidth} - \text{finalWidth}, \text{round}(\text{newLeft})))$$
$$\text{finalTop} = \max(0, \min(\text{newHeight} - \text{finalHeight}, \text{round}(\text{newTop})))$$

---

## Architectural & Design Requirements

### 1. Frontend Client Updates (`AvatarUploader.tsx`)
* **Zoom Limit**: Expand the slider's `max` to `5.0`.
* **State Updates**: Ensure `zoom`, `offsetX`, and `offsetY` are captured in the component state.
* **Remove Canvas Export**: Disable exporting canvas as a blob on Save (`handleConfirmCrop`).
* **Payload Structure**:
  * **File Upload**: Submit a `FormData` request to `POST /user/avatar/crop` containing:
    * `avatar`: The raw selected `File` object.
    * `zoom`: Floating-point value of the zoom multiplier.
    * `offsetX`: Numeric offset along the X axis.
    * `offsetY`: Numeric offset along the Y axis.
  * **URL Paste**: Submit a JSON request to `POST /user/avatar/crop` containing:
    * `imageUrl`: The pasted image URL.
    * `zoom`: Floating-point value.
    * `offsetX`: Numeric offset.
    * `offsetY`: Numeric offset.

### 2. Backend Server Updates
* **Endpoint mapping**: Register `POST /user/avatar/crop` in `src/server/src/routes/user.routes.mjs` with `verifyToken` middleware.
* **Multer Middleware**: Create a new multer configuration or adjust the limit dynamically for `POST /user/avatar/crop` to allow file uploads up to `5MB` (MIME type must match `image/*`).
* **Validation Middleware/Schema**:
  * Validate presence of either `req.file` or `req.body.imageUrl`.
  * Validate metadata parameters:
    * `zoom`: Number between `1.0` and `5.0` inclusive.
    * `offsetX`, `offsetY`: Finite numbers.
  * For URLs: Check format validity. Reject non-image Content-Types.
* **Service Layer**:
  * Implement an image download utility for paste URL flow using the native `fetch` API.
  * Load the image into Sharp to read metadata (`width` and `height`).
  * Execute the inverse crop math and extract the region using Sharp's `.extend()` and `.extract()`.
  * Resize the output to `512x512px` and upload the buffer to Cloudinary.
  * Update the user profile's avatar URL in PostgreSQL and return the updated user object.

---

## API Contract

### Endpoint: `POST /user/avatar/crop`
Requires a Bearer JWT Token in the `Authorization` header.

#### Request Types

**Type 1: Multipart Form Data (File Upload)**
* **Headers**: `Content-Type: multipart/form-data`, `Authorization: Bearer <token>`
* **Fields**:
  * `avatar` (File): Image file (PNG, JPEG, WebP, etc.), size <= 5MB.
  * `zoom` (String/Number): Zoom factor, e.g., `2.5`
  * `offsetX` (String/Number): e.g., `120`
  * `offsetY` (String/Number): e.g., `-45`

**Type 2: JSON Payload (Pasted URL)**
* **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`
* **Body**:
  ```json
  {
    "imageUrl": "https://example.com/images/avatar.jpg",
    "zoom": 1.5,
    "offsetX": 0,
    "offsetY": -10
  }
  ```

#### Response Types

**Success (200 OK)**
* **Body**:
  ```json
  {
    "avatar": "https://res.cloudinary.com/demo/image/upload/v1234567890/avatars/xxxxxx.jpg"
  }
  ```

**Client Error (400 Bad Request)**
Returned when validation fails (e.g. files > 5MB, missing zoom, zoom out-of-bounds, invalid URL).
* **Body**:
  ```json
  {
    "error": "Validation failed: Zoom must be between 1.0 and 5.0"
  }
  ```

**Server Error (500 Internal Server Error)**
Returned when downloading, Sharp cropping, or Cloudinary upload fails.
* **Body**:
  ```json
  {
    "error": "Failed to crop and upload avatar: [Error Detail]"
  }
  ```

---

## Risks, Mitigations & Implementation Notes

| Identified Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| **URL resolves to non-image content** | Crash or security issue on backend when Sharp tries to parse HTML/malicious payload. | Perform a `HEAD` request or check the `Content-Type` header of the fetched resource before parsing. Reject if it is not an `image/*` MIME type. |
| **Out-of-bounds coordinates** | Sharp throws an exception if crop parameters specify areas outside the image canvas. | Implement the `.extend()` padding fallback logic in the backend. Clamp computed coordinates using `Math.max` and `Math.min` to ensure they lie strictly within the padded dimensions. |
| **Float calculation mismatch** | Visual differences between frontend preview and backend result due to floats. | Ensure identical rounding formulas (`Math.round`, `Math.ceil`) are used in coordinate conversion, and use a standard viewport coordinate space. |
| **Slow URL download or Cloudinary timeout** | Server request hangs, tying up API resources and causing gateway timeout. | Set a connection/read timeout (e.g., 5 seconds) on URL fetching and wrap the Cloudinary upload stream in a Promise that rejects on timeout. |
| **Redirect loops on pasted URLs** | Server hangs fetching URLs with deep redirects. | Node 18+ native `fetch` follows redirects (302) automatically, but request settings should limit redirects or enforce an absolute timeout. |

---

## Backward Compatibility
* The existing `POST /user/avatar` endpoint **MUST** remain completely unchanged. It continues to accept normal avatars (uncropped) directly to Cloudinary or save URLs raw for third-party clients that do not leverage the crop modal.
* The frontend component `AvatarUploader.tsx` will switch entirely to `POST /user/avatar/crop` for its main flow but fallback safely to saving the raw URL or throwing errors if the crop endpoint fails.
