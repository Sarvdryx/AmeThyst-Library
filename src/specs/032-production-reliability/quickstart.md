# Quickstart: Production Reliability Development

## Getting Started

1. **Database Update:**
   You must apply the new schema modifications. Until an automated migration script is added to `package.json`, manually apply `08_notifications.sql` against your local PostgreSQL database:
   ```bash
   psql -U lib_admin -d amethyst -f src/database/init_db/postgres/08_notifications.sql
   ```

2. **Environment Variables:**
   Update your local `src/server/.env`:
   ```env
   # Email configuration
   BREVO_API_KEY=xkeysib-your-api-key
   EMAIL_FROM=verified-sender@example.com
   ```

3. **Running the Applications:**
   * **Server:** `cd src/server && npm run dev`
   * **Client:** `cd src/client && npm run dev`

4. **Testing Realtime Suspensions:**
   * Log into a standard user account on two different browsers.
   * Log into an admin account.
   * Suspend the standard user from the admin panel. Both standard user browser windows should instantly show the "Account Suspended" modal and force a logout.

5. **Testing Email Failures & Verification:**
   * To test delivery failure without triggering startup validation, use a verified `EMAIL_FROM` and provide an invalid or revoked `BREVO_API_KEY`.
   * Start the server and register a new user. Confirm the API returns `502`, logs the delivery failure without exposing the API key, and retains the row and token in `pending_users`.
   * Restore a valid key and call `/auth/resend-verification`; confirm successful delivery. If resend fails, confirm the previous token and expiry remain unchanged.
   * Confirm the new account remains in `pending_users`, then attempt to log in with its credentials. Verify the API returns `USER_UNVERIFIED` and the client presents the "Check your inbox" screen.

6. **Testing Persistent Notifications:**
   * Disable your network connection (or close your browser) as the test user.
   * As an admin, publish a new Announcement or send a Study Group Invitation.
   * Re-enable network/open browser as the test user.
   * Verify the notification immediately appears in the bell inbox upon mounting the application.
