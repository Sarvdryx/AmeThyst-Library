# API Contract: Auth Backend Integration

## Base URL

- Development: `http://localhost:5000`
- Client env: `NEXT_PUBLIC_API_URL`

## Authentication Header

Protected routes require:

```http
Authorization: Bearer <jwt_token>
```

---

## Auth Routes (`/auth`)

### POST `/auth/register`

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "username": "Alex Johnson",
  "phoneNumber": "0901234567",
  "avatar": "https://example.com/avatar.png"
}
```

| Field | Required | Notes |
|-------|----------|-------|
| email | yes | Must be unique |
| password | yes | Hashed server-side |
| username | yes | Stored as display name |
| phoneNumber | no | Nullable |
| avatar | no | Nullable URL |

**Responses**
| Status | Body |
|--------|------|
| 201 | `{ "message": "Register successful", "user": { ... } }` |
| 400 | `{ "error": "Email already exists" }` |

---

### POST `/auth/login`

**Request Body**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Responses**
| Status | Body |
|--------|------|
| 200 | `{ "token": "<jwt>", "user": { "userId", "email", "username", "avatar" } }` |
| 401 | `{ "error": "Invalid email or password" }` |

**Client behavior**: Save `token` and `user` to `localStorage`; redirect `/library`.

---

### POST `/auth/forgot-password`

**Request Body**
```json
{ "email": "user@example.com" }
```

**Responses**
| Status | Body |
|--------|------|
| 200 | `{ "message": "OTP sent to your email" }` |
| 404 | `{ "error": "Email does not exist" }` |

---

### POST `/auth/verify-otp`

**Request Body**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Responses**
| Status | Body |
|--------|------|
| 200 | `{ "message": "OTP verified successfully" }` |
| 400 | `{ "error": "Incorrect OTP" \| "OTP has expired" \| "Invalid OTP" }` |

---

### POST `/auth/reset-password`

**Request Body**
```json
{
  "email": "user@example.com",
  "newPassword": "NewSecurePass456!"
}
```

**Precondition**: OTP must be verified for email (server-side `checkVerified`).

**Responses**
| Status | Body |
|--------|------|
| 200 | `{ "message": "Password reset successfully" }` |
| 400 | `{ "error": "OTP not verified" }` |

---

### GET `/auth/google`

Initiates Google OAuth. Redirects browser to Google consent screen.

**Client trigger**: `window.location.href = \`${API}/auth/google\``

---

### GET `/auth/google/callback`

Passport callback. On success redirects to:

```text
{FRONTEND_URL}/auth/callback?token=<jwt>&user=<url-encoded-json>
```

On failure redirects to `{FRONTEND_URL}/login`.

**User object in query**
```json
{ "userId", "email", "username", "avatar" }
```

---

## User Routes (`/user`) — Protected

All routes require valid JWT via `verifyToken` middleware.

### GET `/user/profile`

**Response 200**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "username": "Alex Johnson",
  "phone_number": "0901234567",
  "avatar": "https://..."
}
```

**Response 401**: `{ "error": "No token provided" | "Invalid token" }`

---

### PUT `/user/profile`

**Request Body** (partial update)
```json
{
  "username": "New Name",
  "phoneNumber": "0909999888",
  "avatar": "https://new-avatar.png"
}
```

**Response 200**: Updated user object (same shape as GET).

---

### PUT `/user/profile/password`

**Request Body**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Responses**
| Status | Body |
|--------|------|
| 200 | `{ "message": "Password updated successfully" }` |
| 400 | `{ "error": "Current password is incorrect" \| "Google accounts cannot change password here" }` |

---

## Frontend Component Contracts

### OAuthButtons
| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| label | string | "Sign in with Google" | Button text |
| disabled | boolean | false | Disables click when loading |

**onClick**: Redirect to `${NEXT_PUBLIC_API_URL}/auth/google`

### ForgotPasswordCard
| Prop | Type | Behavior |
|------|------|----------|
| onSubmit | `(data) => Promise<{ success, error? }>` | Parent handles API by `data.step` (1/2/3) |
| onBackToSignIn | `() => void` | Navigate to login |
| isLoading | boolean | Disables inputs and buttons |

### ProfileCard
| Prop | Type | Default | Behavior |
|------|------|---------|----------|
| label | string | — | Field label |
| value | string | — | Display value |
| onUpdate | `(value) => void` | — | Called on save |
| editable | boolean | true | false → read-only styling, no click edit |

### LoginTemplate → FormCard
| Prop | Type | Behavior |
|------|------|----------|
| onSubmit | `(e: FormEvent) => Promise<void>` | POST login, store session, redirect |

### RegisterFormCard
Internal `handleSubmit`: POST `/auth/register`, redirect `/login` after 2s on success.

---

## Error Contract (Global)

All error responses use shape:
```json
{ "error": "<human-readable message>" }
```

Frontend pattern:
```javascript
if (!res.ok) {
  const error = await res.json();
  throw new Error(error.error || 'Fallback message');
}
```
