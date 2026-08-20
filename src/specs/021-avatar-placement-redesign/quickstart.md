# Quickstart Guide: Avatar Placement Redesign

This guide provides steps for setting up and running the redesigned avatar placement and sizing features in a local development environment.

## 1. Prerequisites and Installation

Ensure that you have already completed the setup for both the client and server projects:

### Backend Setup
No additional backend setup is required for this feature, as it leverages existing endpoints (`GET /user/profile` and `POST /user/avatar`). Make sure the backend server is running on port `5000`.

### Frontend Setup
Ensure all npm packages are installed:

```bash
cd src/client
npm install
```

---

## 2. Running the Application

### Start the Backend
From the server directory:

```bash
cd src/server
npm run dev
```

### Start the Frontend
From the client directory:

```bash
cd src/client
npm run dev
```
The Next.js client runs on `http://localhost:3000`.

---

## 3. Testing the Feature

### Verification Steps

1. **Clean Profile Layout**:
   - Navigate to the Profile page (`/profile`).
   - Verify that there is **no** avatar or `AvatarUploader` component rendered in the main content area (where the personal info cards are displayed).

2. **Sidebar Avatar & Uploader**:
   - Verify that the circular avatar displayed in the Left Sidebar is larger (`w-28 h-28` or `112px`) compared to the original small avatar size.
   - Hover over the avatar in the Left Sidebar. Verify that the edit overlay appears.
   - Click the overlay to open the menu options (Upload File / Paste Image URL).

3. **Avatar Sizing and Edit Integration**:
   - Upload a new image or paste a valid URL.
   - Verify that the Sidebar avatar immediately updates with the new image.

4. **Navbar Avatar Synchronization**:
   - Verify that the top Navbar displays the user's avatar image instead of just initials when an avatar is present.
   - When the avatar is updated in the Sidebar, verify that the Navbar's avatar updates **instantly** without requiring a page reload.

5. **Multi-Page Consistency**:
   - Navigate to `/profile/security`.
   - Verify that the Sidebar still renders the `AvatarUploader` with the correct, updated avatar image.
   - Navigate to other pages (e.g. `/library`, `/dashboard/user`). Verify that the Navbar still displays the updated avatar image.
