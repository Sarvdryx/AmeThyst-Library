# Implementation Plan: Auth Backend Integration

**Branch**: `007-auth-backend-integration` | **Date**: 2026-06-18 | **Spec**: [specs/007-auth-backend-integration/spec.md](spec.md)

**Input**: Feature specification từ `/specs/007-auth-backend-integration/spec.md`, triển khai thực tế ghi trong `changes.patch`.

## Summary

Xây dựng backend Express.js với PostgreSQL cho xác thực (register, login, OTP reset, Google OAuth) và quản lý profile; đồng thời nối các trang frontend đã có (login, register, forgot-password, profile) tới API thật thay cho mock/setTimeout. Kiến trúc 3 tầng: routes → controllers → services → models.

## Technical Context

**Language/Version**: JavaScript ES modules (Node.js 18+), TypeScript/JSX trên Next.js client

**Primary Dependencies**:
- Server: `express`, `pg`, `bcrypt`, `jsonwebtoken`, `passport`, `passport-google-oauth20`, `nodemailer`, `dotenv`, `cors`
- Client: Next.js App Router, React 19, fetch API, localStorage

**Storage**: PostgreSQL 15 (Docker), bảng `users`; OTP in-memory (`otpStore.mjs`)

**Testing**: Manual end-to-end theo `quickstart.md`

**Target Platform**: Web (localhost dev), Windows/Linux

**Project Type**: Monorepo web app — `src/client` (Next.js) + `src/server` (Express)

**Performance Goals**: Login/register response < 500ms trên localhost

**Constraints**:
- JWT lưu client-side (localStorage) — chưa dùng httpOnly cookie
- OTP store mất khi restart server
- Google OAuth cần credentials thật từ Google Cloud Console

**Scale/Scope**: 8 API endpoints auth + 3 endpoints user + 5 luồng frontend

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Component-Driven & Reusability**: Tách `OAuthButtons`, `ProfileCard`, `ForgotPasswordCard` với props rõ ràng (`disabled`, `editable`, `onSubmit`).
- [x] **II. State Management**: Loading/error state trên từng page; token/user trong localStorage.
- [x] **III. Responsive & Beautiful Design**: Giữ nguyên UI design tokens hiện có; chỉ thêm trạng thái disabled/loading.
- [x] **IV. Performance Optimization**: Không thêm re-render không cần thiết; `useEffect` sync `ProfileCard` value.
- [x] **V. Error Handling & Accessibility**: Hiển thị lỗi API dạng text đỏ; disable form khi loading.

## Project Structure

### Documentation (this feature)

```text
specs/007-auth-backend-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api-contract.md
├── tasks.md
└── checklists/
    └── requirements.md
```

### Source Code (repository root)

```text
src/server/
├── docker-compose.yml
├── init_db/
│   ├── 01_databook.sql
│   ├── 02_datalibrary.sql
│   └── 03_init_rest.sql          # users table + library schema
├── src/
│   ├── config/
│   │   ├── index.mjs              # PostgreSQL pool
│   │   └── passport.mjs           # Google OAuth strategy
│   ├── controllers/
│   │   ├── auth.controllers.mjs
│   │   └── user.controllers.mjs
│   ├── middlewares/
│   │   └── auth.middleware.mjs    # JWT verifyToken
│   ├── models/
│   │   ├── auth.models.mjs
│   │   └── user.models.mjs
│   ├── routes/
│   │   ├── auth.routes.mjs
│   │   └── user.routes.mjs
│   ├── services/
│   │   ├── auth.services.mjs
│   │   └── otp.service.mjs
│   ├── utils/
│   │   ├── mailer.mjs
│   │   └── otpStore.mjs
│   └── server.mjs

src/client/app/
├── auth/callback/page.tsx         # OAuth redirect handler
├── components/
│   ├── molecules/OAuthButtons.js
│   ├── molecules/ProfileCard.tsx
│   └── templates/LoginTemplate.tsx
├── forgot-password/
│   ├── ForgotPasswordCard.js      # 3-step wizard
│   └── page.tsx
├── login/FormCard.js
├── profile/page.tsx
└── register/
    ├── RegisterFormCard.js
    └── RoleSelector.js
```

**Structure Decision**: Backend theo pattern MVC-lite (routes/controllers/services/models); frontend giữ colocation theo Next.js App Router, gọi API qua `fetch` + env `NEXT_PUBLIC_API_URL`.

## Implementation Phases (Thứ tự thực hiện)

### Phase 0 — Hạ tầng DB & Server

1. Thêm dependencies vào `src/server/package.json`
2. Tạo `docker-compose.yml` + SQL init scripts
3. Cấu hình `config/index.mjs` (pg Pool + dotenv)
4. Mount routes trong `server.mjs`

### Phase 1 — Auth API Core

1. Models: `findUserByEmail`, `createUser`
2. Services: `registerUser`, `loginUser` (bcrypt + JWT)
3. Controllers + routes: POST `/auth/register`, `/auth/login`
4. Middleware: `verifyToken`

### Phase 2 — OTP Password Reset

1. Utils: `otpStore.mjs`, `mailer.mjs`
2. Service: `sendOtp`, `verifyOtp`, `resetPassword`
3. Routes: POST `/auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`
4. Frontend: refactor `ForgotPasswordCard` thành wizard 3 bước

### Phase 3 — Google OAuth

1. `passport.mjs` với GoogleStrategy (auto-create user)
2. Routes: GET `/auth/google`, `/auth/google/callback`
3. Frontend: `OAuthButtons` redirect + `/auth/callback/page.tsx`

### Phase 4 — User Profile API & UI

1. Models/controllers: GET/PUT `/user/profile`, PUT `/user/profile/password`
2. Frontend `profile/page.tsx`: fetch on mount, inline edit, change password form
3. `ProfileCard`: prop `editable`, sync `tempValue` via `useEffect`

### Phase 5 — Frontend Auth Wiring

1. `LoginTemplate`: `handleSubmit` → POST login → localStorage → `/library`
2. `RegisterFormCard`: thay mock setTimeout bằng POST register
3. `FormCard`/`RoleSelector`: prop `disabled` khi loading
4. `tsconfig.json`: thêm `"types": ["node"]` cho `process.env`

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| OTP in-memory store | Dev speed, no Redis setup | DB table OTP adds migration complexity for MVP |
| localStorage JWT | Match existing frontend pattern | httpOnly cookies need cookie middleware + CORS credentials |
| `GOOGLE_AUTH` sentinel password | Distinguish OAuth users | Separate `auth_provider` column deferred to later migration |
