# Data Model: Announcement Notification Bell & is_pinned Removal

## 1. Database Schema Changes

The `is_pinned` column is removed from the `public.announcements` table.

### Migration SQL
```sql
ALTER TABLE public.announcements DROP COLUMN IF EXISTS is_pinned;
```

### Updated Schema in `05_init_rest.sql`
```sql
CREATE TABLE public.announcements (
    announce_id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expired_date date,
    title text,
    content text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    CONSTRAINT chk_status CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'expired'::character varying])::text[])))
);
```

---

## 2. Frontend Interface Definition

The `Announcement` model type is declared in [AnnouncementListItem.tsx](file:///D:/HK3/Library/AmeThyst-Library/src/client/app/components/molecules/AnnouncementListItem.tsx) and shared across client panels.

### Updated TypeScript Interface
```typescript
export type AnnouncementStatus = 'ACTIVE' | 'DRAFT' | 'EXPIRED';

export interface Announcement {
  id: string;
  title: string;
  status: AnnouncementStatus;
  date: string;
  expiryDate: string;
  content: string;
}
```

---

## 3. API Response Changes

### Endpoint: `GET /api/announcements`

#### Before is_pinned Removal
```json
{
  "success": true,
  "data": [
    {
      "announceId": "d16c56fb-73df-4034-8b63-d34a5dcd921f",
      "createdAt": "2026-07-10T12:00:00.000Z",
      "expiredDate": "2026-08-10T00:00:00.000Z",
      "title": "Welcome to AmeThyst!",
      "content": "Explore our digital books and study spaces.",
      "status": "active",
      "isPinned": true
    }
  ],
  "message": "Active announcements fetched successfully."
}
```

#### After is_pinned Removal
```json
{
  "success": true,
  "data": [
    {
      "announceId": "d16c56fb-73df-4034-8b63-d34a5dcd921f",
      "createdAt": "2026-07-10T12:00:00.000Z",
      "expiredDate": "2026-08-10T00:00:00.000Z",
      "title": "Welcome to AmeThyst!",
      "content": "Explore our digital books and study spaces.",
      "status": "active"
    }
  ],
  "message": "Active announcements fetched successfully."
}
```

---

## 4. Frontend UI State Definitions

### Reading View Modal Interface

```typescript
export interface AnnouncementReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: {
    announceId: string;
    createdAt: string;
    expiredDate?: string | null;
    title: string;
    content: string;
  } | null;
}
```
