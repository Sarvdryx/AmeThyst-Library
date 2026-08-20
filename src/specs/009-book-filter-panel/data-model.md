# Data Model & State Schema: Book Filter Panel

**Feature**: Book Filter Panel | **Date**: 2026-06-22

## Entities & Properties

### 1. Book (Catalog Entity)
Mapped from the `public.books` table in PostgreSQL.

| Property | Type | DB Column | Description / Validation Rules |
|---|---|---|---|
| `id` | String | `book_id` | Unique identifier (e.g. `27161156`). Required. |
| `title` | String | `title` | Title of the publication. |
| `author` | Array[String] | `author` | Array of clean author names. |
| `genres` | Array[String] | `genres` | Subject categories for classification. |
| `publicationYear` | Integer | `EXTRACT(YEAR FROM publication_date)` | Mapped from date to integer for easier filtering. |

### 2. Inventory (Join Entity)
Mapped from the `public.library` table.

| Property | Type | DB Column | Description / Validation Rules |
|---|---|---|---|
| `branchId` | Integer | `branch_id` | Foreign key referencing `public.branches`. |
| `availableQuantity` | Integer | `available_quantity` | Amount of copies currently checkable/available (MUST be `>= 0`). |

### 3. Branch (Location Entity)
Mapped from the `public.branches` table.

| Property | Type | DB Column | Description / Validation Rules |
|---|---|---|---|
| `branchId` | Integer | `branch_id` | Unique ID. Primary key. |
| `name` | String | `name` | Full name of the branch campus. |
| `nameShort` | String | `name_short` | Code abbreviation (e.g., `NVC`, `LT`). |

---

## Filter Criteria State Schema
The active filter configuration parsed from the URL search query parameters and validated before calling the database.

| Parameter | Type | Default | Validation & Logic Rules |
|---|---|---|---|
| `genres` | Array[String] | `[]` | Must contain elements from predefined list: `['Mathematics', 'Physics', 'Biology', 'Computer Science', 'Fiction', 'Nonfiction', 'Philosophy', 'Psychology', 'Literature', 'Others']`. Case-insensitive match on database. |
| `branches` | Array[Integer] | `[]` | Integer IDs. Must match existing `branch_id` values (e.g. `[1, 2]`). |
| `availableOnly` | Boolean | `false` | True when the user toggles "Show Available Only". |
| `startYear` | Integer | `null` | Must be a 4-digit integer. Default is null (no start date limit). |
| `endYear` | Integer | `null` | Must be a 4-digit integer. Default is null (no end date limit). |

### Validation Constraints
1. **Date range logical check**: If both `startYear` and `endYear` are defined, `startYear` MUST be less than or equal to `endYear`. If logical check fails, the API returns a `400 Bad Request` or the client displays an validation alert without sending the request.
2. **Invalid inputs**: Query parameters that cannot be parsed (e.g. `startYear=abc` or `branches=xyz`) are ignored, falling back to default values.
