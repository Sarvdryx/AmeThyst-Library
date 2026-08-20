# Implementation Plan: Authorization & Role Management

**Branch**: `029-authorization-role-management` | **Date**: 2026-08-07 | **Spec**: [spec.md](file:///C:/Users/ADMIN/Desktop/AmeThyst-Library/src/specs/029-authorization-role-management/spec.md)

**Input**: Feature specification from `specs/029-authorization-role-management/spec.md`

---

## Summary

Implement the admin-only Authorization & Role Management module on the authorization tab of the admin dashboard, enabling safe role management across three isolated roles (`user`, `librarian`, `admin`). Key features include:

- **Role Operations**: Promote `user` → `librarian`/`admin`, demote `librarian` → `user`, demote `admin` → `librarian`/`user`, and add a new admin via email invite (temporary password).
- **Pre-Check Guards**: Active-account status check before any role change; promotion blocked when the user has unreturned books (`borrow_book`) or outstanding unpaid fines (`book_penalty`).
- **Immediate Access Termination**: On demotion, revoke the target's active sessions via a token-version mechanism so the previous JWT is rejected on the very next request.
- **Security Guardrails**: Self-action restriction, last-admin protection (race-safe), and sudo re-authentication (current-password) for high-risk actions.
- **Audit Trail**: Every role change is recorded in `authorize_history` (actor, target, timestamp) and detailed in `admin_audit_logs` (prev/new role) for display.
- **Real-Time History Log**: Authorization history panel on the admin dashboard updates live via Socket.IO (existing `announcement:changed` pattern).
- **Frontend**: Full management UI (Role Management panel + Authorization History panel) following the existing admin dashboard design system, with light/dark theme and English/Vietnamese localization.

---

## Technical Context

**Language/Version**: JavaScript (Node.js ES Modules `.mjs` for backend, React 18 / Next.js App Router with TypeScript for frontend)

**Primary Dependencies**: Express.js, Next.js, `pg` (PostgreSQL), `jsonwebtoken` (JWT), `bcryptjs`, `socket.io` (real-time), `nodemailer` (email invites)

**Storage**: PostgreSQL — `users` (role, status), `authorize_history`, `admin_audit_logs`, `borrow_book` (liability pre-check), `book_penalty` (liability pre-check), `branches`. Two additive columns are proposed: `users.token_version` (immediate session invalidation) and `users.must_change_password` (temp-password invite flow).

**Testing**: Vitest (backend services & controllers), React Testing Library (frontend components)

**Target Platform**: Web Browsers (Responsive Desktop, Tablet, Mobile)

**Project Type**: Full-Stack Web Application (`client/` + `server/`)

**Performance Goals**: API responses for role operations and history listing < 2s; a new authorization history entry appears in the UI within 2 seconds of the change (SC-007, SC-009).

**Constraints**: Access to the module strictly limited to `admin`; demotions MUST terminate the target's access immediately (SC-003); the system MUST never drop below one active admin (SC-005, race-safe); every role change MUST be audited (SC-006).

**Scale/Scope**: Library system with three roles; single admin dashboard authorization tab; no account deletion (promotion/demotion only).

**Unknowns resolved in Phase 0 (research.md)**:
- Token/session invalidation approach (no refresh-token infrastructure exists; JWT is stateless, 7d expiry, with a per-request DB role lookup).
- Admin email-invite account creation flow (how to model "must change temporary password" without a flag column).
- Audit display strategy (how the history UI shows "USER → LIBRARIAN" given `authorize_history` stores only actor/target/timestamp).

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked post Phase 1 design.*

- [x] **Core Principle I (Component-Driven & Atomic Design)**: The authorization tab UI is built bottom-up from existing atoms/molecules (Badge, Button, FilterDropdown, SearchBar, Pagination, Toast, Modal) and new organisms (Role Management panel, Authorization History panel). No higher-level component is prototyped without its atomic building blocks.
- [x] **Core Principle II (State Management & API Base URL)**: All backend calls use `NEXT_PUBLIC_API_URL`; every fetch handles `loading`, `error`, `success`. Session/role state stays in the existing auth context.
- [x] **Core Principle III (Responsive & Beautiful Design)**: Panels use flexible grid/flexbox; tables scroll horizontally on small screens; toasts/banners report success/failure.
- [x] **Core Principle IV (Performance Optimization)**: The authorization tab is a highly interactive client component; no heavy images or SEO needs.
- [x] **Core Principle V (Error Handling & Accessibility)**: Frontend validates sudo password and email before submit; user-friendly errors; keyboard-navigable tables/modals; meaningful labels.
- [x] **Core Principle VI & VIII (Directory Structure & Import Verification)**: Verified `client/app/dashboard/admin/` and `server/src/` hierarchies; imports checked against actual file tree.
- [x] **Core Principle VII & Backend Conventions**: Backend follows `routes -> middlewares -> controllers -> services -> models` with `.mjs` ES Modules; business logic in the service layer; validation via middlewares.
- [x] **Core Principle IX (Theme & Localization)**: UI uses design tokens (light/dark) and extracts all text to `en.json`/`vi.json` via the i18n hook.

---

## Project Structure

### Documentation (this feature)

```text
specs/029-authorization-role-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── authorization-management-api.md
└── tasks.md             # Phase 2 output (to be generated by /speckit.tasks)
```

### Source Code (repository root)

```text
backend/
server/src/
├── config/
│   └── postgres.config.mjs            # existing (pool)
├── controllers/
│   └── authorization.controllers.mjs  # NEW
├── middlewares/
│   ├── auth.middleware.mjs            # existing (verifyToken, authenticate)
│   └── role.middleware.mjs            # existing (authorizeRole)
├── models/
│   ├── authorization.models.mjs       # NEW (users list, role change, audit, token_version)
│   └── auth.models.mjs                # existing (findUserByEmail)
├── routes/
│   └── authorization.routes.mjs       # NEW (mounted at /api/authorization)
├── services/
│   └── authorization.services.mjs     # NEW (guards, sudo verify, transactions, audit, socket emit)
└── utils/
    └── mailer.mjs                     # existing (add sendAdminInviteEmail)

frontend/
client/
├── app/
│   ├── (dashboard)/
│   │   └── admin/
│   │       ├── authorization/
│   │       │   └── page.tsx           # REPLACE placeholder with management screen
│   │       └── layout.tsx             # existing admin shell (NavBar, AdminDashboardSidebar)
│   └── components/
│       ├── organisms/
│       │   ├── RoleManagementPanel.tsx    # NEW
│       │   └── AuthorizationHistoryPanel.tsx # NEW
│       ├── molecules/
│       │   ├── AccountTableRow.tsx        # NEW
│       │   └── HistoryLogRow.tsx          # NEW
│       ├── modals/
│       │   ├── RoleChangeModal.tsx        # NEW (promote + demote variants)
│       │   ├── SudoVerifyModal.tsx        # NEW (re-auth step)
│       │   └── InviteAdminModal.tsx       # NEW
│       └── ui/                            # existing atoms (Badge, Button, Toast, etc.)
└── app/
    └── locales/
        ├── en.json                       # add admin.authorization.* keys
        └── vi.json                       # add admin.authorization.* keys
```

**Structure Decision**: Standard full-stack split — Express backend in `server/` (layered `.mjs` architecture with a new `authorization` resource), Next.js App Router frontend in `client/` (replacing the placeholder page under the existing admin dashboard layout and extending the existing Atomic Design component library). No changes to the root architecture.

---

## Complexity Tracking

> No constitution violations detected. Standard multi-tier feature with role middleware, transactional service logic, and existing real-time/socket patterns.

| Feature Area | Complexity Reason | Mitigation / Design Choice |
|---|---|---|
| Immediate Token Invalidation | Stateless JWT (7d) with no session store | Add `users.token_version`, embed it in the JWT, compare per-request; increment on demotion (see research.md) |
| Last-Admin Protection (race-safe) | Concurrent demotions must not zero out admins | Perform count + update inside one transaction with row locking |
| Email Invite + Temp Password | No flag for "must change password" | Add `users.must_change_password`; set on invite; force change on next login (client + backend guard) |
| Audit Display ("USER → LIBRARIAN") | `authorize_history` lacks role columns | Also write prev/new role into `admin_audit_logs`; history endpoint joins it for display |
| Real-Time History | Live UI updates | Reuse Socket.IO `authorization:changed` broadcast pattern from announcements |
