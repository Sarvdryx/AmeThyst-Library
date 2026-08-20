# Quickstart: Validating User Registration

## Prerequisites

- Node.js installed.
- Repository dependencies installed (`npm install` in `client/`).

## Local Development

1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000/register` in your browser.

## Validation Scenarios

### 1. Visual Fidelity Check
- **Expectation**: Background is warm cream (`#FFF8EB`).
- **Expectation**: Card shadow matches design tokens.
- **Expectation**: No absolute positioning is used (verify via DevTools: look for Flex/Grid).

### 2. Role Selection Interaction
- **Action**: Click "Librarian".
- **Expectation**: The "Librarian" tab becomes navy blue; "Student" becomes gray.

### 3. Password Strength Indicator
- **Action**: Type "password" (8 chars).
- **Expectation**: 1 or 2 bars light up.
- **Action**: Type "Password123!".
- **Expectation**: All 4 bars light up.

### 4. Form Submission Mock
- **Action**: Fill all fields and click "Create Account".
- **Expectation**: Button shows a loading spinner.
- **Expectation**: After a mock delay, a success message or transition occurs.

### 5. Navigation Linkage
- **Action**: Click "Already have an account? Sign In".
- **Expectation**: Navigates to `/login`.
- **Action**: Go to `/login` and click "Create Account".
- **Expectation**: Navigates to `/register`.
