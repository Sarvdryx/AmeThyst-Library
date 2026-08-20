# Technical Research: Announcement Management Backend

This document outlines the technical design decisions, rationales, and alternatives considered for the Announcement Management Backend feature.

## 1. Foreign Key Delete Constraint for `created_by`

* **Decision**: Use `ON DELETE SET NULL` for the `created_by` foreign key reference to the `users` table.
* **Rationale**: Announcements provide general information and history to users. If a librarian or administrator account is deleted or archived, the announcements they created should remain visible and active rather than being deleted automatically. Setting the reference to `NULL` preserves data history while ensuring referential integrity.
* **Alternatives considered**:
  * `ON DELETE CASCADE`: Rejected because deleting a librarian would delete their announcement history, which could remove active and important public announcements.
  * `ON DELETE RESTRICT`: Rejected because it would block deleting user accounts that have associated announcements, complicating user management.

## 2. Mounting of Administrative Announcement Routes

* **Decision**: Add administrative announcement routes to the existing `dashboard.librarian.routes.mjs` router, which is mounted under `/dashboard/librarian` in `server.mjs`.
* **Rationale**: Reuses the existing route setup, middleware logic (`verifyToken` + `authorizeRole('librarian', 'admin')`), and aligns directly with the architectural flow of other librarian dashboard endpoints.
* **Alternatives considered**:
  * Creating a brand new standalone router (e.g. `/api/announcements/manage`): Rejected because it introduces new prefix patterns that diverge from the established dashboard structures.

## 3. Scheduled Background Task for Auto-Expiration

* **Decision**: Implement a custom scheduler `utils/announcementScheduler.mjs` containing `runStartupCleanup` and `startPeriodicCleanup` (using `setInterval` with a default interval of 1 hour) that runs a single SQL query to update active announcements that have expired.
* **Rationale**: Reuses the exact scheduling pattern implemented in `utils/pinScheduler.mjs`. It runs asynchronously on startup and continues periodically without requiring heavy external scheduling libraries.
* **Alternatives considered**:
  * Using `node-cron`: Rejected because it introduces a new package dependency and `setInterval` is sufficient for LIMA's current scale.

## 4. Input Payload Validation

* **Decision**: Perform manual request body validation directly inside controller handlers.
* **Rationale**: Matches the rest of the codebase (e.g. `user.controllers.mjs` and `dashboard.librarian.controllers.mjs`) and avoids importing additional packages.
* **Alternatives considered**:
  * `Joi` or `Zod` libraries: Rejected because they are not present in `package.json` and would violate the constraint of using only existing technologies.
