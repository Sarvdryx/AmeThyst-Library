# Quickstart: Admin System Configuration

## Prerequisites

- Run commands from repository root `D:\Projects\AmeThyst-Library\src`.
- Use a Node.js version compatible with the checked-in dependencies; the planning environment uses Node.js `v25.9.0`.
- Provide the existing backend and frontend environment variables, including `JWT_SECRET`, database connection settings used by authentication, and `NEXT_PUBLIC_API_URL=http://localhost:5000`.
- Ensure `server/src/config/` is durable and writable by the backend process.
- Run exactly one Node.js backend process against `system-configuration.json`; do not use cluster mode, multiple PM2 workers, or multiple application instances sharing this file.

## Expected configuration file

`server/src/config/system-configuration.json` must contain the complete shape documented in [data-model.md](data-model.md). The backend must validate it before listening for requests. A missing or malformed file is a startup error, not a reason to synthesize silent defaults.

## Start locally

Backend:

```powershell
Set-Location server
npm install
npm run dev
```

Frontend in a second terminal:

```powershell
Set-Location client
npm install
npm run dev
```

Sign in with an administrator account and open:

```text
http://localhost:3000/dashboard/admin/system
```

## Automated verification

Backend tests:

```powershell
Set-Location server
npm test
```

Frontend static checks:

```powershell
Set-Location client
npm run lint
npm run build
```

## Required integration and manual coverage

- API integration coverage includes successful GET/PUT, exact key-set and numeric validation, stale-version `409`, authentication, admin authorization, the 2-second response objective, ordinary write failures, and an injected Model failure after temporary-file flush but before replacement.
- Manual acceptance covers startup/restart persistence, atomic failure recovery, concurrent admin behavior, dynamic borrowing limits, configured return penalties, and unchanged overdue/historical behavior.
- No feature-specific unit tests are required for the configuration adapter, services, or penalty utilities.

Integration tests that mutate configuration must use a temporary directory and injected configuration path; they must never overwrite `server/src/config/system-configuration.json`.

## Verified live consumers

- `server/src/services/library.services.mjs` captures the active `MAX_BORROW_LIMIT` at the start of each reservation operation.
- `server/src/controllers/user.controllers.mjs` exposes the current borrowing policy in profile responses.
- `server/src/services/dashboard.librarian.services.mjs` captures one policy snapshot for each return transaction and delegates penalty calculation to `server/src/utils/penalty.utils.mjs`.
- The librarian return-inspection preview is calculated server-side from the same active policy through a librarian-authorized preview route; the client no longer retains a second hard-coded fee/coefficient table.
- Return PIN verification records the active configuration version. A later preview or confirmation using a stale version invalidates that pending Return PIN, returns `CONFIGURATION_CHANGED`, notifies the librarian, and returns the UI to Enter Return PIN.
- Damage cost is not implicitly capped by the configured lost coefficient. It is capped only when an explicit item-specific cap is supplied, matching the pre-feature calculation semantics.
- Damage conditions are cumulative: every condition contributes its complete standalone charge, `book price × that condition's coefficient + FEE_ADMIN`; a condition beyond the first also adds `FEE_ADDON`. An added condition therefore never costs less than it would cost on its own.
- `server/src/utils/penalty.utils.mjs` contains no mutable configuration constants; overdue percentages remain intentionally static and outside this feature.

## Manual acceptance flow

