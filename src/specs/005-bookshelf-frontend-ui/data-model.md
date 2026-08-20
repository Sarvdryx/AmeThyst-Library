# Data Model: Bookshelf UI Mock Data

## Entities

### Book (Mock)
Represents the data structure for a book card in the "Popular Publishes" section.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier |
| title | string | Book title |
| author | string | Author name |
| image | string | Path to book cover image |

### StudyGroup (Mock)
Represents the data structure for a study group card.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier |
| name | string | Group name |
| members | string | Formatted member count (e.g., "24 members") |
| theme | 'dark' | 'light' | Visual style variant |

### Category (Mock)
Represents a filterable category for books.

| Field | Type | Description |
|-------|------|-------------|
| id | number | Unique identifier |
| label | string | Display text |

## Mock Data Sets

- `BOOKS`: Array of 4-8 book objects.
- `GROUPS`: Array of 2-4 study group objects.
- `CATEGORIES`: ["All", "Science", "History", "Arts & Humanities"].
