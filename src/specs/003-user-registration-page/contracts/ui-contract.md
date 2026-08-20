# UI Contract: Registration Module

## Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/register` | `RegisterPage` | Public |

## Component Interfaces

### `RoleSelector`

**Props**:
- `selectedRole`: `'user' | 'librarian'`
- `onChange`: `(role: string) => void`

**Behavior**:
- Clicking a tab updates the state.
- Active tab must have `bg-[#091426]` and `text-white`.

### `SecurityIndicator`

**Props**:
- `level`: `number (0 to 4)`

**Behavior**:
- Renders 4 bars.
- Bars from `1` to `level` are colored (e.g., `#091426` or based on strength).
- Remaining bars stay `bg-[#D3E4FE]`.

### `InputField` (Reused from Login)

**Props**:
- `label`: `string`
- `placeholder`: `string`
- `type`: `string`
- `error`: `string | null`
- `onChange`: `(e: Event) => void`

## Inter-Page Navigation

- **Login -> Register**: The "Create Account" button on `/login` links to `/register`.
- **Register -> Login**: The "Already have an account? Sign In" footer on `/register` links to `/login`.
