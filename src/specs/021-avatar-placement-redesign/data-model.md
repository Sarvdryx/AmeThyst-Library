# Data Model: Avatar Placement Redesign

## Overview

This feature redesigns client-side avatar presentation and does not introduce new database tables or fields. It utilizes the existing `users` table fields and client-side `localStorage` data models.

## Client-Side User Session Model (`localStorage`)

### Key Entity: `StoredUser`

Stores the active user session details in local storage under the key `'user'`.

* **Fields**:
  - `userId` (string): Unique identifier for the user.
  - `username` (string): Full name of the user.
  - `email` (string): Registered email address.
  - `avatar` (string | null): Public URL of the user's uploaded avatar image (from Cloudinary or external source).
  - `role` (string): User privilege level (`'admin'`, `'librarian'`, `'user'`).

### State Transitions & Persistence

1. **User Login / Verification**: The login responses save the initial `StoredUser` into `localStorage`.
2. **Profile Loaded**: When the profile page mounts, it calls `updateStoredUser` with retrieved profile details.
3. **Avatar Updated**:
   - The user uploads a file or pastes a URL via `AvatarUploader` inside the `Sidebar`.
   - The backend handles the upload and returns the new image URL.
   - The React state is updated, propagating the new URL to `Sidebar` and `NavBar`.
   - `updateStoredUser({ avatar: newAvatarUrl })` is called, modifying `localStorage` in-place.
4. **Subsequent Page Loads**: Components load `avatar` from `localStorage` via `getLoggedInUser()`.

## Database Schema (Existing Columns utilized)

### Table: `users`

* `avatar` (VARCHAR/TEXT): Stores the URL of the user's avatar image.
* `username` (VARCHAR): Stores the user's full name.
* `role` (VARCHAR): Stores the user's role (admin, librarian, user).
