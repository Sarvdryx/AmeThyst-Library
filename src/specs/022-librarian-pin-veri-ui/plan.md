# Implementation Plan: Librarian PIN Verification UI

**Branch**: `022-librarian-pin-veri-ui` | **Date**: 2026-06-29 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-librarian-pin-veri-ui/spec.md`

## Summary

Create a Librarian Dashboard with two tabs (Calendar View and Book Loan Confirmation) that enables librarians to process physical book check-outs via a 6-digit PIN verification modal. The feature reuses the existing user dashboard layout structure (`NavBar` + `DashboardSidebar` + `Footer`), extends the `DashboardCalendar` molecule for librarian event display, and builds a new PIN verification modal with OTP-style input, borrower profile overlay, and keyboard shortcut support (Esc/Enter/F8/Ctrl+Enter). All text uses the existing i18n system; all styling uses Tailwind dark mode classes.

## Technical Context

**Language/Version**: TypeScript (Next.js 14+, React 18+, App Router)

**Primary Dependencies**: React (`useState`, `useEffect`, `useRef`, `createPortal`), Tailwind CSS, existing `I18nProvider` + `ThemeProvider` contexts, existing atomic components library

**Storage**: N/A (UI-only feature — backend integration for real PIN validation is out of scope for this phase; reuses existing `PinModal` display pattern and reservation data from `014-pin-generation`)

**Testing**: Manual verification via browser; component-level visual testing

**Target Platform**: Web (desktop-first with keyboard shortcuts, responsive to tablet/mobile)

**Project Type**: Web application (frontend only — Next.js App Router)

**Performance Goals**: Modal opens in <1s of trigger click; PIN validation feedback in <2s; toast notification within 500ms of confirm action

**Constraints**: Must follow Atomic Design; must not hardcode text strings (use i18n); must not hardcode colors (use Tailwind `dark:` prefix); must reuse or extend existing components where available; keyboard shortcuts must not interfere with built-in browser shortcuts

**Scale/Scope**: Single dashboard page with 2 tabs, 1 modal workflow, ~5 new components (1 molecule + 3 organisms + 1 template)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Requirement | Status |
|------|-------------|--------|
| G1 | **Atomic Design compliance**: All new UI components must follow atoms → molecules → organisms → templates hierarchy | PASS — new OTPInput atom, VerificationModal organism, LibrarianDashboardSidebar organism, CalendarView molecule reuse |
| G2 | **i18n compliance**: All user-facing text must use `t('namespace.key')` pattern with en.json/vi.json keys | PASS — will add `librarian.*` and `verification.*` namespaces |
| G3 | **Theme compliance**: All styling must use Tailwind `dark:` prefix classes, no hardcoded colors | PASS — follows established `bg-white dark:bg-neutral-800` pattern |
| G4 | **Dashboard layout reuse**: Must follow existing `NavBar` + `DashboardSidebar` + `Footer` pattern from user dashboard | PASS — creates `dashboard/librarian/` with same layout structure |
| G5 | **Role-based access**: Extend existing `authorizeRole('user')` checks to support librarian role | PASS — adds `'librarian'` role to dashboard layout auth guard |
| G6 | **State lifecycle**: All data fetching must handle `loading`, `error`, `success` states explicitly | PASS — modal data overlay uses skeleton placeholder for loading |
| G7 | **No backend scope creep**: This phase is strictly frontend UI; real PIN validation API integration is excluded | PASS — PIN verification in modal uses simulated/mock validation |
| G8 | **Keyboard shortcuts**: Esc, Enter, F8/Ctrl+Enter must work without conflicting with browser defaults | PASS — uses `useEffect` with `keydown` listener on modal mount, `e.preventDefault()` for F8 |

## Project Structure

### Documentation (this feature)

```text
specs/022-librarian-pin-veri-ui/
├── plan.md              # This file
├── research.md          # Phase 0 — resolved unknowns
├── data-model.md        # Phase 1 — entity definitions
├── quickstart.md        # Phase 1 — validation guide
├── contracts/           # Phase 1 — interface contracts
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
client/
├── app/
│   ├── components/
│   │   ├── atoms/
│   │   │   └── OTPInput.tsx              # NEW — 6-digit PIN input atom
│   │   ├── molecules/
│   │   │   ├── CalendarView.tsx          # NEW — wraps DashboardCalendar with librarian-specific overlays
│   │   │   └── BorrowerInfoPanel.tsx     # NEW — borrower profile display molecule
│   │   ├── organisms/
│   │   │   ├── VerificationModal.tsx     # NEW — PIN verification modal (core workflow)
│   │   │   ├── LibrarianDashboardSidebar.tsx  # NEW — sidebar with 2 tabs + placeholders
│   │   │   └── BookLoanConfirmationPanel.tsx  # NEW — tab workspace with trigger button
│   │   └── templates/
│   │       └── LibrarianDashboardTemplate.tsx # NEW — page layout combining sidebar + content
│   ├── dashboard/
│   │   ├── layout.tsx                    # MODIFY — extend auth guard for 'librarian' role
│   │   └── librarian/
│   │       ├── layout.tsx                # NEW — librarian dashboard layout
│   │       ├── page.tsx                  # NEW — Calendar View tab default
│   │       └── loan-confirmation/
│   │           └── page.tsx              # NEW — Book Loan Confirmation tab
│   └── locales/
│       ├── en.json                       # MODIFY — add librarian.* + verification.* keys
│       └── vi.json                       # MODIFY — add librarian.* + verification.* keys
```

**Structure Decision**: Web application (frontend only). The structure follows the existing Next.js App Router pattern with Atomic Design components under `client/app/components/`. The new `dashboard/librarian/` route mirrors the existing `dashboard/user/` route structure.

## Complexity Tracking

No constitution violations — all patterns are established in the codebase.

Phase 0 — no complexity justification needed.
