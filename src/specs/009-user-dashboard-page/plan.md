# Implementation Plan: User Dashboard Page

**Branch**: `009-user-dashboard-page` | **Date**: 2026-06-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/009-user-dashboard-page/spec.md`

## Summary

Create a personalized dashboard page at `client/app/dashboard/user/page.tsx` for authenticated users with role "user". The page displays an interactive real-date calendar, an upcoming agenda panel, a welcome greeting, and a sidebar navigation. Unauthenticated or unauthorized visitors receive a notification toast and are redirected. The design follows the layout from `template/UI_des.txt` (minus existing navbar/footer) and complies with the project's Atomic Design system, theme/localization, and backend layered architecture.

## Technical Context

**Language/Version**: JavaScript (ES Modules on backend `.mjs`), TypeScript/JSX on frontend (Next.js App Router)

**Primary Dependencies**: Next.js (client), Express.js (server), `jsonwebtoken`, `bcrypt`, `pg` (already in project)

**Storage**: PostgreSQL (existing `library_db` database)

**Testing**: NEEDS CLARIFICATION — no test framework detected; manual validation via browser

**Target Platform**: Web (modern browsers — Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (Next.js frontend + Express.js REST API backend)

**Performance Goals**: Page load under 2 seconds; calendar navigation without page reload

**Constraints**: Must comply with Atomic Design (components/atoms/molecules/organisms/templates), i18n (en/vi), theme (light/dark via Tailwind), backend layered architecture (Route → Middleware → Controller → Service → Model)

**Scale/Scope**: Single dashboard page for user role; future expansion for librarian/admin roles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Gate | Status | Justification |
|------|--------|---------------|
| **I. Atomic Design** | PASS | All new UI follows atoms → molecules → organisms → templates flow; existing component directories used |
| **II. State Mgmt** | PASS | React Context for session; loading/error/success states for API calls |
| **III. Responsive** | PASS | Grid/Flexbox layout from UI_des.txt adapted with responsive breakpoints |
| **IV. Performance** | PASS | Dashboard is interactive → Client Component; no heavy images |
| **V. Error Handling** | PASS | Auth guard notifications; API error states |
| **VI. Dir Structure** | PASS | `client/app/dashboard/user/` follows App Router convention; no root alteration |
| **VII. Layered Backend** | PASS | New dashboard routes → controllers → services → models follow existing pattern |
| **VIII. Import Paths** | PASS | All imports verified against actual project tree |
| **IX. Theme & i18n** | PASS | Tailwind dark: classes; i18n keys in en.json/vi.json; no hardcoded colors or text |

## Project Structure

### Documentation (this feature)

```text
specs/009-user-dashboard-page/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output — resolved unknowns
├── data-model.md        # Phase 1 output — entities and fields
├── quickstart.md        # Phase 1 output — validation guide
├── contracts/           # Phase 1 output — API contracts
│   └── api-contract.md
├── checklists/          # Quality checklists
│   └── requirements.md
└── tasks.md             # Phase 2 output — implementation tasks (NOT created by /speckit.plan)
```

### Source Code

```text
# Frontend
client/
└── app/
    ├── dashboard/
    │   ├── layout.tsx              # NEW — shared dashboard layout (sidebar + auth guard)
    │   └── user/
    │       └── page.tsx            # NEW — user dashboard page
    ├── components/
    │   ├── atoms/
    │   │   └── Toast.tsx           # NEW — notification toast component
    │   ├── molecules/
    │   │   └── DashboardCalendar.tsx # NEW — interactive calendar molecule
    │   └── organisms/
    │       ├── DashboardSidebar.tsx # NEW — sidebar navigation organism
    │       └── UpcomingAgenda.tsx   # NEW — agenda panel organism
    ├── locales/
    │   ├── en.json                 # UPDATED — add dashboard translations
    │   └── vi.json                 # UPDATED — add dashboard translations
    └── utils/
        └── user.ts                 # UPDATED — role field already added

# Backend
server/src/
├── controllers/
│   └── dashboard.controllers.mjs  # NEW — dashboard data endpoints
├── middlewares/
│   ├── auth.middleware.mjs         # EXISTING — verifyToken
│   └── role.middleware.mjs         # CREATED — authorizeRole
├── models/
│   └── dashboard.models.mjs       # NEW — dashboard data queries
├── routes/
│   ├── auth.routes.mjs            # EXISTING
│   └── dashboard.routes.mjs       # NEW — /dashboard endpoints
└── services/
    └── dashboard.services.mjs     # NEW — dashboard business logic
```

**Structure Decision**: Web application structure matching the existing project layout. Frontend uses Next.js App Router (`client/app/`) with Atomic Design components (`components/`). Backend uses Express.js layered architecture (`routes/ → controllers/ → services/ → models/`). No deviation from existing conventions.

## Complexity Tracking

*No constitution violations — architecture stays within existing project patterns.*

---

## Phases

### Phase 0: Research & Unknowns

**Research tasks to resolve unknowns:**

1. **Notification/Toast pattern**: No existing toast component found. Research standard toast implementations for the tech stack.
2. **Calendar rendering approach**: Research how to build an interactive month-grid calendar in React with day navigation.
3. **Dashboard backend API contract**: Define what data the frontend needs (user info, calendar events, agenda items) and design REST endpoints.
4. **NavBar dashboard link**: Currently points to `/dashboard` — needs update to `/dashboard/user`.

### Phase 1: Design & Contracts

1. **Data Model**: Define `calendar_events` table fields and relationships
2. **API Contract**: Define `GET /dashboard/events`, `GET /dashboard/agenda`, `POST /dashboard/events`
3. **Quickstart**: Document manual validation scenarios
4. **Agent context update**: Update `AGENTS.md` SPECKIT markers
