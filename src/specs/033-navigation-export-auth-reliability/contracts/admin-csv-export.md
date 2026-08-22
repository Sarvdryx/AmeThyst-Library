# Contract: Administrator CSV Export Session

## Request

- **Method**: Existing read-only export request.
- **Filters**: Existing search, role, and status query values are preserved.
- **Authentication**: Browser includes the protected session cookies according to the same credential policy as other authenticated API calls.
- **Authorization**: Existing server authentication runs first, followed by the existing administrator-role requirement.
- **Secrets**: No cookie value, session token, or secret is read by client code or placed in the URL.

## Success

- A successful response remains a CSV blob.
- The client creates one temporary download URL, activates one download, removes its temporary element, and revokes that URL.
- Repeated requests are independent and read-only.

## Failure

- No session or an invalid/expired session remains denied by existing authentication behavior.
- A non-administrator remains forbidden by existing server authorization.
- A non-success response does not create a download and retains explicit export feedback.
- A thrown network/blob failure retains explicit file-compilation feedback.
