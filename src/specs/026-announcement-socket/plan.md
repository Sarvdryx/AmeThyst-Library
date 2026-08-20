# Plan: Announcement Notification Bell & is_pinned Removal

## 1. Workstream Overview
To minimize regression risk and enable isolated code reviews, audits, and potential rollbacks, the implementation is partitioned into four independent phases:
- **Workstream A: is_pinned Removal**: Complete database and backend database/code decoupling of the homepage-pin feature, along with admin panel form adjustments.
- **Workstream B: Notification Bell Dropdown**: Integration of the dropdown panel inside the user menu with loading skeletons, click-outside handling, and locales.
- **Workstream C: Bell Dropdown Refinement & Custom Themes**: Refactor the bell dropdown into Atomic Design components, implement light/dark mode themes using LIMA tokens, and introduce client-side read/unread tracking via localStorage.
- **Workstream D: Full Announcement Reading View**: Centered overlay modal styled like a news article, using LIMA design tokens, with close controls, scroll locking, and line-break preservation.

---

## 2. Workstream A: is_pinned Removal

### Database & Migrations
- Write a PostgreSQL migration [drop_is_pinned.sql](file:///D:/HK3/Library/AmeThyst-Library/src/database/migrations/drop_is_pinned.sql) to drop `is_pinned` column.
- Update table schema initialization within [05_init_rest.sql](file:///D:/HK3/Library/AmeThyst-Library/src/database/init_db/postgres/05_init_rest.sql).

### Backend Cleanup
- Remove the `isPinned` parameter and database mappings in [announcement.models.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/models/announcement.models.mjs):
  - `insertAnnouncement`
  - `findAnnouncementsForManagement`
  - `findAnnouncementById`
  - `updateAnnouncementStatus`
  - `updateAnnouncementDetails`
  - `findActiveAnnouncements` (remove `is_pinned DESC` from ordering)
- Update [announcement.services.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/services/announcement.services.mjs):
  - Remove parameter extraction in `createAnnouncementService`
  - Remove parameter extraction in `editAnnouncementDetailsService`
- Clean up controller mapping payload extraction in [announcement.controllers.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/controllers/announcement.controllers.mjs):
  - `createAnnouncementController`
  - `editAnnouncementDetailsController`

### Admin Panel Cleanup
- Remove the `isPinned` parameter from typescript model types in [AnnouncementListItem.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AnnouncementListItem.tsx).
- In [LibrarianAnnouncementsPanel.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx):
  - Remove `editIsPinned` state hooks.
  - Drop the `ToggleSwitch` component and associated translation labels from the markup.
  - Remove payload mapping parameters from fetch/save commands.
- Remove `pin_to_homepage` keys from i18n localization files ([en.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/en.json) & [vi.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/vi.json)).

---

## 3. Workstream B: Notification Bell

### Click-Outside Hook & Toggle Integration
- Modify [AuthActions.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AuthActions.tsx) to wrap the notification bell inside a relative container.
- Establish an `isOpen` dropdown state and a `notificationRef` reference hook.
- Implement click-outside mousedown listener pattern following the CustomSelect component.

### Data Fetching
- Fetch active announcements from `GET /api/announcements` using `apiFetch`.
- Perform fetch operations inside a `useEffect` trigger hook when the user is logged in.

### Dropdown Rendering & UI Polish
- Render a drop-down panel with a solid black `#000` background and white text.
- Show announcement title, formatted creation date, and body contents.
- Implement `line-clamp-2` body truncation for compact layouts, allowing click-to-expand to toggle full content inline.
- Design loading skeletons representing empty state blocks.
- Draw a persistent indicator dot over the bell icon when there are active notifications.
- Register translation keys under the `"navbar"` namespace for announcements.

---

## 4. Workstream C: Bell Dropdown Refinement & Custom Themes

### Component Restructuring (Atomic Design)
Refactor all dropdown markup and logic out of [AuthActions.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AuthActions.tsx) into the following atomic structure:
- **Atoms (app/components/atoms/)**:
  - `BellIcon`: Renders the notification bell SVG icon.
  - `NotificationDot`: Renders the indicator dot showing unseen/unread items.
- **Molecules (app/components/molecules/)**:
  - `AnnouncementNotificationItem`: Renders a single announcement title, formatted date, content body with text truncation, and toggles line-clamping on click.
  - `NotificationDropdownPanel`: Renders the wrapper panel for the notifications list, handling the loading skeleton and empty messages list states.
  - `NotificationBell`: Integrates the click-outside event hook, toggling dropdown visibility and triggering read action.
- **Hooks (app/hooks/)**:
  - `useAnnouncementBell`: Encapsulates backend data fetching via `apiFetch` (reusing the `/api/announcements` pattern) and client-side unread tracking via browser `localStorage`.

### Client-Side Read State Tracking
- Access client-side persistent storage via `localStorage` with safety checks (`typeof window !== 'undefined'`) to prevent SSR/hydration mismatch errors.
- Store the ID of the newest announcement loaded under key `amethyst:announcements:lastSeenId`.
- Compare the fetched announcements' top ID against the last seen ID. Show the indicator dot (`hasUnread` = `true`) if a mismatch exists.
- Wipe the unread dot and record the newest announcement ID to `localStorage` immediately when the user clicks the bell icon to toggle the dropdown panel.

### LIMA theme styling (Light/Dark Mode Tokens)
Replace all hard-coded colors with theme variables defined in [globals.css](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/globals.css) so they react correctly to theme changes.

| Target Element | Hard-coded Style (Workstream B) | Theme-compatible Style (Workstream C) | LIMA Token Match / Rationale |
|---|---|---|---|
| Outer Panel Background | `bg-[#000]` | `bg-background` | Maps to `--background` |
| Panel Text Colors | `text-white` | `text-foreground` | Maps to `--foreground` |
| Divider Line color | `border-neutral-700` | `border-foreground/10` | Fades out borders based on theme text color |
| Announcement Date Text | `text-neutral-500` | `text-foreground/50` | Muted theme-sensitive color |
| Announcement Body Text | `text-neutral-400` | `text-foreground/70` | Secondary theme-sensitive color |
| Badge Background | `bg-amber-500` | `bg-orange` | Maps to `--color-orange` |
| Badge Text Color | `text-[#000]` | `text-navy` | Maps to `--color-navy` |
| Notification Dot Ring | `ring-background` | `ring-black dark:ring-neutral-950` | Blends with the always-dark navigation bar background |

---

## 5. Performance & UX Expectations
- **Instant Response**: Dropdown load time must feel instant by loading active announcements in the background when the auth session mounts.
- **Compact Pagination**: No paginated querying is required for v1 since active announcements are capped to a small number of active rows.

---

## 6. Workstream D: Full Announcement Reading View

### Component Design & Interaction
- Create a centered overlay modal component: `AnnouncementReadingModal`.
- Interaction pattern matches [StudyGroupInfoModal.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/StudyGroupInfoModal.tsx) or [RoomDetailPanel.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/RoomDetailPanel.tsx).
- When open, disable parent window scrolling by setting `document.body.style.overflow = 'hidden'`.
- Clicking an announcement inside the dropdown triggers opening the modal and simultaneously closes the dropdown.

### Article-Style Typography
- Title: Large headline (`text-2xl md:text-3xl font-bold tracking-tight text-foreground`).
- Byline/Meta Row: Publish date (`createdAt`) and optional `expiredDate` styled in muted color (`text-foreground/50 text-sm`).
- Article Column: Comfortably readable max-width column (`max-w-2xl` or `max-w-3xl mx-auto`).
- Body Content: Styled with `leading-relaxed` line-height (matching [BookDetailTemplate.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/templates/BookDetailTemplate.tsx)) and consistent paragraph spacing.
- Text Formatting: Preserve line breaks and paragraphs using the CSS class `whitespace-pre-line` (or `whitespace-pre-wrap`).

### Controls & Themes
- Backdrop overlay: A dark semi-transparent backdrop (`bg-black/40 backdrop-blur-sm`).
- Dismissal: Support closing via a top-right [X] close button, backdrop click, or pressing the `Escape` key.
- Theme Support: Standard LIMA tokens (`bg-background` and `text-foreground`) matching the dropdown panel to support both light and dark modes.
- Data Flow: Presentation-only component. Reuses the active announcements dataset loaded in [useAnnouncementBell.ts](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/hooks/useAnnouncementBell.ts); no new API queries or refetch-by-ID are executed.

