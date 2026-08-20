# Research: Book Management UI Design

## Overview

Research into existing components, patterns, and conventions for implementing the 4-tab Book Management Dashboard for librarians.

---

## R1: Existing Component Audit

### Decision
Reuse 10 components as-is, extend 4 components, and use `LibrarianBookManagement` as the starting point for the dashboard organism.

### Rationale
The project already has a mature Atomic Design component library with strong patterns for tables, badges, search, pagination, and tab navigation. Reusing these reduces duplication and ensures visual consistency.

### Reusable As-Is Components

| Component | Path | Usage in Dashboard |
|-----------|------|--------------------|
| `Button` | `atoms/Button.tsx` | All CTA buttons (Add Book, Mark Returned, Confirm, etc.) |
| `Input` | `atoms/Input.tsx` | Search/filter input fields across tabs |
| `IconButton` | `atoms/IconButton.tsx` | Edit/Delete row actions, extend/cancel |
| `StatusBadge` | `atoms/StatusBadge.tsx` | Borrowing lifecycle statuses (Active, Overdue, Returned) |
| `StatusDot` | `atoms/StatusDot.tsx` | Active/inactive book status |
| `Skeleton` | `atoms/Skeleton.tsx` | Loading state placeholders for tables and cards |
| `Toast` | `atoms/Toast.tsx` | CRUD feedback notifications (success, error) |
| `BookTablePagination` | `molecules/BookTablePagination.tsx` | Pagination for all 4 tab tables |
| `SearchBar` | `molecules/SearchBar.tsx` | Replace hardcoded search in Book Management tab |
| `SubTabBar` | `molecules/SubTabBar.tsx` | Already defines the exact 4 required tabs |
| `EmptySearchResults` | `molecules/EmptySearchResults.tsx` | Empty state for search/filters |
| `LibrarianDashboardSidebar` | `organisms/LibrarianDashboardSidebar.tsx` | Navigation frame; update Books `href` from `#` |

### Components Needing Extension

| Component | Extension Needed |
|-----------|-----------------|
| `StatusBadge` | Add `info` variant for neutral statuses; consider icon prefix |
| `BookTableHeader` | Make column definitions configurable via props per tab |
| `BookTableRow` | Make `BookEntry` generic with `renderActions` slot for per-tab actions |
| `InlinePinVerification` | Extract into embeddable organism with `onComplete`/`onError` props |

### Inspirational Reference

- `LibrarianBookManagement.tsx` — Starting point organism; needs tab-switching for all 4 tabs
- `CapacityBar.tsx` — Visual progress bar pattern adaptable for KPI cards
- `FilterPanel.tsx` — Full filter drawer; trim to librarian-relevant filters

---

## R2: Theme System & Dark Mode

### Decision
Use existing Tailwind `dark:` variant pattern with the `.dark` class on `<html>`. All new components must use `dark:` utility classes.

### Rationale
The ThemeProvider manages light/dark state via localStorage + OS preference (Principle IX). CSS transitions are pre-configured in `globals.css`. Any deviation would break theme consistency.

### Pattern to Follow
```tsx
<div className="bg-white dark:bg-neutral-800 text-foreground dark:text-neutral-200 border dark:border-neutral-700">
```

### Key Implementation Details
- Theme state: `'light' | 'dark'`, persisted to `localStorage.getItem('theme')`
- OS default: `window.matchMedia('(prefers-color-scheme: dark)')`
- DOM toggle: `document.documentElement.classList.add/remove('dark')`
- Hook: `useTheme()` from `../../providers/ThemeProvider`

---

## R3: i18n Localization Patterns

### Decision
Use existing dot-notation key system with `useI18n().t()` hook. Add new keys under the `librarian` namespace.

### Rationale
The I18nProvider supports interpolation (`{param}`), fallback between locales, and localStorage persistence. All existing components use this pattern.

### Key Naming Convention
- `snake_case` keys grouped by feature namespace
- New keys go under `librarian` namespace (e.g., `librarian.subtab_book_management`, `librarian.table_cover`)

### Pattern to Follow
```tsx
"use client";
import { useI18n } from '../../providers/I18nProvider';
const { t } = useI18n();
// Simple: t('librarian.my_key')
// Interpolation: t('librarian.page_of', { current: 1, total: 10 })
// Dynamic: t(`librarian.${variable}`)
```

---

## R4: Mock Data Patterns

### Decision
Create a dedicated mock data file at `app/data/mockLibraryData.ts` with typed exports, following the seed+derivation pattern from `mockLoansFees.ts`.

### Rationale
The existing `LibrarianBookManagement.tsx` uses inline mock data (4 records), which is too small for testing pagination and filtering. The `mockLoansFees.ts` pattern (typed interface + exported const array in `app/data/`) is cleaner and more maintainable for the 4-tab dashboard.

### Data Types Needed

| Entity | Fields |
|--------|--------|
| `BookEntry` | coverSrc, title, author, isbn, category, available, total, active |
| `PickupEntry` | id, bookTitle, bookISBN, bookCover, studentName, studentId, studentAvatar, pin, expiresAt, status (pending/urgent/expired) |
| `BorrowEntry` | id, userAvatar, userName, userId, bookTitle, bookCallNo, borrowDate, dueDate, status (active/overdue), fees |
| `InspectionEntry` | borrowerName, borrowerAvatar, bookTitle, bookCover, isbn, borrowDate, dueDate, returnDate, loanDuration |

### Seed + Derivation Pattern
```ts
export const mockBooks: BookEntry[] = [ ... ]; // 10-12 hand-crafted records
// Rotating statuses for pickups:
export const mockPickups: PickupEntry[] = Array.from({ length: 24 }).map((_, i) => ({
  ...basePickups[i % basePickups.length],
  id: `p${i + 1}`,
  status: i % 3 === 0 ? 'urgent' : i % 3 === 1 ? 'pending' : 'pending',
}));
```

---

## Summary of Key Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Component reuse** | Reuse 12 existing components as-is; extend 4 | Minimize duplication, maintain consistency |
| **Dashboard organism** | Extend `LibrarianBookManagement` as starting point | Already has SubTabBar + table layout |
| **Dark mode** | Tailwind `dark:` variant + ThemeProvider | Existing standard; Principle IX compliance |
| **i18n** | `useI18n().t()` with `librarian` namespace keys | Existing standard; supports interpolation |
| **Mock data** | New `app/data/mockLibraryData.ts` with typed exports | Cleaner than inline; supports pagination testing |
| **Table pattern** | Fixed-width columns (from existing pattern) with configurable column defs per tab | Matches existing BookTableHeader/Row API |
| **Filter panel** | Simplified inline filter bar (not full drawer) | Librarian dashboard needs simpler, always-visible filters |
| **Responsive** | Desktop-first with responsive adaptations | Per spec assumption; librarian dashboard is primarily desktop |
