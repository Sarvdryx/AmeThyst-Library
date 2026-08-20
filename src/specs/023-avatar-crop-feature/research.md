# Research & Architectural Decisions: Backend Avatar Cropping

This document details the research, technical decisions, and validation patterns for implementing crop modal interfaces and backend cropping.

## 1. Backend Code Structure & Module Separation

* **Decision**: Create dedicated backend modules `avatar.crop.services.mjs` and `avatar.crop.controllers.mjs` under `server/src/services/` and `server/src/controllers/` respectively.
* **Rationale**:
  * Prevents cluttering of the existing user account and profile routes/controllers.
  * Encapsulates the Sharp-specific logic inside a single domain-specific module, keeping the core user service files free from graphic processing overhead.
  * Facilitates easier testing and isolation of crop math functions.

---

## 2. Multer Configuration & 5MB Upload Limit

* **Decision**: Update `multer.middlewares.mjs` to set the global file size limit to `5MB` (from the original `2MB`), and implement endpoint-level size validation inside controllers.
* **Rationale**:
  * The spec dictates a maximum file size of `5MB` for the cropped avatar flow, but the existing endpoint `/user/avatar` requires a `2MB` limit.
  * Multer's instance configuration is static. Modifying the file limit to `5MB` on the shared instance allows the new `/user/avatar/crop` route to receive files up to 5MB.
  * The old `/user/avatar` controller already checks the size (or we can add a check) to reject files above 2MB, preserving backward compatibility constraints.

---

## 3. Remote URL Validation & Content-Type Inspection

* **Decision**: Perform a `HEAD` request or fetch content headers to check the `Content-Type` before downloading the entire resource into memory.
* **Rationale**:
  * Protects the server from Denial of Service (DoS) attacks where a user provides a URL pointing to a massive, non-image payload (e.g. a multi-gigabyte ISO).
  * Validates that the endpoint indeed returns an image (e.g., `image/jpeg`, `image/png`, `image/webp`) before Sharp processes it, yielding clean, specific client errors rather than generic Sharp parser crashes.

---

## 4. Sharp Extraction and Extending Out-of-Bounds Padding

* **Decision**: Check if the requested crop box extends beyond the unscaled image bounds and apply Sharp's `.extend()` function with a transparent background before extraction.
* **Rationale**:
  * Sharp's `.extract()` function will immediately throw an out-of-bounds error if any crop coordinates are negative, or if the width/height exceeds the source boundaries.
  * If a user offsets the image such that the preview canvas displays blank space (common when zooming out to $1.0$), the crop box extends beyond the image limits.
  * By calculating padding on each side ($\text{padLeft}$, $\text{padRight}$, $\text{padTop}$, $\text{padBottom}$) and extending the canvas with transparent pixels (`{ r: 0, g: 0, b: 0, alpha: 0 }`), we can safely extract any crop region without throwing errors, maintaining perfect parity with the frontend's visual representation.

---

## 5. Parity of Crop Math (Frontend vs Backend)

* **Decision**: Align coordinate scales using a normalized viewport size ($280\text{px}$) and round all final calculated float values to integers before invoking Sharp extraction.
* **Rationale**:
  * Frontend previews render graphics dynamically using Web Canvas coordinates based on active zoom/drag offset.
  * Backend needs to map this unscaled crop box back to the original source image.
  * Using exact matching equations and applying `Math.round()` / `Math.ceil()` consistently prevents decimal rounding discrepancies (which could result in shifted avatars or 1-pixel black borders).

---

## 6. Client Memory Management

* **Decision**: Leverage React state and reference bindings (`URL.createObjectURL` and `URL.revokeObjectURL`) to handle local file previews.
* **Rationale**:
  * Creating a data URL via `FileReader.readAsDataURL` consumes substantial memory for large files because the file is base64 encoded.
  * `URL.createObjectURL(file)` creates a lightweight URL string referencing the file directly in browser memory.
  * Invoking `URL.revokeObjectURL` upon crop modal dismissal or component unmount avoids memory leaks, keeping browser resource usage minimal.
