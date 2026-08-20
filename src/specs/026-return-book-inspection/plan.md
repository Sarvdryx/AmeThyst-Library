# Implementation Plan: Book Return & Inspection System

**Branch**: `026-return-book-inspection` | **Date**: 2026-07-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-return-book-inspection/spec.md`

## Summary

Implement the complete book return workflow: user generates a return PIN (3-min expiry, any branch), librarian verifies PIN on the Inspection tab, assesses book condition across 11 damage levels, calculates penalty using coefficient-based formula (capped at lost-book amount, plus overdue formula), persists return/penalty records with correct table routing per scenario, updates inventory for perfect-condition returns, and provides payment/debt management via a "Loan & Fees" tab for librarians and a "Fees" tab for users.

## Technical Context

**Language/Version**: Backend: Node.js (Express.js 5.x) with ES Modules (`.mjs`); Frontend: Next.js 16 (React 19, App Router) with TypeScript

**Primary Dependencies**: 
- Backend: `express`, `pg` (PostgreSQL), `jsonwebtoken`, `bcryptjs`
- Frontend: `next`, `react`, `react-dom`, `tailwindcss`

**Storage**: PostgreSQL — existing tables: `borrow_book`, `return_book`, `book_penalty`, `books`, `users`, `library`, `branches`

**Testing**: Backend: `vitest` + `supertest`; Frontend: no test framework configured

**Target Platform**: Web browser (desktop + mobile responsive)

**Project Type**: Web application (Next.js frontend + Express.js backend, dual-project monorepo)

**Performance Goals**: PIN verification under 1s; return workflow (PIN generate → verify → inspect → confirm) under 10s end-to-end

**Constraints**: All existing code must remain untouched (additive changes only); PIN verification must be shared between borrow and return flows; follow existing Layered Architecture (Route → Controller → Service) and Atomic Design (Atoms → Molecules → Organisms → Pages)

**Scale/Scope**: Single library system; up to 10k users, 50k books

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Evidence |
|------|--------|----------|
| **G1: Atomic Design** (Principle I) | PASS | Reuses existing `InlinePinVerification`, `OTPInput`, `BorrowedHistoryTable`, PIN display UI. New damage assessment UI must be built bottom-up (Atoms → Molecules → Organisms) |
| **G2: Layered Architecture** (Principle VII) | PASS | All new backend endpoints follow existing Route → Controller → Service → `pool.query()` pattern |
| **G3: Theme/Localization** (Principle IX) | PASS | Hardcoded colors and text prohibited; all new UI must use Tailwind dark mode utilities and i18n keys |
| **G4: State Management** (Principle II) | PASS | All API calls must handle `loading`, `error`, `success` states |
| **G5: Import Verification** (Principle VIII) | PASS | All imports verified against actual project tree |
| **G6: Error Handling** (Principle V) | PASS | User-friendly error messages with graceful API failure handling |
| **G7: Backend Naming** (Conventions) | PASS | New files follow `.mjs` extension and domain-based naming (e.g., `return-book.services.mjs`) |

Gate result: **ALL GATES PASS** — No violations requiring Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/026-return-book-inspection/
├── plan.md              # This file
├── research.md          # Phase 0 — research findings
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — validation guide
├── contracts/           # Phase 1 — API contracts
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
server/src/
├── routes/
│   └── dashboard.librarian.routes.mjs    # NEW endpoints for return PIN verify, inspection submit, payment confirm
├── controllers/
│   └── dashboard.librarian.controllers.mjs  # NEW controller handlers
├── services/
│   ├── dashboard.librarian.services.mjs   # MODIFY: parameterize findBorrowRecordByPin; ADD: return inspection, penalty calc, payment
│   ├── dashboard.user.services.mjs        # ADD: generateReturnPin
│   └── library.services.mjs              # MODIFY: cleanupExpiredPins for pending_return
├── config/
│   └── postgres.config.mjs               # Existing, no change

client/app/
├── components/
│   ├── atoms/
│   │   ├── OTPInput.tsx                  # Existing, reused
│   │   ├── ConditionButton.tsx           # NEW — damage condition selection atom
│   │   └── PenaltyDisplay.tsx            # NEW — penalty amount display atom
│   ├── molecules/
│   │   ├── ConditionSelector.tsx         # NEW — 11-condition grid with mutual exclusion
│   │   ├── BorrowInfoPanel.tsx           # NEW — displays user/book/borrow details
│   │   └── OutstandingDebtRow.tsx        # NEW — debt row for Loan & Fees tab
│   ├── organisms/
│   │   ├── InlinePinVerification.tsx     # Existing, reused for return PIN entry
│   │   ├── InspectionPanel.tsx           # NEW — full inspection UI (PIN + info + conditions + confirm)
│   │   ├── BorrowedHistoryTable.tsx      # Existing, extended with return data
│   │   └── LoanFeesPanel.tsx             # NEW — librarian Loan & Fees management
│   └── templates/
│       └── ...
├── app/
│   ├── dashboard/
│   │   ├── user/
│   │   │   ├── borrowed/
│   │   │   │   └── page.tsx              # MODIFY: add "Generate Return PIN" button
│   │   │   └── fees/
│   │   │       └── page.tsx              # NEW — user Fees tab (payment history + outstanding)
│   │   └── librarian/
│   │       └── ...
│   └── ...
```

**Structure Decision**: Web application with dual projects (`server/` for backend, `client/` for frontend). All new backend endpoints go into existing `dashboard.librarian.*` files. All new UI components follow Atomic Design under `client/app/components/`.
