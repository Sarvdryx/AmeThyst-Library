# Research: Book Return & Inspection System

## Overview

This document records all research and design decisions made during Phase 0 of the implementation planning for the Book Return & Inspection System feature.

## Decisions

### 1. PIN Verification Reuse Strategy
- **Decision**: Share `findBorrowRecordByPin` between borrow and return flows by parameterizing the `status` filter
- **Rationale**: Both flows use identical PIN lookup logic (6-digit PIN, 3-min expiry, JOINs to users/books). The only difference is expected status (`'pending'` for borrow, `'pending_return'` for return)
- **Alternatives considered**:
  - Separate function for return flow: rejected — code duplication, violates DRY
  - Status-agnostic query (no status filter): rejected — could match records in wrong state

### 2. Return PIN Generation
- **Decision**: Create `generateReturnPin` function in `dashboard.user.services.mjs` following `generatePickupPin` pattern
- **Rationale**: Same PIN requirements (6-digit, 3-min expiry, uniqueness retry), but status updates to `'pending_return'` and no branch constraint
- **Alternatives considered**:
  - Reuse `generatePickupPin` with a status parameter: rejected — status value and behavior differ too much (branch filter removal)

### 3. Penalty Calculation Implementation
- **Decision**: Pure function in service layer with configurable `Fee_admin` and `Fee_addon` constants
- **Rationale**: Formula is deterministic and stateless; pure functions are testable and reusable
- **Alternatives considered**:
  - Database-side calculation (SQL function): rejected — harder to test and maintain

### 4. Damage Assessment UI Pattern
- **Decision**: New `ConditionButton` atom + `ConditionSelector` molecule following Atomic Design
- **Rationale**: 11 condition buttons with mutual exclusion logic (Perfect/Lost disable all others; damage conditions combinable) is a self-contained UI concern
- **Alternatives considered**:
  - Single dropdown or multi-select: rejected — visual clarity for librarians inspecting physical books

### 5. Database Persistence Flow
- **Decision**: Transaction-based writes using `pool.connect()` + `BEGIN/COMMIT/ROLLBACK`
- **Rationale**: Multiple tables involved per return scenario; atomicity prevents partial updates
- **Alternatives considered**:
  - Individual writes without transactions: rejected — data integrity risk

### 6. Payment Confirmation Pattern
- **Decision**: Simple `is_paid` + `paid_at` toggle on `book_penalty` table
- **Rationale**: Matches existing schema; no payment gateway integration required (library handles payments offline)
- **Alternatives considered**:
  - Separate payment_transactions table: rejected — overengineered for offline cash payments

### 7. Testing Approach
- **Decision**: Backend unit/integration tests with vitest + supertest (following existing pattern)
- **Rationale**: Backend already has vitest configured; supertest allows HTTP-level endpoint testing
- **Alternatives considered**:
  - Frontend component tests: not feasible — no frontend test framework configured in the project

### 8. i18n & Theme Compliance
- **Decision**: All new UI text via translation keys in `en.json`/`vi.json`; all styling via Tailwind dark mode utilities
- **Rationale**: Constitution Principle IX mandates these globally; no exceptions allowed
