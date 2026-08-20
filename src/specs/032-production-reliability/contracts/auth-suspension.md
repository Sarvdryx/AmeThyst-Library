# Interface Contract: Auth Suspension

## 1. Structured Error Response
All endpoints that require authentication (including `/auth/me`, `/auth/refresh`, and API endpoints) must return the following standardized error when the user is suspended:

**HTTP Status**: `403 Forbidden` (or `401 Unauthorized`, depending on endpoint semantics, but the JSON shape must be consistent).

```json
{
  "success": false,
  "error": {
    "code": "USER_SUSPENDED",
    "message": "Your account has been suspended by an administrator. Please contact support.",
    "details": null
  }
}
```
*Note: Do not expose `suspended_reason` in the `message` or `details` unless an explicit approved mapping exists. The default message is generic.*

## 2. Realtime Socket Event
When an administrator suspends a user, the backend emits the following targeted event to all active socket connections belonging to that `user_id`:

**Event Name**: `account:suspended`

**Payload**:
```json
{
  "code": "USER_SUSPENDED",
  "message": "Your account has been suspended. You will be disconnected."
}
```

**Disconnection Logic**: 
The server will emit the event, wait 500ms for bounded acknowledgment (or just a fire-and-forget delay), and then forcefully disconnect the socket and invalidate the session token versions in the database.

## 3. Client Handling
The frontend `AuthProvider` interceptors and fetch wrappers must catch `USER_SUSPENDED` from both HTTP responses and socket events.
- They must not loop redirects.
- They must cleanly clear local session state.
- They must dispatch a `window` event (`account-suspended`) to trigger the `AccountSuspendedModal` at the root layout without crashing or entering infinite refresh cycles.
