# Research: Announcement Notification Bell & is_pinned Removal

## 1. Implementation Baseline
This feature modifies existing code bases from:
- [specs/021-announcement-backend](file:///D:/HK3/Library/AmeThyst-Library/src/specs/021-announcement-backend)
- [specs/023-libarian-announcements](file:///D:/HK3/Library/AmeThyst-Library/src/specs/023-libarian-announcements)

## 2. File Baseline & Affected Code Paths
The following files represent the baseline implementation structure targeted for modifications:

### A. Database
- [src/database/init_db/postgres/05_init_rest.sql](file:///D:/HK3/Library/AmeThyst-Library/src/database/init_db/postgres/05_init_rest.sql): Defines the `announcements` table schema.

### B. Backend (Node.js/Express)
- [src/server/src/models/announcement.models.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/models/announcement.models.mjs): Contains database query logic for insert, update, retrieval, pagination, status transition, and active listing of announcements.
- [src/server/src/services/announcement.services.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/services/announcement.services.mjs): Coordinates validation, date formatting, and maps data models to application business logic.
- [src/server/src/controllers/announcement.controllers.mjs](file:///D:/HK3/Library/AmeThyst-Library/src/server/src/controllers/announcement.controllers.mjs): Extracts client payloads, invokes service layers, and constructs HTTP JSON responses.

### C. Frontend (React/Next.js)
- [src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/LibrarianAnnouncementsPanel.tsx): The librarian dashboard CRUD interface, containing fields for editing, creating, and toggling pinning status.
- [src/client/app/components/molecules/AnnouncementListItem.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AnnouncementListItem.tsx): Renders announcement list cards and declares the shared `Announcement` model type.
- [src/client/app/components/molecules/AuthActions.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AuthActions.tsx): Renders header action items, including the notification bell.
- [src/client/app/locales/en.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/en.json) & [src/client/app/locales/vi.json](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/locales/vi.json): i18n locales mapping strings for the announcement module and navigation bar.

## 3. Reference Patterns

### Click-Outside Dropdown Pattern
Following [CustomSelect.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/atoms/CustomSelect.tsx), the click-outside dropdown panel uses `useRef` + `mousedown` events:
```typescript
const containerRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

### API Fetch Pattern
Using [apiClient.ts](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/utils/apiClient.ts), the dropdown fetches announcements from the public `/api/announcements` endpoint:
```typescript
import { apiFetch } from '../../utils/apiClient';

const res = await apiFetch<any[]>('/api/announcements');
```
The GET request has no authorization middleware requirements and filters results to active, non-expired status items.

---

## 4. Overlay & Typography Design Patterns

### Centered Backdrop Overlay (Modal) Pattern
Following [StudyGroupInfoModal.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/organisms/StudyGroupInfoModal.tsx) or `RoomDetailPanel.tsx`, the overlay uses a fixed container with backdrop blur, scroll locking on mount/unmount, and propagation stopping to handle click-outside dismissals:
```typescript
// Scroll locking on mount / restore on unmount
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = '';
  };
}, [isOpen]);
```

### Article Typography Pattern
Following the typography standard in [BookDetailTemplate.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/templates/BookDetailTemplate.tsx), body copy should utilize `leading-relaxed` for readable line heights, set inside a centered and restricted-width text block to optimize line length for readability, and format line breaks using `whitespace-pre-line`:
```html
<div className="text-foreground/70 text-base leading-relaxed max-w-3xl whitespace-pre-line">
  {announcement.content}
</div>
```

