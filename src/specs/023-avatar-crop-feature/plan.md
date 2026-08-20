# Implementation Plan: Backend Avatar Cropping with Sharp

**Branch**: `023-avatar-crop-feature` | **Date**: 2026-06-30 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/023-avatar-crop-feature/spec.md`

---

## 1. Summary

Add a crop modal feature to the existing `AvatarUploader.tsx` component, delegating graphic cropping operations to the Node backend using the Sharp library. The uploader accepts a file or direct URL, opens a circular 280x280px preview canvas modal, allows zoom/drag scaling, and sends only the metadata (zoom, offsetX, offsetY) to the backend on Save. The backend retrieves the source image buffer, computes the source crop rectangle, extends the borders using `.extend()` if out-of-bounds, extracts the region, resizes the output to 512x512px, uploads to Cloudinary, and updates the user profile database record.

---

## 2. Technical Context

- **Client Stack**: Next.js, React, HTML5 Canvas API, Tailwind CSS
- **Server Stack**: Node.js, Express.js, Multer, Cloudinary SDK, Sharp (v0.35.2, already installed)
- **Key Constraints**:
  - The frontend MUST NOT export the canvas as a blob (avoids CORS issues on cross-domain URLs).
  - Multer limit must be increased to 5MB for the cropped flow, while the old flow continues to enforce a 2MB limit in its controller.
  - Crop math must translate frontend relative drawing offsets to source coordinates, using Sharp's pad-and-crop capabilities.
  - Image URL paste flow must inspect response headers for `Content-Type: image/*` before buffering content.
  - Object URLs must be revoked to prevent browser memory leaks.

---

## 3. Constitution Check

| Principle / Gate | Status | Description |
| :--- | :--- | :--- |
| **I. Component-Driven** | Compliant | Reuses the existing `AvatarUploader.tsx` component, keeping the crop modal inline as an internal sub-system. |
| **II. Data Fetching & State** | Compliant | Exposes a dedicated `POST /user/avatar/crop` endpoint that accepts multipart and JSON payloads. |
| **III. UI/UX Design** | Compliant | Implements circular previewing, slide/wheel zooming, and mouse dragging controls. |
| **IV. Performance** | Compliant | Inspects Content-Type headers before downloading URLs and manages object URL life cycles. |
| **V. Error Handling** | Compliant | Returns explicit 400 statuses for validation failures and 500 statuses for graphics errors. |
| **VI. Directory Hierarchy** | Compliant | Confines files to specs and source directories (`src/server/src`, `src/client/app`). |
| **VII. Layered Architecture** | Compliant | Adheres to Route $\rightarrow$ Controller $\rightarrow$ Service layering for crop actions. |
| **VIII. Import Paths** | Compliant | Directs imports using exact relative paths. |
| **IX. Theme & Localization** | Compliant | Leverages the existing active localization providers (`I18nProvider`) and Tailwind variables. |

---

## 4. Affected Files List

### Backend (`src/server/src/`)
- `middlewares/multer.middlewares.mjs`: Modify the global file size limit to `5 * 1024 * 1024` (5MB).
- `controllers/user.controllers.mjs`: Add a `file.size` check in the old `uploadAvatar` controller to manually enforce a 2MB limit (for backward compatibility).
- `services/avatar.crop.services.mjs`: **[New File]** Implement validators, URL downloaders, coordinate calculators, Sharp croppers, and database updates.
- `controllers/avatar.crop.controllers.mjs`: **[New File]** Implement the request parsing controller for the crop endpoint.
- `routes/user.routes.mjs`: Import the crop controller and map the endpoint `/avatar/crop` with Multer middleware.

### Frontend (`src/client/app/`)
- `components/molecules/AvatarUploader.tsx`: Implement the Crop Modal UI, mouse event tracking, wheel scaling, canvas circular rendering, preloading logic, and save dispatcher.

---

## 5. Detailed Tasks

### Phase 1: Backend Services (`avatar.crop.services.mjs`)
* **Task 1.1**: Create `server/src/services/avatar.crop.services.mjs`.
* **Task 1.2**: Implement `validateCropInput(zoom, offsetX, offsetY)` to verify zoom ranges ($[1.0, 5.0]$) and finite coordinates.
* **Task 1.3**: Implement `getImageBuffer(file, imageUrl)` using native `fetch` for URLs, checking response `Content-Type: image/*` before buffering.
* **Task 1.4**: Implement `computeCropRect(buffer, zoom, offsetX, offsetY)` fetching metadata using `sharp(buffer).metadata()` and executing inverse mathematical transformations.
* **Task 1.5**: Implement `cropAndUpload(buffer, cropRect)` to extend borders with `.extend()`, crop with `.extract()`, resize to $512 \times 512\text{px}$, and upload to Cloudinary (reusing `uploadToCloudinary` from `user.services.mjs`).
* **Task 1.6**: Implement and export default wrapper function `avatarCropService` orchestrating the full pipeline and executing SQL update queries.

### Phase 2: Backend Controller & Routing
* **Task 2.1**: Create `server/src/controllers/avatar.crop.controllers.mjs` defining `avatarCropController`.
* **Task 2.2**: Update global Multer limit to `5MB` in `server/src/middlewares/multer.middlewares.mjs`.
* **Task 2.3**: Update `uploadAvatar` controller in `server/src/controllers/user.controllers.mjs` to validate file size $\le 2\text{MB}$ before forwarding to `updateAvatarService`.
* **Task 2.4**: Map route `/avatar/crop` in `server/src/routes/user.routes.mjs`.

### Phase 3: Client Canvas Uploader Refactoring (`AvatarUploader.tsx`)
* **Task 3.1**: Open [AvatarUploader.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AvatarUploader.tsx) and declare new state hooks and refs.
* **Task 3.2**: Refactor `handleFileChange` to validate file requirements, produce a blob preview URL via `URL.createObjectURL(file)`, and launch the crop modal.
* **Task 3.3**: Refactor `handleUrlSubmit` to validate format, save image source, and open the crop modal.
* **Task 3.4**: Implement `drawCanvas()` drawing the image centered at coordinates derived from scale and drag offsets, clipping rendering bounds to a circle.
* **Task 3.5**: Wire up pointer move coordinates to modify relative drag offsets, clamping values inside the image bounds.
* **Task 3.6**: Implement Wheel interactions on the canvas using `onWheel` to update zoom levels.
* **Task 3.7**: Implement `handleSave()` building FormData or JSON depending on the payload format, dispatching requests to `/user/avatar/crop`, updating the profile, and dismissing the modal.
* **Task 3.8**: Insert Object URL cleanup (`URL.revokeObjectURL(imageSrc)`) on modal closure or unmount.

---

## 6. Explicit Design Decisions

* **Backward Compatibility**: Keep the existing `POST /user/avatar` endpoint completely unchanged. This ensures any third-party integrations or alternative paths remain functional.
* **Single Responsibility**: Create `avatar.crop.services.mjs` and `avatar.crop.controllers.mjs` as dedicated new modules rather than modifying the existing `user.services.mjs` or `user.controllers.mjs`. This maintains clean code separation and makes testing crop-related sub-routines simple.
* **Inline Crop Modal Component**: Embed the `CropModal` layout inline inside `AvatarUploader.tsx` instead of extracting it to a separate molecule file. Since the crop modal is only used internally by this component, keeping it inline prevents unnecessary prop drilling of multiple canvas states, refs, and drag event handlers.
* **Zoom Modes**: Support both interactive wheel-zoom for desktop mouse interactions and an accessible visual range slider for touch-screen devices and web accessibility.
* **Native HTTP requests**: Use Node 18+ native global `fetch` API instead of installing `node-fetch` or other third-party HTTP request library dependencies on the backend server.
* **Rounding Precision**: Apply `Math.round()` to all final extraction region bounds (`left`, `top`, `width`, `height`) prior to calling Sharp's `.extract()`, since Sharp only accepts integer coordinates and bounds.
