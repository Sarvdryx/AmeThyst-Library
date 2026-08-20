# UI Contract: LoginForm Component

## Component Definition

- **Name**: `LoginForm`
- **Type**: Next.js Client Component (`"use client"`)
- **Path**: `client/app/library/components/LoginForm.tsx` (Proposed)

## Visual Constants (from Design Spec)

- **Background**: `#FFF8EB` (Warm Cream)
- **Primary Text**: `#091426` (Deep Navy)
- **Accent/Link**: `#006A61` (Teal)
- **Font - Header**: `font-inder` (Inder)
- **Font - Body**: `font-inter` (Inter)

## Responsiveness Contract

| Breakpoint | Layout Behavior |
|------------|-----------------|
| `< 1024px` (`lg`) | Single column. Branding panel hidden. Form centered. |
| `>= 1024px` (`lg`) | Two-column split. Left: Branding (`LIMA`). Right: Form. |

## Mock Interaction Contract

The component must expose a hidden or floating UI that allows developers to trigger the following states:

1. **State: Loading**
   - Button: `Disabled` + `Spinner` visible.
   - Inputs: `Read-only`.
2. **State: Error Banner**
   - Container: Fixed-top or above-form alert box.
   - Content: "Wrong password" or "Account not found".
3. **State: Validation Messages**
   - Position: Immediately below the `input` field.
   - Style: Red text, small font size.
