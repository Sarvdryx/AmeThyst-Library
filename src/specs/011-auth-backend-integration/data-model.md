# Data Model: Auth Backend Integration

## User (PostgreSQL — `public.users`)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `user_id` | UUID | PK, default `gen_random_uuid()` | JWT claim `userId` |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login identifier |
| `password_hash` | VARCHAR(255) | NOT NULL | bcrypt hash hoặc `'GOOGLE_AUTH'` |
| `username` | VARCHAR(100) | NOT NULL, UNIQUE | Display name |
| `phone_number` | VARCHAR(20) | NULL | Optional |
| `avatar` | VARCHAR(500) | NULL | URL string |

### Relationships
- Referenced by `borrow_book`, `reserve_room`, `loan` (FK `user_id` ON DELETE CASCADE).

## OTP Record (In-Memory — `otpStore.mjs`)

| Field | Type | Notes |
|-------|------|-------|
| `email` | string | Key |
| `otp` | string | 6-digit numeric |
| `expiresAt` | number | Unix ms, now + 5 minutes |
| `verified` | boolean | Set true sau verify thành công |

## JWT Token

| Claim | Type | Notes |
|-------|------|-------|
| `userId` | UUID string | From `users.user_id` |
| `email` | string | From `users.email` |
| `exp` | number | 7 days |

## Client Session (localStorage)

| Key | Value | Set When |
|-----|-------|----------|
| `token` | JWT string | Login, OAuth callback |
| `user` | JSON string `{ userId, email, username, avatar, phone_number? }` | Login, OAuth callback, profile update |

## API Request/Response Shapes

### Register
```json
// POST /auth/register
{ "email", "password", "username", "phoneNumber?", "avatar?" }
// 201
{ "message": "Register successful", "user": { "user_id", "email", "username", ... } }
```

### Login
```json
// POST /auth/login
{ "email", "password" }
// 200
{ "token": "...", "user": { "userId", "email", "username", "avatar" } }
```

### Forgot Password Flow
```json
// Step 1: POST /auth/forgot-password  { "email" }
// Step 2: POST /auth/verify-otp        { "email", "otp" }
// Step 3: POST /auth/reset-password    { "email", "newPassword" }
```

### Profile
```json
// GET /user/profile  (Authorization: Bearer <token>)
// 200: { "user_id", "email", "username", "phone_number", "avatar" }

// PUT /user/profile  { "username"?, "phoneNumber"?, "avatar"? }

// PUT /user/profile/password  { "currentPassword", "newPassword" }
```

## Validation Rules

- Email: required, format HTML5 `type="email"`.
- Password register/login: required, min length enforced client-side (existing validation).
- OTP: 6 ký tự, required ở bước 2.
- Reset password: `newPassword === confirmPassword` client-side trước submit.
- Profile update: ít nhất một field trong body; email không updatable qua profile API.

## State Transitions (Forgot Password)

```text
[Step 1: Enter Email]
    → POST forgot-password → success → [Step 2: Enter OTP]
    → fail → stay Step 1, show error

[Step 2: Enter OTP]
    → POST verify-otp → success → [Step 3: New Password]
    → fail → stay Step 2, show error

[Step 3: New Password]
    → POST reset-password → success → [Success screen] → redirect /login (1.5s)
    → fail → stay Step 3, show error
```
