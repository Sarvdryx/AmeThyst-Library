# Research Notes: Avatar Upload and Profile Page Enhancements

This document captures the research and architectural decisions for implementing the avatar upload flows and read-only profile enhancement features.

## Research Topic 1: Cloudinary Integration with Multer Memory Storage

### Decision
Configure `multer` using `memoryStorage` and restrict file sizes to 2MB. Use Cloudinary's Node.js SDK to stream the image buffer directly from memory to Cloudinary without writing temporary files to the disk.

### Rationale
- **Security & Ephemerality**: Using memory storage prevents local disk writes, eliminating the risk of temporary file leaks or directory traversal attacks.
- **Stream Upload**: Cloudinary's `uploader.upload_stream` handles streams efficiently. We wrap this stream upload in a Promise so it integrates cleanly with our async-await service layer architecture.
- **MIME & Size Restrictions**: Restricting file sizes directly in the `multer` configuration protects the server from Denial of Service (DoS) attacks via oversized payloads.

### Alternatives Considered
- **Multer Disk Storage**: Storing files locally on the server before uploading to Cloudinary. Rejected because it requires managing local server directory permissions, temporary file cleanup, and poses security and disk depletion risks.

---

## Research Topic 2: Dual Content-Type Controller for Avatar Update

### Decision
Expose a single unified endpoint `POST /user/avatar`. The route handler will accept both `multipart/form-data` and `application/json` requests.
- If `req.file` exists, process the file buffer via Cloudinary.
- If `req.body.avatarUrl` exists, validate the URL format and save it directly.

### Rationale
- **API Simplicity**: A single endpoint keeps routing simple and matches the logical action of "setting an avatar" from the client's perspective.
- **Backend Cleanliness**: Shared authorization middleware (`verifyToken`) and database update logic are consolidated.

### Alternatives Considered
- **Separate Endpoints**: Creating `/user/avatar/upload` and `/user/avatar/url`. Rejected because it unnecessarily duplicates route setup, token verification, and database updating logic.

---

## Research Topic 3: Frontend Atomic Component Structure

### Decision
Build a new `AvatarUploader` component under `src/client/app/components/molecules/`. 
- Reuse/extend the existing atomic components (like `Button`, `Input`, or fallback icons).
- Wrap the upload and paste triggers in a hover overlay on the circular avatar.
- Handle state and file selection locally, dispatching the final file/URL to the API and notifying the parent template (`ProfileTemplate`) on success.

### Rationale
- **Core Principle I (Component-Driven)**: Promotes code reusability and isolated testing of the avatar component.
- **UX Excellence**: Overlay hover indicators are standard premium UI patterns for profile avatar editing.

### Alternatives Considered
- **Inlining in ProfileTemplate**: Implementing the upload inputs and paste fields directly within the main profile template. Rejected because it leads to bloated files, violates the Atomic Design hierarchy, and makes it harder to reuse the uploader elsewhere.

---

## Research Topic 4: Localization & Theme Compliance

### Decision
- Create localized keys for all labels, input placeholders, buttons, and error messages in `src/client/app/locales/en.json` and `vi.json`.
- Apply Tailwind CSS dark mode utilities (e.g., `dark:bg-slate-800`, `dark:text-white`) for styling, ensuring compliance with the Theme System.

### Rationale
- **Core Principle IX (Global Requirements)**: Ensures internationalization and light/dark theme persistence across user sessions.

### Alternatives Considered
- **Hardcoded Strings & Colors**: Rejected as they violate the core governing principles of the project constitution.
