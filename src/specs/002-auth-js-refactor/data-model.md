# Data Model: Auth JS Refactor

## UI State (Local)

Represented by the `state` object in `page.js`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `isLoading` | Boolean | Controls button spinners and disabled states. |
| `error` | String \| null | Content for the top-level error banner. |
| `validationErrors` | Object | Map of field IDs to error messages (e.g., `{ email: "Required" }`). |
| `isSuccess` | Boolean | Placeholder for successful login flow state. |

## Credentials

Represented by the `credentials` object in `page.js`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `email` | String | User's email input. |
| `password` | String | User's password input. |

## Validation Rules

- **Email**: Must not be empty. (Optional: format check for `@`).
- **Password**: Must not be empty. Minimum 8 characters recommended for visual mock.
