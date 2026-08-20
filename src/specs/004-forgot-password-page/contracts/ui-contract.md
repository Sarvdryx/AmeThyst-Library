# UI Interface Contract: Forgot Password

## Overview
This contract defines the interface for the Forgot Password feature UI components.

## ForgotPasswordCard Component

### Props
- `onBackToSignIn`: Function. Called when the "Back to Sign In" button is clicked.
- `onSubmit`: Function(email: string). Called with the email address when the form is submitted.

### CSS Classes/Styles
- Must use the specific constraints defined in `design/fw_specify.md` (padding, border radius, colors).
- Uses `flex` and `gap` for vertical layout.

## Events
- `submit`: Triggered when form is submitted.
- `click`: Triggered on button/link interactions.
