# Tasks: Bookshelf Frontend UI

**Input**: Design documents from `specs/005-bookshelf-frontend-ui/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: N/A (Tests not explicitly requested for this static UI phase)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `client/src/` (Note: plan.md says `client/app/` and `client/components/`, so I will use those paths)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create project structure for atomic components in `client/components/atoms/`, `client/components/molecules/`, and `client/components/organisms/`
- [x] T002 [P] Configure Tailwind CSS theme with brand colors (#F8EFE6, #091426, #006F66, #FFB95F) in `client/tailwind.config.ts`
- [x] T003 [P] Setup custom font families (Inter, Manrope, Open Sans) in `client/app/layout.tsx` or `client/tailwind.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Setup global styles and background color (#F8EFE6) in `client/app/globals.css`
- [x] T005 Create the main Page Template/Layout in `client/components/templates/HomeLayout.tsx` to handle vertical ordering
- [x] T006 Initialize the main entry point in `client/app/page.tsx` using the HomeLayout

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Library Home Discovery (Priority: P1) 🎯 MVP

**Goal**: Assemble all core components into the landing page to deliver the primary discovery experience.

**Independent Test**: Navigate to the landing page and verify all sections (Navbar, Hero, SearchBar, PopularPublishes, StudyGroup, Footer) are rendered in order with mock data.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create Atom components (Button, Icons) in `client/components/atoms/`
- [x] T008 [P] [US1] Create Navbar organism in `client/components/organisms/Navbar.tsx`
- [x] T009 [P] [US1] Create HeroSection organism in `client/components/organisms/HeroSection.tsx`
- [x] T010 [P] [US1] Create SearchBar molecule in `client/components/molecules/SearchBar.tsx`
- [x] T011 [P] [US1] Create BookCard molecule in `client/components/molecules/BookCard.tsx`
- [x] T012 [P] [US1] Create PopularPublishes organism in `client/components/organisms/PopularPublishes.tsx` (using mock data)
- [x] T013 [P] [US1] Create StudyGroupCard molecule in `client/components/molecules/StudyGroupCard.tsx`
- [x] T014 [P] [US1] Create StudyGroup organism in `client/components/organisms/StudyGroup.tsx` (using mock data)
- [x] T015 [P] [US1] Create Footer organism in `client/components/organisms/Footer.tsx`
- [x] T016 [US1] Assemble all components in `client/app/page.tsx` ensuring correct top-to-bottom sequence

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently.

---

## Phase 4: User Story 2 - Seamless Mobile Experience (Priority: P2)

**Goal**: Ensure the layout is fully responsive and stacks logically on smaller viewports.

**Independent Test**: Use browser DevTools to verify that the page remains readable and scrollable at 320px width without horizontal overflow.

### Implementation for User Story 2

- [x] T017 [US2] Audit all components in `client/components/` to remove any hardcoded absolute positioning (absolute, top-*, left-*)
- [x] T018 [P] [US2] Implement responsive grid columns for book list (1 col mobile, 4 col desktop) in `client/components/organisms/PopularPublishes.tsx`
- [x] T019 [P] [US2] Implement responsive grid columns for study groups (1 col mobile, 2 col desktop) in `client/components/organisms/StudyGroup.tsx`
- [x] T020 [US2] Ensure SearchBar centering and padding is responsive in `client/components/molecules/SearchBar.tsx`

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently.

---

## Phase 5: User Story 3 - Visual Brand Alignment (Priority: P3)

**Goal**: Refine the aesthetic to strictly match the specified color palette, typography, and interactive behaviors.

**Independent Test**: Inspect components for correct CSS properties and verify smooth transitions on hover.

### Implementation for User Story 3

- [x] T021 [P] [US3] Apply Teal (#006F66) and Navy (#091426) accents to buttons and links across all components in `client/components/`
- [x] T022 [P] [US3] Ensure all text elements use specified font families (Inter, Manrope, Open Sans) in `client/components/`
- [x] T023 [US3] Add hover micro-interactions and transitions to BookCards and StudyGroupCards in `client/components/molecules/`

**Checkpoint**: All user stories should now be independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T024 [P] Verify image optimization using Next.js `<Image>` component for all covers and banners in `client/components/`
- [x] T025 Run quickstart.md validation scenarios to confirm final readiness
- [x] T026 Cleanup any temporary styles or unused imports in `client/`
- [x] T027 [P] Ensure all components are correctly placed in `client/app/components` per project structure.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately.
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories.
- **User Stories (Phase 3+)**: All depend on Foundational phase completion.
- **Polish (Final Phase)**: Depends on all desired user stories being complete.

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2).
- **User Story 2 (P2)**: Refines US1 components for mobile; depends on T016 completion.
- **User Story 3 (P3)**: Refines US1/US2 styles; depends on T016 completion.

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel.
- Most components in US1 (T007-T015) can be built in parallel once Atoms are defined.
- Responsive tweaks (T018, T019) and Style refinements (T021, T022) can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Launch all component implementation for User Story 1 together:
Task: "Create Navbar organism in client/components/organisms/Navbar.tsx"
Task: "Create HeroSection organism in client/components/organisms/HeroSection.tsx"
Task: "Create SearchBar molecule in client/components/molecules/SearchBar.tsx"
Task: "Create BookCard molecule in client/components/molecules/BookCard.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1 (Assembling the page)
4. **STOP and VALIDATE**: Test User Story 1 independently on Desktop.

### Incremental Delivery

1. Foundation ready.
2. Add User Story 1 → Landing page functional (MVP!).
3. Add User Story 2 → Mobile responsiveness optimized.
4. Add User Story 3 → Visuals and branding perfected.

---

## Notes

- [P] tasks = different files, no dependencies.
- [Story] label maps task to specific user story for traceability.
- Each user story should be independently completable and testable.
- Commit after each component or logical group.
