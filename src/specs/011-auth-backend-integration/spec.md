# Feature Specification: Auth Backend Integration

**Feature Branch**: `007-auth-backend-integration`

**Created**: 2026-06-18

**Status**: Implemented

**Input**: Triển khai hệ thống xác thực end-to-end: backend Express + PostgreSQL, tích hợp frontend Next.js cho đăng nhập, đăng ký, quên mật khẩu (OTP), Google OAuth và quản lý hồ sơ người dùng.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Đăng nhập bằng email/mật khẩu (Priority: P1)

Là người dùng đã có tài khoản, tôi muốn đăng nhập bằng email và mật khẩu để truy cập thư viện LIMA.

**Why this priority**: Luồng xác thực cốt lõi; mọi tính năng bảo vệ phụ thuộc vào đăng nhập.

**Independent Test**: Truy cập `/login`, nhập email/mật khẩu hợp lệ, xác nhận nhận JWT, lưu vào `localStorage`, và chuyển hướng tới `/library`.

**Acceptance Scenarios**:

1. **Given** tài khoản hợp lệ tồn tại trong DB, **When** gửi POST `/auth/login`, **Then** API trả về `{ token, user }` với status 200.
2. **Given** email hoặc mật khẩu sai, **When** submit form đăng nhập, **Then** hiển thị thông báo lỗi và không lưu token.
3. **Given** form đang gửi request, **When** `isLoading = true`, **Then** các trường input và nút OAuth bị vô hiệu hóa.

---

### User Story 2 - Đăng ký tài khoản mới (Priority: P1)

Là người dùng mới, tôi muốn tạo tài khoản với họ tên, email, mật khẩu để sử dụng hệ thống.

**Why this priority**: Cần thiết song song với đăng nhập để onboarding người dùng.

**Independent Test**: Điền form tại `/register`, submit, xác nhận user được tạo trong DB và chuyển hướng về `/login`.

**Acceptance Scenarios**:

1. **Given** email chưa tồn tại, **When** POST `/auth/register`, **Then** tạo user mới với mật khẩu đã hash (bcrypt) và trả về 201.
2. **Given** email đã tồn tại, **When** đăng ký, **Then** trả về lỗi 400 "Email already exists".
3. **Given** mật khẩu và xác nhận không khớp, **When** submit, **Then** hiển thị lỗi client-side trước khi gọi API.

---

### User Story 3 - Quên mật khẩu qua OTP (Priority: P2)

Là người dùng quên mật khẩu, tôi muốn nhận mã OTP qua email, xác minh OTP, và đặt mật khẩu mới qua luồng 3 bước.

**Why this priority**: Khôi phục tài khoản mà không cần admin can thiệp.

**Independent Test**: Truy cập `/forgot-password`, hoàn thành 3 bước (email → OTP → mật khẩu mới), xác nhận đăng nhập được với mật khẩu mới.

**Acceptance Scenarios**:

1. **Given** email tồn tại, **When** bước 1 submit, **Then** gửi OTP 6 chữ số qua email và chuyển sang bước 2.
2. **Given** OTP đúng và chưa hết hạn, **When** bước 2 submit, **Then** đánh dấu verified và chuyển sang bước 3.
3. **Given** OTP đã verified, **When** bước 3 submit mật khẩu khớp, **Then** cập nhật `password_hash` và chuyển hướng về `/login`.
4. **Given** OTP sai hoặc hết hạn, **When** verify, **Then** hiển thị lỗi và giữ nguyên bước hiện tại.

---

### User Story 4 - Đăng nhập Google OAuth (Priority: P2)

Là người dùng, tôi muốn đăng nhập bằng tài khoản Google để không cần nhớ mật khẩu.

**Why this priority**: Giảm friction đăng nhập; tích hợp phổ biến trong hệ thống thư viện.

**Independent Test**: Click "Sign in with Google", hoàn thành OAuth flow, xác nhận token lưu và redirect `/library`.

**Acceptance Scenarios**:

1. **Given** nút Google trên form đăng nhập, **When** click, **Then** redirect tới `GET /auth/google`.
2. **Given** OAuth thành công, **When** callback, **Then** tạo user mới nếu chưa có (password_hash = `GOOGLE_AUTH`) hoặc dùng user hiện có.
3. **Given** callback thành công, **When** redirect frontend, **Then** trang `/auth/callback` lưu token/user vào `localStorage` và chuyển `/library`.

