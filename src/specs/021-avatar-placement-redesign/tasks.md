# Tasks: Redesign Avatar Placement and Sizing

**Input**: Design documents from `specs/021-avatar-placement-redesign/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Set up component exports to simplify imports

- [x] T001 [P] Export AvatarUploader in `src/client/app/components/molecules/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Adjust layouts and templates to support prop forwarding of the avatar state

- [x] T002 Update template `src/client/app/components/templates/ProfileTemplate.tsx` to receive `avatarUrl` and `onAvatarUpdate` props and forward them to Sidebar and NavBar

---

## Phase 3: User Story 1 - Profile Avatar Management in Sidebar (Priority: P1) 🎯 MVP

**Goal**: Place `AvatarUploader` inside the Left Sidebar permanently with an increased size of `w-28 h-28`

**Independent Test**: Go to `/profile`, verify the uploader is rendered inside the Sidebar, hover over it, and trigger the upload flow. The Sidebar avatar must show the new image.

### Implementation for User Story 1

- [x] T003 [US1] Update `src/client/app/components/organisms/Sidebar.tsx` to import and render `AvatarUploader` component inside the avatar wrapper instead of the static img/button
- [x] T004 [US1] Configure the embedded `AvatarUploader` inside `src/client/app/components/organisms/Sidebar.tsx` to use `w-28 h-28` classes and forward the `onAvatarUpdate` callback

---

## Phase 4: User Story 2 - Navbar Avatar Synchronization (Priority: P2)

**Goal**: Update the top Navbar to render the avatar image and sync it instantly when modified on the profile page

**Independent Test**: Load the profile page, edit the avatar, and verify the top Navbar's avatar changes in real-time. Navigate to other pages and verify the avatar remains updated in the Navbar.

### Implementation for User Story 2

- [x] T005 [US2] Update `src/client/app/components/molecules/AuthActions.tsx` to accept an optional `avatarUrl` prop and display the circular avatar image instead of user initials if an avatar is set (either from props or from logged-in user in `localStorage`)
- [x] T006 [US2] Update `src/client/app/components/organisms/NavBar.tsx` to accept `avatarUrl` prop and pass it to the `AuthActions` component
- [x] T007 [US2] Ensure that when the avatar updates, the application invokes `updateStoredUser({ avatar: newAvatarUrl })` to persist the session in `localStorage`

---

## Phase 5: User Story 3 - Main Profile Content Cleanup (Priority: P3)

**Goal**: Remove the avatar uploader UI from the main profile page content area, and lift the state high enough to feed Sidebar and Navbar

**Independent Test**: Inspect the main content of `/profile` to ensure no avatar uploader UI is visible. Verify that uploader updates work on both Profile and Security pages.

### Implementation for User Story 3

- [x] T008 [US3] Modify `src/client/app/profile/page.tsx` to remove the main content `AvatarUploader` component and pass the profile `avatarUrl` and `handleAvatarUpdate` handler down to `ProfileTemplate`
- [x] T009 [US3] Modify `src/client/app/profile/security/page.tsx` to retrieve user session details (username, avatarUrl, role) from `localStorage` or profile API and pass them to `ProfileTemplate`

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: General cleanup, manual validation, and sanity checks

- [x] T010 [P] Verify that the uploader styling conforms to Light/Dark modes in both Sidebar and Navbar
- [x] T011 Run validation steps in `quickstart.md` to confirm all functionalities work as expected

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** and **Foundational (Phase 2)**: Must be completed first to enable import exports and prop drilling structure.
- **User Story 1 (Phase 3)**: Core uploader relocation. Blocks Story 3 cleanup.
- **User Story 2 (Phase 4)**: Navbar sync. Can run in parallel with or after Story 1.
- **User Story 3 (Phase 5)**: Main content cleanup and lifting state integration. Runs after Story 1 and Story 2.
- **Polish (Phase 6)**: Runs after all user story implementation is complete.

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Setup and Foundational tasks (T001-T002).
2. Complete User Story 1 (T003-T004) to have a functioning uploader in the Sidebar.
3. Validate that the uploader works.

### Incremental Delivery

1. Integrate Navbar Sync (T005-T007).
2. Perform Main Content Cleanup and lifting state integration (T008-T009).
3. Validate overall cross-component state synchronization.
