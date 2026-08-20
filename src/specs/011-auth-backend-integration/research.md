# Research: Auth Backend Integration

## Password Hashing
- **Decision**: `bcrypt` với `SALT_ROUNDS = 10`.
- **Rationale**: Industry standard, có sẵn trong npm, tích hợp đơn giản với Node.js async/await.
- **Alternatives**: Argon2 (mạnh hơn nhưng cần native binding phức tạp hơn trên Windows).

## JWT vs Session
- **Decision**: JWT stateless, lưu client-side trong `localStorage`.
- **Rationale**: Phù hợp SPA/Next.js client components; backend không cần session store.
- **Alternatives**: Express session + Redis — phù hợp production hơn nhưng vượt scope MVP.

## OTP Storage
- **Decision**: In-memory Map trong `otpStore.mjs`, TTL 5 phút.
- **Rationale**: Không cần thêm bảng DB; đủ cho dev/demo.
- **Alternatives**: Redis (production), bảng `password_resets` (persistent qua restart).

## Email Delivery
- **Decision**: Nodemailer + Gmail SMTP (`MAIL_USER`, `MAIL_PASS`).
- **Rationale**: Miễn phí, setup nhanh cho môi trường dev.
- **Alternatives**: SendGrid, AWS SES — cần API key riêng.

## Google OAuth Flow
- **Decision**: Passport redirect flow: frontend → `/auth/google` → Google → `/auth/google/callback` → redirect frontend `/auth/callback?token=...&user=...`.
- **Rationale**: OAuth secret không lộ ra client; Passport xử lý token exchange.
- **Alternatives**: NextAuth.js — abstraction cao hơn nhưng không khớp stack Express hiện tại.

## Google-only Users
- **Decision**: Lưu `password_hash = 'GOOGLE_AUTH'` cho user OAuth-only.
- **Rationale**: Tái sử dụng schema `users` hiện có; controller từ chối đổi mật khẩu cho sentinel này.
- **Alternatives**: Thêm cột `auth_provider ENUM('local','google')` — sạch hơn nhưng cần migration.

## Frontend API Base URL
- **Decision**: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'`.
- **Rationale**: Next.js chỉ expose env có prefix `NEXT_PUBLIC_`; fallback giúp dev không cần `.env` ngay.
- **Alternatives**: Proxy qua Next.js rewrites — ẩn URL backend nhưng phức tạp hóa CORS.

## Forgot Password UX
- **Decision**: Wizard 3 bước trong một component (`ForgotPasswordCard`), state `step` local.
- **Rationale**: Một page, một card; parent (`page.tsx`) gọi API theo `data.step`.
- **Alternatives**: 3 route riêng — URL shareable hơn nhưng nhiều file hơn.

## Profile Edit Pattern
- **Decision**: Inline edit qua `ProfileCard` với prop `editable`; email read-only.
- **Rationale**: Giữ UX click-to-edit hiện có; email là identity key không đổi qua profile.
- **Alternatives**: Form modal riêng — nhiều click hơn.
