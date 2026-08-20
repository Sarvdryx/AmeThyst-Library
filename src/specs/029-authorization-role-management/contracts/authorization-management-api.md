# API Contract: Authorization & Role Management

**Date**: 2026-08-07 | **Feature**: [spec.md](../spec.md) | **Data Model**: [data-model.md](../data-model.md)

Base URL: `http://localhost:5000` (frontend resolves it via `NEXT_PUBLIC_API_URL` — never hardcoded).

Auth: all endpoints require `Authorization: Bearer <JWT>` and the `admin` role. Role enforcement uses the existing `verifyToken` + `authorizeRole('admin')` middlewares. A token whose `token_version` no longer matches the stored value is rejected with `401 INVALID_TOKEN`.

Unified error shape (project convention): `{ success: false, error: { code, message } }`.

---

## List Accounts (Role Management panel)

`GET /api/authorization/users?search=&role=&status=&page=&limit=`

- **Search**: matches `username` or `email` (case-insensitive, partial).
- **role**: `all` (default) | `user` | `librarian` | `admin`.
- **status**: `all` (default) | `active` | `suspended`.
- **page** (default 1), **limit** (default 20).

**200 OK**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "10e10326-da94-4d45-bf4b-7892a39a1a9d",
        "email": "admin.library@gmail.com",
        "username": "admin_lib",
        "avatar": null,
        "role": "admin",
        "status": "active",
        "branchId": null,
        "branchName": null,
        "isSelf": false,
        "isLastAdmin": false,
        "liabilities": { "unreturnedBooks": 0, "unpaidFines": 0 }
      }
    ],
    "pagination": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

The `isSelf` and `isLastAdmin` flags drive the disabled actions / tooltips in the UI (FR-008, FR-009).

---

## Promote a User/Librarian

`POST /api/authorization/users/:userId/promote`

**Request**
```json
{
  "targetRole": "librarian",
  "sudoPassword": "current-admin-password"
}
```

- `targetRole`: `librarian` | `admin`.
- `sudoPassword` is required when promoting to `admin`; ignored for `librarian`.

**200 OK**
```json
{
  "success": true,
  "data": {
    "message": "Account promoted to librarian.",
    "historyEntry": { "id": "…", "actor": "…", "target": "…", "change": "user → librarian", "timestamp": "2026-08-07T10:00:00Z" }
  }
}
```

**Errors**
- `400 LIABILITIES_PENDING` — target has unreturned books or unpaid fines (FR-003).
- `400 ACCOUNT_NOT_ACTIVE` — target status is not `active` (FR-002).
- `400 SELF_ACTION_FORBIDDEN` — target is the acting admin (FR-008).
- `401 INVALID_CREDENTIALS` — sudo password incorrect (FR-010).
- `404 USER_NOT_FOUND`

---

## Demote a Librarian/Admin

`POST /api/authorization/users/:userId/demote`

**Request**
```json
{
  "targetRole": "user",
  "sudoPassword": "current-admin-password"
}
```

- `targetRole`: `user` (from `librarian`) | `librarian` | `user` (from `admin`).
- `sudoPassword` required when demoting an `admin`.

**200 OK**
```json
{
  "success": true,
  "data": {
    "message": "Account demoted to user. All active sessions have been terminated.",
    "historyEntry": { "id": "…", "actor": "…", "target": "…", "change": "admin → user", "timestamp": "2026-08-07T10:00:00Z" }
  }
}
```

**Errors**
- `400 ACCOUNT_NOT_ACTIVE` (FR-002)
- `400 SELF_ACTION_FORBIDDEN` (FR-008)
- `400 LAST_ADMIN_PROTECTED` — demoting the sole remaining active admin (FR-009)
- `401 INVALID_CREDENTIALS` (FR-010)
- `404 USER_NOT_FOUND`

---

## Invite a New Admin

`POST /api/authorization/invite-admin`

**Request**
```json
{
  "email": "new.admin@university.edu",
  "sudoPassword": "current-admin-password"
}
```

**200 OK**
```json
{
  "success": true,
  "data": { "message": "Invitation sent. The new admin can sign in with the temporary password from the email." }
}
```

**Errors**
- `400 EMAIL_TAKEN` — email already exists in `users` (FR-006)
- `400 EMAIL_SEND_FAILED` — mailer could not deliver; transaction rolled back, no partial account created
- `401 INVALID_CREDENTIALS` (FR-010)

---

## Authorization History (History panel)

`GET /api/authorization/history?action=&page=&limit=`

- **action**: `all` (default) | `PROMOTE` | `DEMOTE` | `ADMIN_INVITE`.

**200 OK**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "…",
        "actor": { "userId": "…", "username": "admin_lib", "avatar": null },
        "target": { "userId": "…", "username": "librarian1_lib", "avatar": null },
        "action": "PROMOTE",
        "change": "user → librarian",
        "timestamp": "2026-08-07T10:00:00Z"
      }
    ],
    "pagination": { "total": 1, "page": 1, "limit": 20, "totalPages": 1 }
  }
}
```

---

## Socket.IO Event (real-time)

- **Event**: `authorization:changed`
- **Payload**: a single history entry with the same shape as above.
- Emitted after every successful promote / demote / invite. The `AuthorizationHistoryPanel` subscribes on mount, prepends new entries, and briefly highlights them. A refetch on window focus covers socket reconnect gaps.

---

## Summary of Error Codes

| Code | HTTP | Meaning |
|---|---|---|
| `AUTH_REQUIRED` | 401 | No token |
| `INVALID_TOKEN` | 401 | Bad token or `token_version` mismatch (demoted/re-invited) |
| `FORBIDDEN` | 403 | Non-admin accessing the module |
| `INVALID_CREDENTIALS` | 401 | Sudo password incorrect |
| `LIABILITIES_PENDING` | 400 | Promotion blocked (unreturned books / unpaid fines) |
| `ACCOUNT_NOT_ACTIVE` | 400 | Target not `active` |
| `SELF_ACTION_FORBIDDEN` | 400 | Self role change |
| `LAST_ADMIN_PROTECTED` | 400 | Sole admin demotion |
| `EMAIL_TAKEN` | 400 | Invite email already registered |
| `EMAIL_SEND_FAILED` | 400 | Invite email could not be delivered |
| `USER_NOT_FOUND` | 404 | Target account missing |
