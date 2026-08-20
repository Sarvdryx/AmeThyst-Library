# Implementation Tasks: Forgot Password Page & Global Navigation Update

**Feature**: Forgot Password Page & Global Navigation Update
**Branch**: `004-forgot-password-page`

## Implementation Strategy
This feature is implemented in phases: Setup, Foundational (global navigation removal), User Story 1 (Forgot Password Page), and Polish.

## Phase 1: Setup
- [X] T001 Initialize feature-specific directories and files structure

## Phase 2: Foundational (Global Navigation Removal)
- [X] T002 [P] Remove `NavBar` component reference from `client/app/layout.js`
- [X] T003 [P] Verify `client/app/login/page.js` renders without navigation bar
- [X] T004 [P] Verify `client/app/register/page.js` renders without navigation bar
- [X] T005 [P] Verify `client/app/library/page.js` renders without navigation bar
- [X] T006 [P] Verify root `client/app/page.js` (Home) renders without navigation bar

## Phase 3: User Story 1 - Request Password Reset (Priority: P1)
- [X] T007 [US1] Create `ForgotPasswordCard.jsx` component in `client/app/forgot-password/components/ForgotPasswordCard.jsx` per design specs
- [X] T008 [US1] Create `/forgot-password` page route in `client/app/forgot-password/page.js` (importing from components/)
- [X] T009 [US1] Implement form validation for email input in `ForgotPasswordCard.jsx`
- [X] T010 [US1] Implement "Send Reset Link" button handling in `ForgotPasswordCard.jsx`
- [X] T011 [US1] Implement "Back to Sign In" navigation logic to `/login`
- [X] T012 [US1] Ensure responsiveness of Forgot Password page per `fw_specify.md`

## Phase 4: Polish & Cross-Cutting Concerns
- [X] T013 Verify global removal of navigation bars across all authenticated and auth pages
- [X] T014 Run quickstart validation scenarios defined in `quickstart.md`
- [X] T015 Final visual check against design specs in `design/fw_specify.md`
