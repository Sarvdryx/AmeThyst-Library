# Data Model: Librarian Announcements Dashboard

## Entities

### Announcement
Represents a library announcement displayed on the homepage or user dashboard.

**Fields:**
- `id`: `string` (Unique identifier, UUID or sequential)
- `title`: `string` (The title of the announcement, max 100 characters)
- `status`: `enum` (`ACTIVE`, `DRAFT`, `EXPIRED`)
- `date`: `string` (ISO date string, representing creation or publish date)
- `expiryDate`: `string` (ISO date string, representing when the announcement should automatically expire)
- `content`: `string` (The detailed text body of the announcement)
- `isPinned`: `boolean` (If true, pin the announcement to the homepage)

## Validation Rules
- **Title**: Must be non-empty and reasonably short.
- **Content**: Must be non-empty.
- **Expiry Date**: Should ideally be a future date when saving as ACTIVE. (For mock data, we just assume validity).

## State Transitions
- **Draft -> Active**: Occurs when a librarian clicks "Publish Now".
- **Active -> Expired**: Occurs automatically when `expiryDate` passes, or manually if supported later.
- **Active -> Draft**: Occurs if a librarian unpublishes an active announcement to edit it (if supported).
