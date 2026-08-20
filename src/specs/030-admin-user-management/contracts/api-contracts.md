# API Contracts: Admin User Management

**Feature Identifier**: `030-admin-user-management`

---

## Global Headers & Authentication

All API endpoints listed below require token authentication. The administrator must include a valid JSON Web Token (JWT) in the request headers:

```http
Authorization: Bearer <JWT_TOKEN>
```

Failure to provide a token or providing an invalid/expired token will result in a standard auth error:
- **Status**: `401 Unauthorized`
- **Body**:
  ```json
  {
    "success": false,
    "error": {
      "code": "INVALID_TOKEN",
      "message": "Invalid token."
    }
  }
  ```

---

## 1. Statistics API

Retrieves authorative user counts for the KPI widgets.

- **Method**: `GET`
- **Path**: `/api/admin/users/stats`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs**: None
- **Validation**: None
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "data": {
        "totalUsers": 1284,
        "activeUsers": 1102,
        "suspendedUsers": 42,
        "librariansCount": 14
      }
    }
    ```
- **Errors**:
  - `403 Forbidden` (`INSUFFICIENT_PERMISSIONS`): Requesting user is not an administrator.

---

## 2. User Directory List API

Returns a paginated, searchable, and filterable list of user profiles with safe administrative details.

- **Method**: `GET`
- **Path**: `/api/admin/users`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (Query Parameters)**:
  - `search` (optional string): Text query matching name/username or email.
  - `role` (optional string): Filter by user role. Allowed values: `'admin'`, `'librarian'`, `'user'`.
  - `status` (optional string): Filter by user status. Allowed values: `'active'`, `'suspended'`.
  - `page` (optional integer): Page offset number. Default: `1`.
  - `limit` (optional integer): Items count returned per page. Default: `10`.
- **Validation**:
  - `page` must be a positive integer >= 1.
  - `limit` must be a positive integer between 1 and 100.
  - `role` and `status` values must conform to allowlist parameters.
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "data": [
        {
          "userId": "07ae60d4-af47-4c2f-95ce-9048031cf948",
          "username": "Julian Thorne",
          "email": "j.thorne@amethyst.lib",
          "phoneNumber": "+1 415 555 0122",
          "avatar": "/UserAvatar.png",
          "role": "admin",
          "status": "active",
          "joinedDate": "2023-01-12T08:30:00.000Z",
          "lastLogin": "2026-07-31T20:36:00.000Z"
        },
        {
          "userId": "Robert Kane UUID",
          "username": "Robert Kane",
          "email": "r.kane@provider.com",
          "phoneNumber": "+1 415 555 1212",
          "avatar": null,
          "role": "user",
          "status": "suspended",
          "joinedDate": "2023-11-28T14:22:00.000Z",
          "lastLogin": "2026-07-17T09:15:00.000Z"
        }
      ],
      "meta": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 1284,
        "totalPages": 129
      }
    }
    ```
- **Safe Fields Guarantee**:
  - Excludes fields like `password_hash`, `verification_token`, `otp`, `oauth_secrets`.

---

## 3. User Details API

Retrieves a detailed safe profile container of a single user, including suspension reasons if applicable.

- **Method**: `GET`
- **Path**: `/api/admin/users/:userId`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (URL Parameters)**:
  - `userId` (string): The UUID identifier of the target user.
- **Validation**:
  - `userId` must be a valid UUID format.
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "data": {
        "userId": "009821-uuid-here",
        "username": "Robert Kane",
        "email": "r.kane@provider.com",
        "phoneNumber": "+1 415 555 1212",
        "avatar": null,
        "role": "user",
        "status": "suspended",
        "suspendedReason": "Multiple overdue book return violations.",
        "joinedDate": "2023-11-28T14:22:00.000Z",
        "lastLogin": "2026-07-17T09:15:00.000Z"
      }
    }
    ```
- **Errors**:
  - `404 Not Found` (`USER_NOT_FOUND`): User ID does not exist in the database.

---

## 4. Role Update API

Updates a target user's system role.

- **Method**: `PUT`
- **Path**: `/api/admin/users/:userId/role`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (Request Body)**:
  ```json
  {
    "role": "librarian"
  }
  ```
- **Validation**:
  - `role` must be one of: `'admin'`, `'librarian'`, `'user'`.
  - Body must not contain other keys.
- **Invariants Checked**:
  - Current user cannot modify their own role.
  - If target user is the final active admin, role demotion is rejected.
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "message": "User role updated successfully.",
      "data": {
        "userId": "005932-uuid",
        "role": "librarian"
      }
    }
    ```
