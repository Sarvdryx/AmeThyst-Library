# UI Component Contracts: Book Management Dashboard

## Overview

This document defines the props/API contracts for all new components to be created for the 4-tab Book Management Dashboard. These contracts enable parallel development and ensure consistent interfaces between atomic layers.

---

## New Atom Components

### A1. KPIProgressBar

A horizontal progress bar for KPI stat cards.

```ts
interface KPIProgressBarProps {
  value: number;           // 0-100 percentage
  color?: string;          // Tailwind bg color class (default: 'bg-navy')
  bgColor?: string;        // Tailwind bg color for track (default: 'bg-[#F2EDE3]')
  height?: string;         // Tailwind h-* class (default: 'h-1')
  className?: string;
}
```

---

### A2. TabButton

Individual tab button for the navigation bar.

```ts
interface TabButtonProps {
  label: string;           // i18n-translated tab label
  active: boolean;
  onClick: () => void;
}
```

---

### A3. ConditionCheckbox

Checkbox item for inspection condition selection.

```ts
interface ConditionCheckboxProps {
  id: string;
  label: string;
  fee: number;
  checked: boolean;
  onChange: (checked: boolean) => void;
}
```

---

### A4. CountdownTimer

Display for remaining pickup PIN expiry time.

```ts
interface CountdownTimerProps {
  expiresAt: string;       // ISO date string
  onExpire?: () => void;   // callback when timer reaches 0
  variant?: 'default' | 'urgent';
}
```

---

### A5. TrendIndicator

KPI trend percentage display with color coding.

```ts
type TrendVariant = 'positive' | 'negative' | 'neutral';

interface TrendIndicatorProps {
  text: string;            // e.g., "+12% vs last week"
  variant: TrendVariant;
}
```

---

## New Molecule Components

### M1. KPIStatCard

A single KPI metric card for dashboard stats rows.

```ts
interface KPIStatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;           // i18n key or translated string
  trend?: string;
  trendVariant?: TrendVariant;
  progress?: number;       // 0-100
  progressColor?: string;
  variant?: 'default' | 'critical' | 'success';
  onClick?: () => void;
}
```

---

### M2. FilterDropdown

Reusable filter dropdown for the filter bar.

```ts
interface FilterDropdownProps {
  label: string;           // current selected value display
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}
```

---

### M3. PickupTableRow

A single row in the Book Pickup table.

```ts
interface PickupTableRowProps {
  pickup: PickupEntry;     // from data-model.md
  onExtend: (id: string) => void;
  onCancel: (id: string) => void;
  hasBorder?: boolean;
}
```

---

### M4. ReturnTableRow

A single row in the Book Return table.

```ts
interface ReturnTableRowProps {
  borrow: BorrowEntry;     // from data-model.md
  onMarkReturned: (id: string) => void;
  hasBorder?: boolean;
}
```

---

### M5. InspectionHeaderCard

Borrower + Book information card for the Inspection tab.

```ts
interface InspectionHeaderCardProps {
  borrowerName: string;
  borrowerAvatar?: string;
  bookTitle: string;
  bookCover: string;
  isbn: string;
  borrowDate: string;
  dueDate: string;
  returnDate: string;
  loanDuration: number;
}
```

---

### M6. FinancialSummaryCard

Fee breakdown and final refund display.

```ts
interface FinancialSummaryCardProps {
  repairFee: number;
  latePenalty: number;
  finalRefund: number;
}
```

---

## New Organism Components

### O1. KPIStatsRow

A row of KPIStatCards for dashboard headers.

```ts
interface KPIStatsRowProps {
  metrics: KPIStatCardProps[];
  columns?: 2 | 3;         // grid columns (default: 3)
}
```

---

### O2. BookManagementTab

Content panel for the Book Management tab.

```ts
interface BookManagementTabProps {
  books: BookEntry[];
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string) => void;
  onAddBook: () => void;
  onEditBook: (bookId: string) => void;
  onDeleteBook: (bookId: string) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  activeCategory: string;
  isLoading?: boolean;
  error?: string | null;
}
```

---

### O3. BookPickupTab

Content panel for the Book Pickup tab.

```ts
interface BookPickupTabProps {
  pickups: PickupEntry[];
  kpiMetrics: KPIStatCardProps[];
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onCategoryFilter: (category: string) => void;
  onExtendPin: (pickupId: string) => void;
  onCancelPickup: (pickupId: string) => void;
  onAdvancedFilters: () => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  error?: string | null;
}
```

