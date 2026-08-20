# Research: User Registration Page Implementation

## Decision: Testing Framework

**Decision**: Use manual UI verification via the `quickstart.md` guide and visual inspection.

**Rationale**: No automated testing frameworks (Jest, Playwright, etc.) were found in the project's `package.json` files. Introducing a new framework is outside the current scope of generating a UI component.

**Alternatives Considered**:
- **Introducing Playwright**: Rejected to minimize project configuration changes and stick to existing conventions.

## Decision: Password Security Indicator Logic

**Decision**: Implement a 4-level strength logic based on length and character variety:
1. **Level 1**: Minimum 8 characters.
2. **Level 2**: Includes numbers.
3. **Level 3**: Includes mixed case (upper/lower).
4. **Level 4**: Includes special characters.

**Rationale**: Standard security practice that maps cleanly to the 4-bar visual requirement in the design.

**Alternatives Considered**:
- **zxcvbn library**: Rejected to avoid adding new dependencies for a mock-friendly component.

## Decision: Role Selector Accessibility

**Decision**: Use an `aria-role="tablist"` structure for the role switcher to ensure screen reader accessibility, even though it's a simple toggle.

**Rationale**: Aligns with the project constitution's principle of "Error Handling & Accessibility".

**Alternatives Considered**:
- **Radio Buttons**: Rejected as the design specifically calls for a "tab selector" visual style.
