# Quickstart: Forgot Password Page

## Overview
This document outlines how to validate the Forgot Password page functionality once implemented.

## Prerequisites
- Application running in development mode.
- Access to the browser.

## Validation Scenarios

### 1. Page Accessibility
- Navigate to `http://localhost:3000/forgot-password`.
- Verify the page loads with the `ForgotPasswordCard` component.
- Verify that no navigation bar is visible on the page.

### 2. Form Validation
- Leave email empty and click "Send Reset Link". Verify validation error.
- Enter invalid email format and click "Send Reset Link". Verify validation error.
- Enter valid email and click "Send Reset Link". Verify expected outcome (e.g., success message).

### 3. Navigation
- Click "Back to Sign In". Verify redirection to `/login`.

### 4. Global Navigation Removal
- Visit `/`, `/library`, `/login`, `/register`.
- Verify that the `NavBar` component is not rendered on any of these pages.
