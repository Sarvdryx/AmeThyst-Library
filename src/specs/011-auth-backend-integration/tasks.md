# Tasks: Auth Backend Integration

**Input**: Design documents from `specs/007-auth-backend-integration/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contract.md

**Tests**: Manual E2E theo `quickstart.md`

**Organization**: Tasks grouped by implementation phase; tất cả đã hoàn thành theo `changes.patch`.

## Format: `[ID] [P?] [Story] Description`

---

## Phase 1: Setup — Database & Server Infrastructure

**Purpose**: Khởi tạo PostgreSQL, dependencies, cấu hình môi trường

- [X] T001 Thêm dependencies (`bcrypt`, `dotenv`, `jsonwebtoken`, `nodemailer`, `passport`, `passport-google-oauth20`, `pg`) vào `src/server/package.json`
- [X] T002 [P] Tạo `src/server/docker-compose.yml` với PostgreSQL 15 và volume init scripts
- [X] T003 [P] Thêm SQL init scripts: `src/server/init_db/01_databook.sql`, `02_datalibrary.sql`, `03_init_rest.sql` (bảng `users`)
- [X] T004 Tạo `src/server/src/config/index.mjs` — pg Pool + dotenv
- [X] T005 Cập nhật `src/server/src/server.mjs` — mount `/auth`, `/user`, passport.initialize()

**Checkpoint**: Server khởi động, kết nối DB thành công

---

## Phase 2: Foundational — Auth Core (US1, US2)

**Purpose**: Register + Login API và JWT middleware

- [X] T006 [P] Tạo `src/server/src/models/auth.models.mjs` — `findUserByEmail`, `createUser`
- [X] T007 [P] Tạo `src/server/src/middlewares/auth.middleware.mjs` — `verifyToken`
- [X] T008 Tạo `src/server/src/services/auth.services.mjs` — `registerUser`, `loginUser` (bcrypt + JWT)
- [X] T009 Tạo `src/server/src/controllers/auth.controllers.mjs` — `register`, `login`
- [X] T010 Tạo `src/server/src/routes/auth.routes.mjs` — POST `/register`, `/login`

### Frontend — Login (US1)

- [X] T011 [US1] Thêm `handleSubmit` async trong `src/client/app/components/templates/LoginTemplate.tsx`
- [X] T012 [US1] Truyền prop `onSubmit` vào `src/client/app/login/FormCard.js`; thay `e.preventDefault()` mock
- [X] T013 [US1] Disable inputs khi `isLoading` trong `FormCard.js`
- [X] T014 [US1] Lưu `token`/`user` vào localStorage; redirect `/library`

### Frontend — Register (US2)

- [X] T015 [US2] Thay mock `setTimeout` bằng POST `/auth/register` trong `src/client/app/register/RegisterFormCard.js`
- [X] T016 [US2] Thêm `disabled={state.isLoading}` cho tất cả form fields
- [X] T017 [US2] Thêm prop `disabled` cho `src/client/app/register/RoleSelector.js`

**Checkpoint**: Đăng ký → đăng nhập → redirect `/library` hoạt động

---

## Phase 3: OTP Password Reset (US3)

**Purpose**: Luồng quên mật khẩu 3 bước

- [X] T018 [P] Tạo `src/server/src/utils/otpStore.mjs` — save/get/markVerified/delete OTP
- [X] T019 [P] Tạo `src/server/src/utils/mailer.mjs` — `sendOTPEmail` qua nodemailer/Gmail
- [X] T020 Tạo `src/server/src/services/otp.service.mjs` — `sendOtp`, `verifyOtp`, `checkVerified`, `clearOtp`
- [X] T021 Mở rộng `auth.services.mjs` — `forgotPassword`, `resetPassword`
- [X] T022 Mở rộng `auth.controllers.mjs` — `forgot`, `verify`, `reset`
- [X] T023 Thêm routes POST `/forgot-password`, `/verify-otp`, `/reset-password` trong `auth.routes.mjs`

### Frontend — Forgot Password (US3)

- [X] T024 [US3] Refactor `src/client/app/forgot-password/ForgotPasswordCard.js` — wizard 3 bước + `"use client"`
- [X] T025 [US3] Implement `handleSubmit` async theo `data.step` trong `src/client/app/forgot-password/page.tsx`
- [X] T026 [US3] Truyền `isLoading` prop; disable UI khi loading
- [X] T027 [US3] Success screen + redirect `/login` sau reset (1.5s)

**Checkpoint**: Quên mật khẩu end-to-end với OTP email thật

---

## Phase 4: Google OAuth (US4)

**Purpose**: Đăng nhập Google qua Passport

- [X] T028 Tạo `src/server/src/config/passport.mjs` — GoogleStrategy, auto-create user
- [X] T029 Thêm GET `/auth/google` và `/auth/google/callback` trong `auth.routes.mjs`
- [X] T030 Callback redirect về `{FRONTEND_URL}/auth/callback?token=&user=`

### Frontend — OAuth (US4)

- [X] T031 [US4] Thêm `handleGoogleSignIn` redirect trong `src/client/app/components/molecules/OAuthButtons.js`
- [X] T032 [US4] Prop `disabled` cho OAuthButtons; truyền từ FormCard khi loading
- [X] T033 [US4] Tạo `src/client/app/auth/callback/page.tsx` — parse query params, lưu localStorage, redirect `/library`

**Checkpoint**: Google Sign-In hoàn chỉnh

---

## Phase 5: User Profile (US5)

**Purpose**: API và UI quản lý hồ sơ

- [X] T034 [P] Tạo `src/server/src/models/user.models.mjs` — get/update user, update password
- [X] T035 Tạo `src/server/src/controllers/user.controllers.mjs` — getProfile, updateProfile, changePassword
- [X] T036 Tạo `src/server/src/routes/user.routes.mjs` — GET/PUT `/profile`, PUT `/profile/password` + verifyToken

### Frontend — Profile (US5)

- [X] T037 [US5] Rewrite `src/client/app/profile/page.tsx` — fetch profile on mount, auth guard
- [X] T038 [US5] `handleUpdate` PUT `/user/profile`; sync localStorage
- [X] T039 [US5] Inline `ChangePasswordForm` component + `handleChangePassword`
- [X] T040 [US5] Cập nhật `ProfileCard.tsx` — prop `editable`, `useEffect` sync `tempValue`
- [X] T041 [US5] Email field read-only (`editable={false}`); thêm Avatar URL field

**Checkpoint**: Profile load/edit/change password hoạt động

---

## Phase 6: Polish & Config

- [X] T042 [P] Cập nhật `src/client/tsconfig.json` — `"types": ["node"]`, `ignoreDeprecations`
- [X] T043 [P] Cập nhật `package-lock.json` (client + server) sau npm install
- [X] T044 Sửa copy typo FormCard: "Create one!" thay "Create!"

---

## Dependencies & Execution Order

```text
Phase 1 (Setup)
    ↓
