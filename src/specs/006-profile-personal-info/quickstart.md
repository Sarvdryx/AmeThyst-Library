# Quickstart: Profile Page Validation

## Prerequisites
- Application running (`npm run dev`).
- User logged in.

## Validation Scenarios
1. **Sidebar Navigation**:
   - Verify sidebar is present and sticky on scroll.
   - Resize window; verify sidebar behavior (collapses on mobile).
2. **Personal Info Display**:
   - Verify all fields displayed correctly.
   - For missing fields, verify "Not provided" placeholder text is shown in `#A1A3A7`.
3. **Inline Editing**:
   - Click an editable field (e.g., Full Name); verify it becomes an input.
   - Hover over editable fields; verify hover visual states are applied.