---

### O4. BookReturnTab

Content panel for the Book Return tab.

```ts
interface BookReturnTabProps {
  borrows: BorrowEntry[];
  kpiMetrics: KPIStatCardProps[];
  onSearch: (query: string) => void;
  onStatusFilter: (status: string) => void;
  onDateRangeFilter: (start: string, end: string) => void;
  onMarkReturned: (borrowId: string) => void;
  onPageChange: (page: number) => void;
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  error?: string | null;
}
```

---

### O5. InspectionTab

Content panel for the Inspection tab.

```ts
interface InspectionTabProps {
  inspection: InspectionEntry;
  conditions: ConditionSelection[];
  onConditionToggle: (conditionId: string) => void;
  onNotesChange: (notes: string) => void;
  onCompleteInspection: () => void;
  onCancel: () => void;
}
```

---

### O6. LibrarianBookDashboard (Template)

Top-level dashboard template composing all tabs.

```ts
interface LibrarianBookDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  bookManagement: React.ReactNode;
  bookPickup: React.ReactNode;
  bookReturn: React.ReactNode;
  inspection: React.ReactNode;
}
```

---

## Reused Existing Components (Contracts)

### Existing Atom Components (as-is)

| Component | Original File | Key Props |
|-----------|---------------|-----------|
| `Button` | `atoms/Button.tsx` | `variant?`, `isLoading?`, `children`, `onClick` |
| `Input` | `atoms/Input.tsx` | Extends `InputHTMLAttributes` |
| `IconButton` | `atoms/IconButton.tsx` | `label`, `size?`, `children`, `onClick` |
| `StatusBadge` | `atoms/StatusBadge.tsx` | `variant`, `label` |
| `StatusDot` | `atoms/StatusDot.tsx` | `active` |
| `Skeleton` | `atoms/Skeleton.tsx` | `className?` |
| `Toast` | `atoms/Toast.tsx` | `message`, `type`, `onDismiss`, `duration?` |
| `ToggleSwitch` | `atoms/ToggleSwitch.tsx` | `checked`, `onChange`, `id?` |

### Existing Molecule Components (as-is)

| Component | Original File | Key Props |
|-----------|---------------|-----------|
| `BookTablePagination` | `molecules/BookTablePagination.tsx` | `currentPage`, `totalPages`, `onPageChange` |
| `SearchBar` | `molecules/SearchBar.tsx` | `onFilterClick?`, `onSearchTrigger?`, `value?`, `placeholder?` |
| `SubTabBar` | `molecules/SubTabBar.tsx` | `activeTab`, `onTabChange` |
| `EmptySearchResults` | `molecules/EmptySearchResults.tsx` | `hasActiveFilters`, `onClearFilters` |

### Existing Organism Components (refactored)

| Component | Original File | Refactoring Needed |
|-----------|---------------|--------------------|
| `InlinePinVerification` | `organisms/InlinePinVerification.tsx` | Extract to accept props: `onComplete?`, `borrowId?` |

---

## Data Flow Diagram

```
page.tsx (dashboard/librarian)
  │
  ├── LibrarianDashboardSidebar (existing)
  │
  └── LibrarianBookDashboard (template, NEW)
        │
        ├── SubTabBar (existing)
        │
        ├── BookManagementTab (O2)
        │     ├── SearchBar (existing molecule)
        │     ├── FilterDropdown (M2)
        │     ├── Button (existing atom - "Add Book")
        │     ├── BookTableHeader (existing, extended)
        │     ├── BookTableRow (existing, extended)
        │     ├── BookTablePagination (existing)
        │     └── EmptySearchResults (existing)
        │
        ├── BookPickupTab (O3)
        │     ├── KPIStatsRow (O1) → KPIStatCard (M1) × 3
        │     ├── SearchBar (existing)
        │     ├── FilterDropdown (M2) × 2
        │     ├── PickupTableRow (M3)
        │     ├── BookTablePagination (existing)
        │     └── EmptySearchResults (existing)
        │
        ├── BookReturnTab (O4)
        │     ├── KPIStatsRow (O1) → KPIStatCard (M1) × 3
        │     ├── FilterDropdown (M2) × 2
        │     ├── ReturnTableRow (M4)
        │     ├── BookTablePagination (existing)
        │     └── EmptySearchResults (existing)
        │
        └── InspectionTab (O5)
              ├── ConditionCheckbox (A3) × 6
              ├── InspectionHeaderCard (M5)
              └── FinancialSummaryCard (M6)
```