---

### User Story 5 - Quản lý hồ sơ cá nhân (Priority: P3)

Là người dùng đã đăng nhập, tôi muốn xem và cập nhật thông tin cá nhân, đổi mật khẩu trên trang `/profile`.

**Why this priority**: Hoàn thiện vòng đời tài khoản sau khi xác thực.

**Independent Test**: Đăng nhập, mở `/profile`, sửa username/phone/avatar, đổi mật khẩu, xác nhận thay đổi persist.

**Acceptance Scenarios**:

1. **Given** chưa có token, **When** truy cập `/profile`, **Then** redirect `/login`.
2. **Given** token hợp lệ, **When** load trang, **Then** GET `/user/profile` và hiển thị dữ liệu.
3. **Given** email field, **When** click, **Then** không cho chỉnh sửa (`editable={false}`).
4. **Given** mật khẩu hiện tại đúng, **When** đổi mật khẩu, **Then** PUT `/user/profile/password` thành công.
5. **Given** tài khoản Google (`GOOGLE_AUTH`), **When** đổi mật khẩu, **Then** API trả lỗi 400.

---

### Edge Cases

- Email không tồn tại khi quên mật khẩu → trả 404 "Email does not exist".
- OTP hết hạn sau 5 phút → lỗi "OTP has expired".
- Reset password khi chưa verify OTP → lỗi "OTP not verified".
- JWT không hợp lệ hoặc thiếu → middleware trả 401.
- Mật khẩu mới và xác nhận không khớp → validation client-side trước khi gọi API.
- Server DB chưa chạy → frontend hiển thị lỗi network/fetch.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend MUST cung cấp REST API auth tại prefix `/auth`.
- **FR-002**: Backend MUST hash mật khẩu bằng bcrypt (10 salt rounds) trước khi lưu DB.
- **FR-003**: Backend MUST phát JWT (expiry 7 ngày) sau login thành công hoặc OAuth callback.
- **FR-004**: Backend MUST bảo vệ route `/user/*` bằng middleware `verifyToken`.
- **FR-005**: Hệ thống MUST triển khai quên mật khẩu 3 bước: gửi OTP → verify OTP → reset password.
- **FR-006**: OTP MUST được lưu in-memory (otpStore), hết hạn sau 5 phút, gửi qua nodemailer/Gmail.
- **FR-007**: Frontend MUST lưu `token` và `user` vào `localStorage` sau login/OAuth.
- **FR-008**: Frontend MUST gọi API qua `NEXT_PUBLIC_API_URL` (fallback `http://localhost:5000`).
- **FR-009**: Google OAuth MUST dùng Passport.js strategy `passport-google-oauth20`.
- **FR-010**: Database MUST dùng PostgreSQL 15 với bảng `users` và schema thư viện (docker-compose + init scripts).

### Key Entities

- **User**: `user_id` (UUID), `email` (unique), `password_hash`, `username` (unique), `phone_number`, `avatar`.
- **OTP Record** (in-memory): `email`, `otp`, `expiresAt`, `verified` flag.
- **JWT Payload**: `{ userId, email }`.
- **Session Storage (client)**: `localStorage.token`, `localStorage.user`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Người dùng hoàn thành đăng ký → đăng nhập → truy cập `/library` trong dưới 2 phút.
- **SC-002**: Luồng quên mật khẩu hoàn thành end-to-end (nhận OTP thật qua email cấu hình) trong dưới 5 phút.
- **SC-003**: 100% route bảo vệ (`/user/profile*`) từ chối request không có Bearer token.
- **SC-004**: Google OAuth tạo hoặc tái sử dụng user và redirect thành công về frontend.
- **SC-005**: Cập nhật profile phản ánh ngay trên UI và đồng bộ `localStorage.user`.

## Assumptions

- PostgreSQL chạy qua Docker Compose tại `src/server/docker-compose.yml`.
- Biến môi trường `.env` đã cấu hình: `DB_*`, `JWT_SECRET`, `MAIL_USER`, `MAIL_PASS`, `GOOGLE_*`, `FRONTEND_URL`.
- Frontend Next.js chạy port 3000, backend Express port 5000.
- Role selector trên form đăng ký vẫn là UI-only; chưa persist role vào DB trong phiên bản này.
- OTP store in-memory phù hợp dev; production cần Redis hoặc DB.