1. From the admin dashboard, open System Configuration and verify the destination is reached in no more than two navigation actions and all 14 values load in three groups; start the SC-003 timer when loading completes.
2. Change `MAX_BORROW_LIMIT`, one fee, and one damage coefficient; verify the page becomes dirty and save is enabled.
3. Clear each editable field in turn and also enter whitespace only; verify Save remains unavailable, the field is marked required, and no save request is sent.
4. Enter an invalid negative coefficient and a fractional borrowing limit; verify field-specific errors block saving.
5. Correct the values and save; stop the SC-003 timer when success confirmation appears, verify elapsed time is under three minutes, reload the page, and confirm persistence.
6. Perform a new borrowing eligibility check and a new librarian return calculation; verify each uses the new values.
7. Confirm existing loans and recorded penalties remain unchanged.
8. Open the same page in two admin sessions, save in the first, then save the stale second session; verify the second receives a conflict and does not overwrite the first.
9. Attempt GET and PUT as a normal user and as an unauthenticated client; verify no configuration values are exposed.
10. Test English/Vietnamese, light/dark themes, keyboard-only operation, and representative mobile/tablet/desktop widths.
11. Using the API integration test's local server and temporary configuration directory, verify authenticated GET and valid PUT each complete within 2 seconds under normal local load.

## Usability acceptance protocol

- The feature stakeholder recruits 10 representative administrator participants who have not previously completed this walkthrough and confirms the anonymous acceptance evidence; the implementation team prepares the protocol and evidence template.
- Give each participant only the goal of updating one borrowing setting and one penalty setting; do not provide step-by-step assistance during the first attempt.
- Count a participant as successful only if both values are saved correctly on the first attempt.
- Record anonymous pass/fail and elapsed-time results in the acceptance evidence section of this document; SC-002 passes with at least 9 successful participants, and SC-003 passes when each measured complete 14-value walkthrough finishes in under three minutes.

### Acceptance evidence template

| Participant | First-attempt update passed | Complete walkthrough under 3 minutes | Notes |
|---|---:|---:|---|
| A01–A10 | Pending | Pending | Do not record personal information |

## Recovery checks

- Make the target directory non-writable in a disposable test environment and attempt a save; verify the UI reports failure and the last valid values remain active.
- In the API integration harness, inject a Model file-operation failure immediately after the temporary file has been flushed and before the target replacement; verify PUT reports `CONFIG_WRITE_FAILED`, the prior canonical JSON is byte-for-byte unchanged, and a subsequent GET returns the prior version and values. This is integration coverage, not a feature-specific unit test.
- Restart the backend after a successful save; verify the saved values are loaded before the server accepts requests.
- Restore the canonical valid JSON before ending any manual failure test.

## Deployment and safety notes

- Give the single Node.js backend process read/write permission only to the canonical configuration file and its containing directory; do not expose that directory through static-file middleware.
- Run one backend process only. Cluster mode, multiple PM2 workers, and shared-file multi-instance deployments are unsupported.
- Startup aborts before the HTTP listener accepts requests if the canonical file is missing, malformed, or invalid.
- Save failures return stable public error codes without returning filesystem paths or underlying exception details. Detailed causes remain server-side only.
- Temporary files use unique sibling names and are removed on a best-effort basis after write, flush, hook, or replacement failure.
- Integration tests always inject a temporary path and must never target the repository's canonical JSON.

## Implementation verification record

- Backend: `npm.cmd test` — 18 files and 148 tests passed on 2026-08-01.
- System Configuration API: 15 integration tests passed, including authorization, validation, stale version, write failure, interrupted replacement, persistence, and the two-second objective.
- Frontend: targeted ESLint passed for all changed System Configuration/admin-shell files.
- Frontend: `npm.cmd run build` completed successfully and generated `/dashboard/admin/system`.
- Repository-wide frontend ESLint still reports 29 errors and 22 warnings in pre-existing unrelated files; none are in the System Configuration or modified admin-shell files. Breakdown: 21 `react-hooks/set-state-in-effect` errors, 6 `react-hooks/purity` errors, 1 `react-hooks/refs` error, 1 `react-hooks/immutability` error, 14 `@next/next/no-img-element` warnings, and 8 `react-hooks/exhaustive-deps` warnings. Resolve these as a separate cleanup change because they span authentication, profile/avatar upload, announcements, circulation, reservations, study groups, and shared providers rather than this feature.
- Stakeholder acceptance evidence for SC-002/SC-003 remains pending until the stakeholder provides the 10 representative administrators.
