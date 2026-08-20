# UI Contract: Login Module

## Component: InputField

**Description**: Reusable input component with icon support and error states.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `label` | String | Floating or top label text. |
| `id` | String | HTML id and label association. |
| `type` | String | `email`, `password`, `text`, etc. |
| `placeholder` | String | Placeholder text for empty state. |
| `value` | String | Controlled input value. |
| `onChange` | Function | Event handler for text changes. |
| `error` | String | Error message to display below input. |
| `icon` | SVG/Node | Optional icon to display on the left. |

---

## Component: FormCard

**Description**: Container and layout for the login form elements.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `credentials` | Object | `{ email, password }` state. |
| `setCredentials` | Function | Setter for the credentials state. |
| `isLoading` | Boolean | Disables button and shows spinner if true. |
| `validationErrors` | Object | Map of field errors to display. |

---

## Component: StateMockConsole

**Description**: Floating control panel for developer testing.

### Props

| Prop | Type | Description |
|------|------|-------------|
| `state` | Object | Current UI state from `page.js`. |
| `setState` | Function | Setter to toggle mock states. |
