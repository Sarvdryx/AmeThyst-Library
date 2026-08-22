# Quickstart: Spec 33 Validation

## Prerequisites

1. Install the checked-in dependencies in both package directories with `npm ci` if `node_modules` is absent.
2. Configure the existing client/API environment variables and start the existing PostgreSQL-backed server when performing end-to-end checks.
3. Use test accounts for an administrator, a non-administrator, and a newly registered pending user.

## Automated Validation

From `src/client`:

```powershell
npm test
npm run lint -- app/components/organisms/HeroSection.tsx app/components/templates/HomeLayout.tsx app/dashboard/admin/page.tsx app/providers/AuthProvider.tsx app/utils/apiClient.ts app/utils/authSessionCoordinator.mjs app/utils/user.ts app/verify-email/page.tsx
npm run build
```

From `src/server`:

```powershell
npm run test -- tests/integration/verifyEmail.api.spec.mjs tests/controllers/verifyEmail.controller.spec.mjs
npm run test
node --check src/routes/admin.routes.mjs
```

Record every command as `PASS`, `FAIL`, `NOT RUN`, or `BLOCKED`.

## Manual Acceptance — US1

1. Open `/library` on desktop and mobile widths in English and Vietnamese.
2. Activate “Explore Library” with a pointer, Enter, and Space. Confirm focus/viewport reaches the existing catalog/search region.
3. Activate “How It Works” with each input method. Confirm `/help` opens and browser Back returns correctly.
4. Rapidly activate each control three times. Confirm a valid final destination and no duplicated route transition.
5. Repeat in light and dark themes and confirm visual styling is unchanged.

## Manual Acceptance — US2

1. Sign in as an administrator, apply filters, export three times, and confirm each readable CSV reflects the existing filters.
2. Repeat with no session and an expired/invalid session; confirm denial and no file.
3. Repeat as a non-administrator; confirm server rejection and no file.
4. Force the export endpoint to fail and interrupt the network; confirm explicit error feedback and no false successful download.
5. Confirm the operation does not mutate the user directory or weaken the server middleware chain.

## Manual Acceptance — US3

1. In the development build with React Strict Mode active, open a valid email-verification link directly in a fresh tab with delayed authentication bootstrap responses. Confirm effect replay sends one verification request and the live setup still reaches success/error rather than remaining on loading.
2. Confirm success publishes the verified user before redirect and the Library renders authenticated.
3. Reload immediately and confirm the same session is restored.
4. Trigger protected-request refresh activity during verification; confirm the final state matches the verified server session.
5. Start a refresh, then explicitly log out; confirm no older operation restores the user.
6. Test missing, invalid, expired, already-used, repeated, and network-failed verification. Confirm no false authenticated state and the existing recovery UI.
7. Navigate away while verification is pending. Confirm the abandoned page performs no late status update or redirect; then repeat with a different token and confirm it starts an independent attempt.

## Scope and Security Audit

- Confirm no CSV fields/schema, backend authorization, verification-token behavior, database schema, email template, roles, or unrelated UI were changed.
- Search changed files and logs for access tokens, refresh tokens, verification tokens, session secrets, or client token storage; none may be present.
- Trace every FR and SC through `tasks.md` and the recorded validation evidence before declaring completion.
