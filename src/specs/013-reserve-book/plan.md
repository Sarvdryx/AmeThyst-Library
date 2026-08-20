# Implementation Plan: Reserve Book

**Branch**: `013-reserve-book` | **Date**: 2026-06-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-reserve-book/spec.md`

## Summary

Implement a complete book reservation system that allows authenticated library members to reserve available books from specific branches. The feature extends the existing book detail page with branch selection and reservation functionality, leveraging the existing `borrow_book` table with `status='pending'` to track reservations.

## Technical Context

**Language/Version**: TypeScript (Frontend), JavaScript ES Modules (Backend), PostgreSQL 15

**Primary Dependencies**: Next.js 16.2.6, React 19.2.4, Express 5.2.1, node-postgres 8.21.0, Passport.js, JWT

**Storage**: PostgreSQL with existing `books`, `branches`, `library`, `users`, `borrow_book` tables

**Testing**: Manual testing (no test framework configured)

**Target Platform**: Web application (Desktop, Tablet, Mobile)

**Project Type**: Full-stack web application (library management system)

**Performance Goals**: Reservation completion under 30 seconds, feedback within 2 seconds

**Constraints**: Must comply with Atomic Design, i18n (en/vi), theme system, backend layered architecture

**Scale/Scope**: 2 library branches, existing user base, ~10k books

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Component-Driven & Reusability | PASS | Will create BranchSelector molecule following Atomic Design |
| II. State Management & Data Fetching | PASS | Will handle loading/error/success states, use environment variables for API URL |
| III. Responsive & Beautiful Design | PASS | Will use Tailwind CSS for responsive layout |
| IV. Performance Optimization | PASS | Will use Client Component for interactive reservation |
| V. Error Handling & Accessibility | PASS | Will implement robust validation and user-friendly error messages |
| VI. Directory Structure & Workspace Alignment | PASS | Will follow existing project structure |
| VII. Modular & Abstract Architecture | PASS | Will follow Route → Middleware → Controller → Service → Model chain |
| VIII. Import Path Verification | PASS | Will verify all import paths |
| IX. Global Feature Requirements | PASS | Will use design tokens and i18n for all text |

## Project Structure

### Documentation (this feature)

```text
specs/013-reserve-book/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── client/
│   └── app/
│       ├── components/
│       │   ├── atoms/
│       │   ├── molecules/
│       │   │   └── BranchSelector.tsx      # NEW: Branch selection component
│       │   └── templates/
│       │       └── BookDetailTemplate.tsx  # MODIFY: Add branch selection
│       └── library/
│           └── [id]/
│               └── page.tsx               # MODIFY: Add auth, branch selection
├── server/
│   └── src/
│       ├── routes/
│       │   └── library.mjs                # MODIFY: Add auth middleware
│       ├── controllers/
│       │   └── library.controller.mjs     # MODIFY: Extract userId from req.user
│       ├── services/
│       │   └── library.services.mjs       # MODIFY: Rewrite createReservation
│       └── middlewares/
│           └── auth.middleware.mjs         # EXISTING: Verify token
└── database/
    └── init_db/
        └── postgres/
            └── 04_init_rest.sql           # EXISTING: borrow_book table
```

**Structure Decision**: Extending existing full-stack web application structure. Frontend in `client/app/`, backend in `server/src/`, database schemas in `database/init_db/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations identified. All constitution principles can be followed.

---

## Phase 0: Research

### Research Tasks

1. **Concurrent Reservation Handling**: Research PostgreSQL row-level locking patterns (`SELECT ... FOR UPDATE`) to prevent race conditions when multiple users try to reserve the same last copy.

2. **JWT Authentication Integration**: Research how to extract user information from JWT tokens in Express middleware and pass it to controllers.

3. **Branch Selection UX Patterns**: Research best practices for branch/location selection in library systems (dropdown vs. clickable cards vs. map-based selection).

4. **Reservation Expiration Logic**: Research typical reservation expiration periods (24-72 hours) and automatic cleanup strategies.

5. **Error Handling Patterns**: Research idiomatic error handling in Express.js with proper HTTP status codes and user-friendly messages.

### Research Findings

**Decision**: Use `borrow_book` table with `status='pending'` for reservations
**Rationale**: The table already exists with correct schema (user_id, book_id, branch_id, reserve_date, status). Creating a new table would be redundant.
**Alternatives considered**: Creating a dedicated `reservations` table - rejected due to duplication of existing functionality.

