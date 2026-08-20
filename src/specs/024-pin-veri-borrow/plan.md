# Implementation Plan: Librarian PIN Verification & Book Borrowing Workflow

**Branch**: `024-pin-veri-borrow` | **Date**: 2026-07-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/024-pin-veri-borrow/spec.md`

## Summary

Backend workflow for librarian counter-side PIN verification and book loan processing. Three REST API endpoints: (1) verify PIN + branch match and return borrower/book details, (2) confirm loan (status → `borrowed`, `due_date` = +14 days, calendar event, cleanup `expired_reserve`), (3) cancel loan (delete `borrow_book` row, increment book quantity). All mutations wrapped in DB transactions with atomic rollback. Reuses existing Express.js layered architecture (`library.*` files) and PostgreSQL `pg` pool.

## Technical Context

**Language/Version**: Node.js (ES Modules `.mjs`)

**Primary Dependencies**: Express.js 4.x, `pg` (PostgreSQL client)

**Storage**: PostgreSQL (existing `borrow_book`, `users`, `books`, `calendar_events` tables)

**Testing**: Jest (existing in server `package.json`)

**Target Platform**: Linux server / backend API

**Project Type**: Express.js REST web service

**Performance Goals**: PIN lookup < 1s, full workflow < 5s

**Constraints**: All state mutations must be wrapped in database transactions; borrower eligibility must be checked before confirmation

**Scale/Scope**: Single library system with multiple branches; handles concurrent counter operations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|------------|--------|
| VII - Backend Layered Architecture | Must follow Route → Middleware → Controller → Service → Model | PASS |
| VII - Fat Services | Business logic in service layer; controllers only bridge req/res | PASS |
| Backend Naming | Controllers/routes/models: `[feature].[type].mjs`; Services: `[domain].services.mjs` | PASS |
| ES Modules | All backend files must use `.mjs` extension | PASS |
| camelCase | Variables, functions, properties | PASS |
| PascalCase | Page files, Express models/classes | PASS |
| UPPER_SNAKE_CASE | Environment variables, global constants | PASS |
| Environment Variables | `NEXT_PUBLIC_API_URL` for frontend, `PORT` for backend; never hardcode | PASS |
| Raw SQL w/ param queries | Use `pg` pool with parameterized queries (existing norm) | PASS |
| Unified JSON response | All API responses follow consistent `{ success, data, message }` structure | PASS |
| Proper HTTP status codes | 200, 400, 401, 500 used correctly | PASS |

**No violations detected.** All gates pass with existing project patterns preserved.

## Project Structure

### Documentation (this feature)

```text
specs/024-pin-veri-borrow/
├── plan.md              # This file (current)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
server/src/
├── routes/
│   └── library.mjs              # NEW: Add PIN verify/confirm/cancel routes
├── controllers/
│   └── library.controller.mjs   # NEW: Add verifyPIN, confirmLoan, cancelLoan controllers
├── services/
│   └── library.services.mjs     # UPDATE: Add verifyPin, confirmLoan, cancelLoan logic
├── models/
│   └── library.models.mjs       # NEW: Add DB query functions for verification flow
├── middlewares/
│   ├── auth.middleware.mjs       # REUSE: verifyToken
│   └── role.middleware.mjs       # REUSE: authorizeRole('librarian')
└── utils/
    └── ...                       # REUSE: existing helpers
```

**Structure Decision**: Follow existing `library.*` naming pattern. Extend existing files where the domain overlaps (library borrowing workflow) rather than creating new top-level files. The library domain already contains reserve/PIN logic in `library.services.mjs` — this feature adds the librarian-side completion of that workflow.

## Complexity Tracking

> No Constitution violations detected. Complexity tracking not required.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
