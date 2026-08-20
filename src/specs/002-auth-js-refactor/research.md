# Research: Auth JS Refactor

## Decision: Next.js App Router Migration
- **Decision**: Adopt the standard Next.js App Router folder structure (`src/client/app/login/`).
- **Rationale**: Modern Next.js best practice. Allows for clean routing and keeps page-specific components together, improving maintainability.
- **Alternatives considered**: Keeping components in a global `components/` folder. Rejected because these components are currently exclusive to the login flow.

## Decision: Fluid Responsive Layout vs. Absolute Positioning
- **Decision**: Completely replace fixed absolute coordinates with Tailwind CSS Flexbox and Grid.
- **Rationale**: The original code used brittle absolute positioning that failed on different screen sizes. Flexbox/Grid ensures a mobile-first, fluid experience as mandated by the Constitution.
- **Alternatives considered**: media-query based absolute adjustments. Rejected as too complex and less maintainable than standard flex/grid.

## Decision: Interactive State Mocking
- **Decision**: Implement a `StateMockConsole` component to toggle UI states.
- **Rationale**: Enables frontend-only verification of loading spinners, error banners, and validation messages without needing a functional backend or complex test setup.
- **Alternatives considered**: Manual code changes to test states. Rejected as inefficient for visual verification.
