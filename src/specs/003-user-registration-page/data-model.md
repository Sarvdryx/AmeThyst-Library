# Data Model: User Registration

## Component State

The `RegisterPage` will maintain a central state object representing the registration form data.

### RegistrationData Entity

| Field | Type | Validation Rules |
|-------|------|------------------|
| `fullName` | `string` | Required, min 2 characters |
| `email` | `string` | Required, valid email format |
| `role` | `enum` | Must be `user` or `librarian` |
| `password` | `string` | Min 8 characters |

### UI State Entity

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | Toggles spinner and disables button during submission |
| `error` | `string \| null` | Stores global error messages (e.g., "Email already exists") |
| `success` | `boolean` | Indicates successful registration |
| `securityLevel` | `number (0-4)` | Calculated based on password complexity |

## Relationships

- `RegistrationData` is populated via `InputField` and `RoleSelector` components.
- `UI State` controls the rendering of `SecurityIndicator` and the submission button's interactive state.
