# Research: Forgot Password Page & Global Navigation Update

**Decision**: Implement "Forgot Password" page and remove navigation bars globally.

## Research Findings

- **Forgot Password Workflow**: Standard industry practice is to accept an email, validate its format, and show a generic "if registered, you will receive a link" message to prevent account enumeration attacks.
- **Navigation Bar Removal**: The navigation bar is likely a shared component used in the root layout or individual page wrappers. To remove it, I need to check `client/app/layout.js` and individual page files (`login/page.js`, `register/page.js`, `library/page.js`, `app/page.js`).
- **Styling**: `design/fw_specify.md` provides strict requirements for the `ForgotPasswordCard`. I must ensure these are followed.
- **Dependencies**: No new libraries required. Standard React/Next.js will suffice.

## Decisions

- **Decision 1**: Build `ForgotPasswordCard` as a reusable Client Component in `client/app/library/components/` (as per existing structure for library components).
- **Decision 2**: Remove `NavBar` component from all pages. I will verify if `NavBar` is in `client/app/layout.js`.
- **Decision 3**: The Forgot Password page will be at `/forgot-password`.

## Alternatives Considered

- **Alternative 1**: Conditional rendering of `NavBar`. Rejected as it is simpler to just remove it if it is not required on these pages.