Phase 2 (Auth Core) ──→ Phase 3 (OTP) ──→ Phase 4 (OAuth)
    ↓                                          ↓
Phase 5 (Profile) ←──────────────────────────┘
    ↓
Phase 6 (Polish)
```

### Parallel Opportunities (đã thực hiện)

- T002 + T003: Docker và SQL scripts song song
- T006 + T007: Models và middleware song song
- T018 + T019: otpStore và mailer song song
- T034 + T037: Backend user models và frontend profile page có thể song song sau Phase 2

---

## Implementation Strategy (Đã áp dụng)

1. **Backend trước, frontend sau** cho từng user story — API sẵn sàng trước khi nối UI.
2. **MVP = Phase 1 + 2** — register/login đủ demo sớm nhất.
3. **Incremental**: OTP → OAuth → Profile, mỗi phase test độc lập qua `quickstart.md`.
4. **Mock → Real**: Thay toàn bộ `setTimeout` mock và `console.log` placeholder bằng `fetch` thật.

---

## File Change Summary (from changes.patch)

| Area | Files Modified/Created |
|------|------------------------|
| Server config | `config/index.mjs`, `config/passport.mjs`, `server.mjs` |
| Server auth | `routes/auth.routes.mjs`, `controllers/auth.controllers.mjs`, `services/auth.services.mjs`, `models/auth.models.mjs` |
| Server user | `routes/user.routes.mjs`, `controllers/user.controllers.mjs`, `models/user.models.mjs` |
| Server utils | `utils/mailer.mjs`, `utils/otpStore.mjs`, `services/otp.service.mjs`, `middlewares/auth.middleware.mjs` |
| Server infra | `docker-compose.yml`, `init_db/*.sql`, `package.json` |
| Client auth | `LoginTemplate.tsx`, `FormCard.js`, `OAuthButtons.js`, `auth/callback/page.tsx` |
| Client register | `RegisterFormCard.js`, `RoleSelector.js` |
| Client forgot | `ForgotPasswordCard.js`, `forgot-password/page.tsx` |
| Client profile | `profile/page.tsx`, `ProfileCard.tsx` |
| Client config | `tsconfig.json`, `package-lock.json` |
