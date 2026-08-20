# Tasks: Avatar Upload and Profile Page Enhancements

**Input**: Design documents from `/specs/020-avatar-upload-profile-enhancements/`

**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Dependency installation and baseline setup.

- [x] T001 Install `cloudinary` and `multer` dependencies in `src/server/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core configurations and database model queries.

- [x] T002 Create Cloudinary connection configuration helper in `src/server/src/config/cloudinary.config.mjs`
- [x] T003 [P] Create Multer middleware for memory storage and size limits in `src/server/src/middlewares/multer.middlewares.mjs`
- [x] T004 Update database query `getUserById` in `src/server/src/models/user.models.mjs` to fetch and return `borrow_num`

---

## Phase 3: User Story 1 - Flexible Avatar Update (Priority: P1) 🎯 MVP

**Goal**: Implement the circular avatar layout, the file upload flow (to Cloudinary), and the direct image URL paste flow.

**Independent Test**: Navigate to the profile page, verify that the hover edit overlay displays over the avatar, upload an image file under 2MB, and see the avatar update on both the profile page and the sidebar. Also, test pasting a valid image URL.

### Implementation for User Story 1

- [x] T005 [P] [US1] Implement controller endpoint handler in `src/server/src/controllers/user.controllers.mjs` to accept file upload streams or json URL strings
- [x] T006 [US1] Create route `POST /user/avatar` with `verifyToken` and multer middleware in `src/server/src/routes/user.routes.mjs`
- [x] T007 [US1] Create the `AvatarUploader.tsx` component in `src/client/app/components/molecules/AvatarUploader.tsx` with circular layout, fallback icon, and hover overlay triggers
- [x] T008 [US1] Integrate `AvatarUploader` into `src/client/app/components/organisms/Sidebar.tsx` and `src/client/app/components/templates/ProfileTemplate.tsx` using the `avatarUrl` prop

---

## Phase 4: User Story 2 - Read-Only Account Status Display (Priority: P2)

**Goal**: Display the user's role badge and book borrow count in read-only cards on the profile page.

**Independent Test**: Log in with a user role (e.g. Reader) and an active borrow count. Navigate to `/profile` and verify that the role badge and the borrowed count are displayed in read-only format.

### Implementation for User Story 2

- [x] T009 [US2] Update `src/client/app/profile/page.tsx` state to retrieve `avatarUrl`, `role`, and `borrowNum` from `GET /user/profile`
- [x] T010 [US2] Add the styled read-only role badge and two read-only `ProfileCard` components (for borrow count and role) in `src/client/app/components/templates/ProfileTemplate.tsx`

---

## Phase 5: User Story 3 - Avatar Upload Validation and Error Handling (Priority: P3)

**Goal**: Enforce local file type and size constraints, handle upload/network errors, and display localized warnings.

**Independent Test**: Try selecting a file larger than 2MB or a text file in the uploader and verify that the upload is blocked locally with an error. Test pasted URL validation.

### Implementation for User Story 3

- [x] T011 [US3] Implement client-side size checking (<= 2MB) and file-type validation (`image/*`) in `src/client/app/components/molecules/AvatarUploader.tsx`
- [x] T012 [US3] Hook up localized error toast notifications and error banners to avatar actions inside `src/client/app/components/molecules/AvatarUploader.tsx`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Translation dictionary updates, theme checks, and final testing.

- [x] T013 Update English and Vietnamese translations in `src/client/app/locales/en.json` and `vi.json`
- [x] T014 Verify responsive CSS layout adjustments and light/dark theme compliance for all updated components
- [x] T015 Run final verification check against the user quickstart instructions and specification goals

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion. Blocks user stories.
- **User Stories (Phase 3+)**: All depend on Foundational completion.
  - US1 (P1) -> US2 (P2) -> US3 (P3)
- **Polish (Phase 6)**: Depends on all desired user stories being complete.

### Parallel Opportunities
- Foundational tasks (T002, T003) can run in parallel.
- US1 backend controller (T005) and client layout (T007) can run in parallel once foundations are in place.
