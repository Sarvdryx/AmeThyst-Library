# Research: login-form Implementation

## Decision: Component Architecture & Styling

**Decision**: Implement `LoginForm.tsx` as a Next.js Client Component (`"use client"`) using a responsive Flexbox/Grid layout with Tailwind CSS.

**Rationale**: 
- **Tailwind CSS**: Directly requested by the user to eliminate absolute positioning and ensure responsiveness.
- **Client Component**: Necessary for managing local state (`useState`) for mock interactions (loading, error, etc.).
- **Atomic Design**: Aligns with the project constitution's principle of self-contained, reusable components.

**Alternatives Considered**:
- **Absolute Positioning (from raw code)**: Rejected because it fails to meet the mobile-first responsive requirement.
- **Server Component**: Rejected because the component requires interactive states and `useState`.

## Decision: Visual Assets & Typography

**Decision**: Extract and inline the SVG icons provided in the raw layout code. Use the fonts (Inter, Inder) already configured in the project's `RootLayout`.

**Rationale**:
- **SVGs**: Inlining allows for easy styling with Tailwind (e.g., `text-teal-600`) and avoids extra network requests.
- **Fonts**: The `RootLayout` code in `auth_design.txt` shows `Inter` and `Inder` are set up as CSS variables (`--font-inter`, `--font-inder`).

**Alternatives Considered**:
- **Icon Library (e.g., Lucide)**: Rejected to maintain 100% fidelity to the provided raw layout design.

## Decision: Mock Interaction Strategy

**Decision**: Use a centralized `useReducer` or multiple `useState` hooks to manage complex UI states (idle, loading, error, success). A fixed floating panel on the right will trigger these states.

**Rationale**:
- **User Request**: Specifically asked for buttons to toggle states like 'Wrong password' or 'isLoading'.
- **Flexibility**: Separating the controls from the form ensures the form's layout remains pristine while allowing for exhaustive testing.

**Alternatives Considered**:
- **URL Parameters**: Rejected as too cumbersome for quick visual inspection compared to on-page buttons.
