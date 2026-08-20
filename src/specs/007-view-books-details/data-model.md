# Data Model: View Book Details

## Entities

### Book
Represents the core bibliographic information for a library resource.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique UUID |
| title | string | Full title of the book |
| author | string | Full name of the author |
| description | string | Multiline synopsis/overview |
| category | string | Primary genre/subject |
| isbn | string | International Standard Book Number |
| language | string | Primary language of the text |
| publisher | string | Name of the publisher |
| publicationYear | number | Year the book was published |
| numPages | number | Total number of pages |
| rating | string | Book rating out of 5 |
| coverImage | string | Path to the cover image asset |

### Inventory
Tracks the physical presence and location of a book within the library.

| Field | Type | Description |
|-------|------|-------------|
| bookId | string | Reference to Book.id |
| location | string | Name of the library branch/location |
| address | string | Physical address of the location |
| shelf | string | Alphanumeric shelf identifier (e.g., "AR-204") |
| availableCopies | number | Current count of physical copies on shelf |

### Reservation
Represents a user's request to hold a book for pickup.

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique UUID |
| userId | string | Reference to User.id |
| bookId | string | Reference to Book.id |
| status | string | "pending", "confirmed", "expired" |
| createdAt | datetime | Timestamp of reservation |

## Relationships
- **Book (1) -> (1) Inventory**: Every book in the catalog has an associated inventory record tracking its location.
- **User (1) -> (N) Reservation**: A user can have multiple active or past reservations.
- **Book (1) -> (N) Reservation**: A book can be reserved by multiple users over time.