**Decision**: Use `SELECT ... FOR UPDATE` for row-level locking
**Rationale**: Prevents race conditions where two users try to reserve the same last copy simultaneously.
**Alternatives considered**: Application-level locking - rejected due to complexity and scalability issues.

**Decision**: Add `expires_at` column to `borrow_book` table
**Rationale**: Reservations should expire after a configurable period (e.g., 48 hours) to prevent indefinite holds.
**Alternatives considered**: Using existing `expired_at` column - it exists but needs proper implementation.

**Decision**: Branch selection via clickable cards in availability grid
**Rationale**: Visual, intuitive, and follows existing UI patterns in the book detail page.
**Alternatives considered**: Dropdown selection - rejected as less visual and harder to show branch-specific information.

---

## Phase 1: Design & Contracts

### Data Model

**Existing Entities (No Changes Required):**

- **Book**: `book_id` (PK), `title`, `author`, `isbn`, `image_url`, etc.
- **Branch**: `branch_id` (PK), `name`, `name_short`, `address`, `contact`
- **Library (Inventory)**: `book_id` (FK), `branch_id` (FK), `quantity`, `available_quantity`, `shelf`
- **User**: `user_id` (PK), `email`, `username`, `role`

**Modified Entity:**

- **Borrow Book** (used for reservations):
  - `borrow_id` (PK, UUID)
  - `user_id` (FK → users)
  - `book_id` (FK → books)
  - `branch_id` (FK → branches)
  - `reserve_date` (DATE, DEFAULT CURRENT_DATE)
  - `borrow_date` (DATE, nullable) - NULL when reserved, set when physically borrowed
  - `due_date` (DATE, nullable)
  - `pin` (VARCHAR(10)) - For pickup verification
  - `expired_at` (TIMESTAMP) - When reservation expires
  - `status` (VARCHAR(20)) - 'pending', 'borrowed', 'returned', 'expired', 'cancelled'

**State Transitions:**
```
pending → borrowed (user picks up book)
pending → cancelled (user cancels reservation)
pending → expired (system expires reservation)
borrowed → returned (user returns book)
```

### API Contracts

**POST /api/library/reserve**

Request:
```json
{
  "bookId": "string (required)",
  "branchId": "number (required)"
}
```

Headers:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

Response (201 Created):
```json
{
  "success": true,
  "data": {
    "reservationId": "uuid",
    "bookId": "string",
    "branchId": "number",
    "branchName": "string",
    "reserveDate": "2026-06-25",
    "expiresAt": "2026-06-27T10:00:00Z",
    "status": "pending",
    "pin": "123456"
  }
}
```

Response (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "BOOK_UNAVAILABLE",
    "message": "No available copies at the selected branch"
  }
}
```

Response (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

Response (409 Conflict):
```json
{
  "success": false,
  "error": {
    "code": "ALREADY_RESERVED",
    "message": "You already have an active reservation for this book"
  }
}
```

### Quickstart Validation Guide

**Prerequisites:**
- PostgreSQL database running with seed data
- Backend server running on port 5000
- Frontend server running on port 3000
- Valid JWT token from authenticated user

**Validation Scenarios:**

1. **Reserve Available Book**
   - Login as user → Navigate to book with available copies → Click "Reserve" → Confirm reservation → Verify success message and updated availability

2. **Reserve Unavailable Book**
   - Navigate to book with 0 availability → Verify reserve button is disabled → Hover shows tooltip

3. **Concurrent Reservation**
   - Open two browser tabs with same book → Reserve in first tab → Verify second tab shows updated availability

4. **Reservation Expiration**
   - Create reservation → Wait for expiration period → Verify status changes to 'expired'

5. **Cancel Reservation**
   - Create reservation → Navigate to dashboard → Cancel reservation → Verify availability restored

---

## Phase 2: Tasks

*This phase will be executed by `/speckit.tasks` command after plan approval.*

## Appendix

### Key Files Reference

- Feature Spec: `specs/013-reserve-book/spec.md`
- Constitution: `.specify/memory/constitution.md`
- Database Schema: `database/init_db/postgres/04_init_rest.sql`
- Existing Service: `server/src/services/library.services.mjs`
- Existing Controller: `server/src/controllers/library.controller.mjs`
- Existing Routes: `server/src/routes/library.mjs`
- Book Detail Page: `client/app/library/[id]/page.tsx`
- Book Detail Template: `client/app/components/templates/BookDetailTemplate.tsx`

### Environment Variables

- `NEXT_PUBLIC_API_URL`: Frontend backend URL (e.g., http://localhost:5000)
- `JWT_SECRET`: Secret key for JWT token verification
- `PORT`: Backend server port (default: 5000)