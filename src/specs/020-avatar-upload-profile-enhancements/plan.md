# Implementation Plan: Avatar Upload and Profile Page Enhancements

**Branch**: `020-avatar-upload-profile-enhancements` | **Date**: 2026-06-26 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/020-avatar-upload-profile-enhancements/spec.md`

## Summary
Add support for circular profile avatar displays in the Left Sidebar and Profile Page, allowing users to update their avatar by uploading a local file (uploaded to Cloudinary via server-side Multer memory storage) or pasting a direct image URL. Enhance the profile page to display the user's role badge and borrowing count (`borrow_num`) in read-only cards, ensuring no modifications to the bio or department.

## Technical Context

- **Language/Version**: Node.js v18+, TypeScript v5.0+, React 18 / Next.js
- **Primary Dependencies**: `express`, `pg`, `cloudinary`, `multer` (Server) | `react`, `next`, `tailwindcss` (Client)
- **Storage**: PostgreSQL (existing `users` table `avatar`, `role`, `borrow_num` columns)
- **Testing**: Frontend Jest/Testing Library, Backend Supertest (Integrations)
- **Target Platform**: Web browsers, Node.js environment
- **Project Type**: Web application (Next.js frontend + Node/Express backend)
- **Performance Goals**: Avatar updates show instantly (<3s for URLs, <5s for file uploads on standard connections)
- **Constraints**: File size <= 2MB, files must be `image/*`, all actions must be authenticated with token verification (`verifyToken`)
- **Scale/Scope**: Moderate complexity, affecting user profile, sidebar, and database profile queries

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle / Gate | Status | Description |
|------------------|--------|-------------|
| **I. Component-Driven** | Compliant | `AvatarUploader` created as a molecule component under `/app/components/molecules/` using existing atoms. |
| **II. Data Fetching & State** | Compliant | Enforces loading, success, and error handling states; loads backend Base URL dynamically via environment variables. |
| **III. UI/UX Design** | Compliant | Enforces circular styling with clean overlay interactions and modern layout. |
| **IV. Performance** | Compliant | Uses standard Next.js `<Image>` component for rendering and optimization. |
| **V. Error Handling** | Compliant | Validates inputs on client (file type, size, URL format) and server (multer limits) with clear warnings. |
| **VI. Directory Hierarchy** | Compliant | Strictly follows client and server project folder rules. |
| **VII. Layered Architecture** | Compliant | Backend follows flow: `Routes` -> `verifyToken/multer middlewares` -> `Controllers` -> `Services` -> `Models`. |
| **VIII. Import Paths** | Compliant | Verified paths for all client/server imports. |
| **IX. Theme & Localization** | Compliant | Uses dark mode Tailwind classes, translations in `en.json` and `vi.json` via translation hooks. |

## Project Structure

### Documentation (this feature)

```text
src/specs/020-avatar-upload-profile-enhancements/
├── plan.md              # This file
├── research.md          # Technology research and architectural decisions
├── data-model.md        # Database schema columns and constraints
├── quickstart.md        # Local environment run instructions
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code

**Backend Structure (`src/server/src/`):**
```text
config/
└── cloudinary.config.mjs     # Configures Cloudinary connection settings
controllers/
└── user.controllers.mjs      # Updated with getProfile, uploadAvatar handlers
middlewares/
├── auth.middleware.mjs       # Holds token verifyToken middleware
└── multer.middlewares.mjs     # Multer middleware for memory storage & file limits
models/
└── user.models.mjs           # DB queries including role and borrow_num
routes/
└── user.routes.mjs           # Routes mapping POST /user/avatar
services/
└── user.services.mjs         # Handles business logic for database and Cloudinary uploads
```

**Frontend Structure (`src/client/app/`):**
```text
components/
├── molecules/
│   └── AvatarUploader.tsx    # Upload/Paste controls and visual hover overlay
├── organisms/
│   └── Sidebar.tsx           # Displays the circular avatar prop
└── templates/
    └── ProfileTemplate.tsx   # Wires AvatarUploader and displays read-only cards
locales/
├── en.json                   # English translation keys
└── vi.json                   # Vietnamese translation keys
profile/
└── page.tsx                  # Profile page component fetching data on mount
```

**Structure Decision**: Fully aligned with the Next.js App Router structure on the client and Layered Architecture pattern using ES Modules (`.mjs`) on the server.
