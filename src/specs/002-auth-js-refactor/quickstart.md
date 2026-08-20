# Quickstart: Auth JS Refactor Validation

## Overview

This guide describes how to validate the refactored login page using the interactive mock console.

## Prerequisites

- Node.js installed.
- Next.js development server running.

## Validation Steps

1. **Access the Page**:
   - Open your browser and navigate to `http://localhost:3000/login`.
   - Verify that the layout matches the desktop design (Split screen: LIMA on left, Form on right).

2. **Test Responsiveness**:
   - Open Browser DevTools and toggle Device Toolbar.
   - Resize to Mobile (e.g., iPhone 12 Pro).
   - Verify the LIMA Brand Panel disappears and the login form expands to fill the screen.

3. **Verify Interactive Mocks**:
   - Locate the **Mock Controls** panel on the right.
   - **Toggle Loading**: Click to see the "Sign In" button switch to a spinner state.
   - **Simulate Error**: Click to see the red top-level error banner appear.
   - **Show Validation**: Click to see inline "is required" messages appear below input fields.

4. **Verify Input**:
   - Type in the Email and Password fields.
   - Ensure the state updates correctly (no console errors).

## Success Criteria

- Layout is fluid (no absolute positioning artifacts).
- All 6 components are correctly decomposed and linked.
- Mock states trigger immediate UI feedback.
