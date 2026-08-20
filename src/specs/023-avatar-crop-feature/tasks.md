# Implementation Tasks: Backend Avatar Cropping

**Input**: Feature specifications and design decisions from `specs/023-avatar-crop-feature/`

---

## Execution Order
The tasks must be executed in this strict sequence:
$$\text{B1} \longrightarrow \text{B2} \longrightarrow \text{B3} \longrightarrow \text{B4} \longrightarrow \text{Manual Verification} \longrightarrow \text{F1}$$

> [!IMPORTANT]
> The backend routes and services must be fully implemented and manually tested via curl or Postman after task **B4** is completed, before beginning frontend implementation of task **F1**.

---

## BACKEND

- [x] **B1: Install sharp**
  Run `cd src/server && npm install sharp` to ensure libvips bindings are properly installed on the environment. Note that native Node 18+ fetch is used, so no `node-fetch` dependency is needed.

- [x] **B2: Create `server/src/services/avatar.crop.services.mjs`**
  Implement the following subtasks:
  * [x] **B2a**: Implement `validateCropInput(zoom, offsetX, offsetY)` which validates coordinates and throws on invalid inputs.
  * [x] **B2b**: Implement `getImageBuffer(file, imageUrl)` returning a Buffer. Reuses the memoryStorage file buffer directly if a file is present, otherwise downloads the `imageUrl` using global fetch, checks that the response `Content-Type` is an image type, and converts `arrayBuffer` to Buffer.
  * [x] **B2c**: Implement `computeCropRect(buffer, zoom, offsetX, offsetY)` extracting unscaled image dimensions using `sharp(buffer).metadata()`, executing the inverse crop calculations, and returning `{ left, top, width, height }`.
  * [x] **B2d**: Implement `cropAndUpload(userId, buffer, cropRect)` extracting the crop window (calling `.extend()` if out of bounds), resizing to $512 \times 512\text{px}$, converting to Buffer, uploading via the existing `uploadToCloudinary` helper, updating the `avatar` column in the `users` table, and returning the secure URL.
  * [x] **B2e**: Export the orchestrating function `avatarCropService(userId, file, imageUrl, zoom, offsetX, offsetY)`.

- [x] **B3: Create `server/src/controllers/avatar.crop.controllers.mjs`**
  Implement the following subtasks:
  * [x] **B3a**: Implement `avatarCropController(req, res)` which reads `userId` from `req.user`, optional `file` from `req.file`, and metadata fields from `req.body`.
  * [x] **B3b**: Invoke `avatarCropService` with parsed inputs.
  * [x] **B3c**: Handle success responses with status 200 returning `res.json({ avatar })`, and catch errors returning 400 (validation) or 500 (cropping/uploading).

- [x] **B4: Update `server/src/routes/user.routes.mjs`**
  Implement the following subtasks:
  * [x] **B4a**: Import `avatarCropController`.
  * [x] **B4b**: Register route `POST /user/avatar/crop` using `verifyToken` and `upload.single('avatar')` Multer middleware.

---

## FRONTEND

- [x] **F1: Update `AvatarUploader.tsx`**
  Refactor [AvatarUploader.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AvatarUploader.tsx) with the following subtasks:
  * [x] **F1a**: Declare new state hooks: `cropModalOpen`, `imageSrc`, `imageFile`, `zoom`, `offset` (`x`, `y`), `isDragging`, and `dragStart`.
  * [x] **F1b**: Add React references: `canvasRef` and `imageRef`.
  * [x] **F1c**: Define constants: `CROP_DISPLAY_SIZE = 280` and `CROP_OUTPUT_SIZE = 512`.
  * [x] **F1d**: Refactor `handleFileChange` to validate MIME type/size and set `imageFile` + `imageSrc` (via `URL.createObjectURL(file)`) and open the modal instead of uploading immediately.
  * [x] **F1e**: Refactor `handleUrlSubmit` to validate format, set `imageSrc`, set `imageFile = null`, and open the modal.
  * [x] **F1f**: Implement `drawCanvas()` drawing the preloaded image inside a circular clipping path centered at coordinates derived from scale and drag offsets.
  * [x] **F1g**: Add `useEffect` to preload the `Image` when `imageSrc` changes, calculating `baseScale` and calling `drawCanvas()`.
  * [x] **F1h**: Add `useEffect` to redraw the canvas whenever `zoom` or `offset` states change.
  * [x] **F1i**: Implement pointer drag handlers (`onMouseDown`/`onMouseMove`/`onMouseUp`/`onMouseLeave`) to update dragging offsets.
  * [x] **F1j**: Implement `onWheel` scroll zoom handler, clamping zoom values between `1.0` and `5.0`.
  * [x] **F1k**: Implement `handleSave()` branching to build `FormData` (multipart, if `imageFile` is set) or JSON payload (if `imageUrl` is set), POSTing to `/user/avatar/crop`, and invoking `onAvatarUpdate(data.avatar)`.
  * [x] **F1l**: Render the `CropModal` inline within `AvatarUploader.tsx` as a fixed-position overlay with a 280x280 canvas, range slider, hint text, and Cancel/Save buttons.
  * [x] **F1m**: Call `URL.revokeObjectURL(imageSrc)` upon modal closure to avoid memory leaks.

---

## Definition of Done (DoD) Checklist

- [x] **File Upload Flow**: Selecting a file $\le 5\text{MB}$ opens the modal, enables position positioning, crops, uploads to Cloudinary, and updates the profile image successfully.
- [x] **URL Paste Flow**: Pasting a direct image URL opens the modal, allows position adjustments, downloads and crops backend-side, and saves successfully (demonstrating that cross-origin URL loads bypass browser CORS blocks).
- [x] **Zoom Boundary Enforcement**: Zoom functions correctly at the minimum bound ($1.0$) and the maximum bound ($5.0$).
- [x] **Clamping & Extending**: Offsetting or dragging the image far outside the canvas limits does not throw exceptions (padding with transparent background is applied and cropped region clamps properly).
- [x] **Client-side Size Validation**: Selecting files exceeding $5\text{MB}$ triggers client-side size errors and blocks uploader actions before the modal mounts.
- [x] **URL Format Checks**: Submitting invalid URL paths fails uploader validation and blocks actions before modal mounting.
- [x] **JWT Auth Checks**: Expired or missing Bearer JWT tokens return status 401.
- [x] **Server Error Dismissals**: Cloudinary, Sharp, or download failures return status 500, which is captured by the client and shown to the user as a localized error banner.
