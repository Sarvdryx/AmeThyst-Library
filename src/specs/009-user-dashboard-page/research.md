# Research: User Dashboard Page

## Unknowns Resolved

### 1. Notification/Toast Pattern

**Decision**: Build a simple `Toast` atom component using React state + CSS transitions

**Rationale**: No existing toast/notification component exists in the project. Building a lightweight atom keeps with Atomic Design. The toast will:
- Accept `message`, `type` (success/error/warning/info), `onDismiss` props
- Auto-dismiss after 4 seconds
- Render as a fixed-position banner at the top of the viewport
- Be managed by a `useToast` hook that wraps a simple state machine

**Alternatives considered**:
- Third-party lib (react-hot-toast) — unnecessary dependency for one use case
- Reusing `ErrorBanner.tsx` — too specialized for errors only, not generic toasts

### 2. Calendar Rendering Approach

**Decision**: Build a pure React client-side calendar using `Date` API

**Rationale**: The calendar needs to display the real current date and support month navigation without backend calls (the dates are derived from the client's system clock). The approach:
- Compute month grid: first day of month → determine starting weekday column → fill 6 weeks of day numbers
- Highlight today's date with a distinct style (filled circle background)
- Month navigation: adjust internal `viewDate` state by ±1 month
- View toggles (Month/Week/Day): show different grid granularities, Month view being the default
- Event indicators overlaid on day cells based on data fetched from `GET /dashboard/events`

**Alternatives considered**:
- `react-calendar` library — heavy, styling conflicts with Tailwind
- Server-rendered calendar — unnecessary complexity; calendar is purely presentational

### 3. Dashboard Backend API Contract

**Decision**: Two new REST endpoints under `/dashboard` route group

**Rationale**: The frontend needs event data to overlay on the calendar and populate the agenda panel. Keeping endpoints minimal.

**Endpoints**:

| Method | Path | Auth | Description | Response |
|--------|------|------|-------------|----------|
| GET | `/dashboard/events?month=&year=` | verifyToken | Events for a given month | `{ events: [{ id, title, date, time, location, type, description }] }` |
| GET | `/dashboard/agenda` | verifyToken | Today + tomorrow events | `{ today: [...], tomorrow: [...] }` |

These live in `server/src/routes/dashboard.routes.mjs` mounted at `/dashboard` in `server.mjs`.

### 4. NavBar Dashboard Link

**Decision**: Update `NavBar.tsx` line 16 from `href: '/dashboard'` to `href: '/dashboard/user'`

**Rationale**: The route structure defined in the spec uses `/dashboard/user` as the user dashboard path. The NavBar link must match.

## Best Practices Confirmed

- **Atomic Design**: All new dashboard components follow the existing component directory hierarchy
- **Backend Layering**: New dashboard route → controller → service → model chain matches existing pattern
- **i18n**: All user-facing text uses `t('dashboard.*')` keys added to both `en.json` and `vi.json`
- **Theme**: Tailwind `dark:` variants used instead of hardcoded colors; colors from UI_des.txt converted to Tailwind equivalents
- **API URL**: `NEXT_PUBLIC_API_URL` environment variable used for all fetch calls
