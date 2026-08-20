# Data Model: login-form

## UI State: `LoginFormState`

Represents the visual and interactive state of the login form.

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | When true, shows a spinner on the primary button and disables inputs. |
| `error` | `string \| null` | Stores a top-level error message (e.g., "Wrong password"). |
| `validationErrors` | `Record<string, string>` | Stores field-specific error messages (e.g., "Email is required"). |
| `isSuccess` | `boolean` | When true, shows a success state (optional, but good for completeness). |

## User Input: `Credentials`

Represents the data entered by the user.

| Field | Type | Validation Rules |
|-------|------|------------------|
| `email` | `string` | Must be a valid email format; cannot be empty. |
| `password` | `string` | Minimum length 8 characters; cannot be empty. |

## Mock Transitions

| Trigger | Action | Resulting State |
|---------|--------|-----------------|
| "Toggle Loading" | `setIsLoading(!isLoading)` | Primary button spinner toggles. |
| "Simulate Error" | `setError("Wrong password")` | Top banner displays "Wrong password". |
| "Clear Errors" | `setError(null); setValidationErrors({})` | All error messages are removed. |
| "Field Empty" | `setValidationErrors({ email: "Required" })` | Inline message appears below email. |
