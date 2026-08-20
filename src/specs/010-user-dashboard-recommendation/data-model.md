# Data Models

## Entities

### `RecommendedBook`
Represents a book suggestion displayed in the carousel.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier for the book |
| `title` | `string` | The title of the book |
| `author` | `string` | The author(s) of the book |
| `coverImage` | `string` | URL path to the book's cover image |

*Note: This matches the existing interface expected by the `RecommendationCarousel` component.*
