# Interface Contract: Email Delivery

## 1. Provider
All runtime email delivery uses the Brevo transactional-email HTTPS API.

## 2. Environment Variables
- `BREVO_API_KEY`: Required Brevo API key.
- `EMAIL_FROM`: Required verified Brevo sender.
- Startup validation fails fast when either variable is missing.

## 3. Registration with Recoverable Failure
- Registration endpoints (`POST /auth/register`) will insert the user record into the `pending_users` table.
- It will then attempt the email delivery.
- If email delivery fails:
  - The transaction is **not** rolled back (the user remains in `pending_users`).
  - The API returns `502 Bad Gateway` so the client knows delivery did not complete.
  - The user can call `/auth/resend-verification` using the retained pending registration.
- If resend delivery fails, the previous pending token and expiry are restored unchanged.
- When logging in, a pending user receives a specific response prompting them to "Check your inbox" or "Resend Verification Email".

## 4. Anti-Enumeration
All password recovery endpoints (`POST /auth/forgot-password`) will return `200 OK` generic messages ("If that account exists, an email has been sent") regardless of whether the email actually failed to deliver, preventing enumeration probing. The error is only logged securely to operational logs.

## 5. Safe Logging
Operational logs must redact user passwords, OTPs, verification tokens, and session secrets when an email delivery fails. Only the target email address and template name are logged to diagnose routing issues.
