# Research: Avatar Placement Redesign

## Summary of Architectural Decisions

This document outlines the research and architectural decisions made for the redesign of the avatar placement, sizing, and synchronization on the Profile page.

### 1. Avatar State Management & Real-Time Sync

* **Decision**: Lift the avatar state to `profile/page.tsx`. Propagate the `avatarUrl` state and the `onAvatarUpdate` handler down to `ProfileTemplate.tsx`. `ProfileTemplate` then feeds:
  - `NavBar.tsx` (specifically the `AuthActions` component inside it) with `avatarUrl`
  - `Sidebar.tsx` with `avatarUrl` and `onAvatarUpdate`
* **Rationale**: This is the standard, native React mechanism for components residing in the same tree (under `ProfileTemplate`). It ensures that whenever the uploader updates the avatar, the Navbar and Sidebar re-render instantly with the new value.
* **Session Persistence**: On update, we will call `updateStoredUser({ avatar: newAvatarUrl })` to update the user session in `localStorage`. This ensures that other templates (e.g. Dashboard, Library) which load their Navbar independently will render the updated avatar on subsequent navigations or page mounts.
* **Alternatives Considered**:
  - *Alternative 1: Custom Window Events / PubSub*: Having the Sidebar dispatch a `window.dispatchEvent(new CustomEvent('avatarUpdate'))` and having `AuthActions` subscribe to it.
    - *Why Rejected*: Although decoupled, this introduces window-level event listeners which are harder to test and trace compared to standard React props. Since both components are within `ProfileTemplate`, props are cleaner.

### 2. NavBar / AuthActions Integration

* **Decision**: Update `AuthActions.tsx` to support displaying a circular image instead of just initials when an avatar is present.
  - Add an optional `avatarUrl` prop to `AuthActions`.
  - Inside `AuthActions`, determine the active avatar via:
    `const activeAvatarUrl = avatarUrl || user?.avatar;`
  - If `activeAvatarUrl` is present, render a `<img src={activeAvatarUrl} className="w-10 h-10 rounded-full object-cover border border-neutral-700 hover:scale-105 transition-all cursor-pointer" />` wrapped in the Link to `/profile`.
  - Fall back to the initials box if `activeAvatarUrl` is null/empty.
* **Rationale**: Currently, `AuthActions` only displays initials. Displaying the actual avatar image matches modern dashboard and application standards.

### 3. Sidebar Sizing and Embedding

* **Decision**: Move the `AvatarUploader` molecule directly into the `Sidebar` organism.
  - The size of the avatar in the Sidebar will be set to `w-28 h-28` (112px), an increase of 40% over the original `w-20 h-20` (80px).
  - The `AvatarUploader` component already implements uploader trigger overlays, hidden file inputs, and Paste URL modal controls. Embedding it in the Sidebar satisfies the permanence requirement.
  - Export `AvatarUploader` in `src/client/app/components/molecules/index.ts` so that it can be imported in `Sidebar.tsx` cleanly.
* **Rationale**: Reuses the fully validated `AvatarUploader` component with appropriate sizing, aligning with Atomic Design principles.
