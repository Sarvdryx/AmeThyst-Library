# Quickstart: login-form Validation Guide

## Prerequisites

- Node.js installed.
- Tailwind CSS configured in the project.
- `/Image1.png` present in the `public/` directory.

## Setup & Run

1. **Navigate to client directory**:
   ```bash
   cd client
   ```
2. **Install dependencies** (if not done):
   ```bash
   npm install
   ```
3. **Start development server**:
   ```bash
   npm run dev
   ```
4. **Access the login page**:
   Open `http://localhost:3000/library/login` in your browser.

## Validation Scenarios

### 1. Responsive Layout
- **Action**: Resize the browser window.
- **Expectation**: 
  - At widths > 1024px, the "LIMA" branding panel is visible on the left.
  - At widths < 1024px, the branding panel disappears and the login card occupies the center.

### 2. Loading State
- **Action**: Click the "Mock Loading" button in the floating panel.
- **Expectation**: The "Sign In" button should transform into a loading spinner and become unclickable.

### 3. Error Feedback
- **Action**: Click "Simulate 'Wrong Password'".
- **Expectation**: A teal or navy error notification should appear above the form stating "Wrong password".

### 4. Inline Validation
- **Action**: Clear the email field and click "Sign In" (while loading is off).
- **Expectation**: A red message "Email is required" should appear directly below the email input.