- **Errors**:
  - `400 Bad Request` (`SELF_MUTATION_BLOCKED`): Admin attempts to update their own role.
  - `400 Bad Request` (`FINAL_ADMIN_SAFESHIFT_BLOCKED`): Demoting the last active administrator.
  - `404 Not Found` (`USER_NOT_FOUND`): Target user does not exist.

---

## 5. Account Suspension API

Suspends a user account and records a mandatory explanation reason.

- **Method**: `PUT`
- **Path**: `/api/admin/users/:userId/suspend`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (Request Body)**:
  ```json
  {
    "reason": "Overdue book violation: user has 3 books overdue by more than 30 days."
  }
  ```
- **Validation**:
  - `reason` is required, must be a string, and cannot be blank/empty.
- **Invariants Checked**:
  - Admin cannot suspend themselves.
  - Final active admin cannot be suspended.
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "message": "User account has been suspended successfully.",
      "data": {
        "userId": "target-uuid",
        "status": "suspended",
        "suspendedReason": "Overdue book violation: user has 3 books overdue by more than 30 days."
      }
    }
    ```
- **Errors**:
  - `400 Bad Request` (`REASON_REQUIRED`): Blank or missing reason.
  - `400 Bad Request` (`SELF_MUTATION_BLOCKED`): Admin attempts to suspend themselves.
  - `400 Bad Request` (`FINAL_ADMIN_SAFESHIFT_BLOCKED`): Suspending the last active admin.

---

## 6. Account Restoration API

Restores a suspended user account back to active status.

- **Method**: `PUT`
- **Path**: `/api/admin/users/:userId/unsuspend`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs**: None
- **Validation**: None
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "message": "User account status has been restored successfully.",
      "data": {
        "userId": "target-uuid",
        "status": "active"
      }
    }
    ```

---

## 7. CSV Export API

Exports the complete filtered list of users to CSV format, bypassing pagination limits.

- **Method**: `GET`
- **Path**: `/api/admin/users/export`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (Query Parameters)**: Same filters as list API (`search`, `role`, `status`). Page/Limit are ignored.
- **Response Headers**:
  - `Content-Type: text/csv; charset=utf-8`
  - `Content-Disposition: attachment; filename="users_export.csv"`
- **Success Response (`200 OK`)**:
  - **Payload**: Raw CSV text file.
    ```csv
    User ID,Username,Email,Phone Number,Role,Status,Joined Date,Last Login
    07ae60d4-af47-4c2f-95ce-9048031cf948,Julian Thorne,j.thorne@amethyst.lib,+1 415 555 0122,admin,active,2023-01-12T08:30:00.000Z,2026-07-31T20:36:00.000Z
    005932-uuid,Sarah Miller,s.miller@amethyst.lib,+1 415 555 0899,librarian,active,2023-03-05T10:15:00.000Z,2026-07-31T16:11:00.000Z
    009821-uuid,Robert Kane,r.kane@provider.com,+1 415 555 1212,user,suspended,2023-11-28T14:22:00.000Z,2026-07-17T09:15:00.000Z
    ```

---

## 8. Audit Log Directory API

Retrieves historical records of administrative mutations (role and status changes).

- **Method**: `GET`
- **Path**: `/api/admin/audit-logs`
- **Authorization**: Token authenticated + Role authorization (`role === 'admin'`)
- **Inputs (Query Parameters)**:
  - `targetId` (optional string): Filter log entries by specific target user UUID.
  - `actorId` (optional string): Filter log entries by the admin UUID performing the actions.
  - `page` (optional integer): Offset page number.
- **Success Response (`200 OK`)**:
  - **Payload**:
    ```json
    {
      "success": true,
      "data": [
        {
          "logId": "log-uuid-1",
          "actorId": "admin-uuid",
          "actorUsername": "admin_lib",
          "targetId": "target-uuid-1",
          "targetUsername": "Robert Kane",
          "action": "ACCOUNT_SUSPENSION",
          "prevValue": "active",
          "newValue": "suspended",
          "reason": "Overdue book violations.",
          "createdAt": "2026-07-31T20:45:00.000Z"
        }
      ],
      "meta": {
        "page": 1,
        "pageSize": 10,
        "totalItems": 1
      }
    }
    ```
