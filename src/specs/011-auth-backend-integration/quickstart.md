# Quickstart: Auth Backend Integration

## Prerequisites

- Node.js 18+
- Docker Desktop (cho PostgreSQL)
- Gmail account hoặc SMTP credentials (cho OTP email)
- Google Cloud OAuth credentials (cho Google Sign-In, optional)

## Environment Setup

### Server (`src/server/.env`)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=amelibrary
DB_USER=lib_admin
DB_PASSWORD=<your_password>
DB_CONTAINER_NAME=amethyst-db

JWT_SECRET=<random_secret_key>

MAIL_USER=<gmail@gmail.com>
MAIL_PASS=<app_password>

GOOGLE_CLIENT_ID=<google_client_id>
GOOGLE_CLIENT_SECRET=<google_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

FRONTEND_URL=http://localhost:3000
```

### Client (`src/client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Start Services

### 1. Database

```bash
cd src/server
docker compose up -d
```

Init scripts trong `init_db/` chạy tự động lần đầu, tạo schema + bảng `users`.

### 2. Backend

```bash
cd src/server
npm install
npm run dev
```

Server lắng nghe port **5000**.

### 3. Frontend

```bash
cd src/client
npm install
npm run dev
```

Frontend tại **http://localhost:3000**.

---

## Validation Scenarios

### 1. Đăng ký tài khoản mới

1. Mở `http://localhost:3000/register`
2. Điền Full Name, Email, Password, Confirm Password
3. Click **Create Account**
4. **Expect**: Loading spinner → redirect `/login` sau ~2 giây
5. **Verify DB**: `SELECT * FROM users WHERE email = '...'`

### 2. Đăng nhập email/password

1. Mở `http://localhost:3000/login`
2. Nhập email/password vừa đăng ký
3. Click **Sign In**
4. **Expect**: Redirect `/library` sau 500ms
5. **Verify**: DevTools → Application → localStorage có `token` và `user`

### 3. Quên mật khẩu (3 bước)

1. Mở `http://localhost:3000/forgot-password`
2. **Bước 1**: Nhập email → **Send OTP**
3. **Expect**: Chuyển bước 2; kiểm tra inbox Gmail nhận OTP 6 số
4. **Bước 2**: Nhập OTP → **Verify OTP**
5. **Bước 3**: Nhập mật khẩu mới + xác nhận → **Reset Password**
6. **Expect**: Màn hình Success → redirect `/login`
7. Đăng nhập với mật khẩu mới → thành công

**Negative tests**:
- Email không tồn tại → lỗi "Email does not exist"
- OTP sai → lỗi "OTP is incorrect or has expired"
- Mật khẩu không khớp → lỗi client "Passwords do not match"

### 4. Google OAuth

1. Cấu hình Google Cloud Console redirect URI: `http://localhost:5000/auth/google/callback`
2. Mở `/login` → click **Sign in with Google**
3. **Expect**: Redirect Google → consent → `/auth/callback` → `/library`
4. **Verify**: User mới trong DB với `password_hash = 'GOOGLE_AUTH'`

### 5. Profile

1. Đăng nhập trước
2. Mở `http://localhost:3000/profile`
3. **Expect**: Hiển thị username, email, phone, avatar từ API
4. Click **Full Name** → sửa → Save
5. **Expect**: Message xanh "Updated successfully!"
6. Email field: không click được (opacity 60%)
7. **Change Password**: nhập current + new + confirm → **Update Password**

**Without token**: Truy cập `/profile` trực tiếp → redirect `/login`

### 6. Protected API

```bash
curl http://localhost:5000/user/profile
# Expect: 401 { "error": "No token provided" }

curl -H "Authorization: Bearer <token>" http://localhost:5000/user/profile
# Expect: 200 user JSON
```

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Cách xử lý |
|--------|-------------|------------|
| `ECONNREFUSED :5000` | Server chưa chạy | `npm run dev` trong `src/server` |
| DB connection error | Docker chưa up | `docker compose up -d` |
| OTP không gửi | Sai `MAIL_USER`/`MAIL_PASS` | Dùng Gmail App Password |
| Google OAuth fail | Sai callback URL | Khớp với Google Console + `.env` |
| OTP expired sau restart | In-memory store mất | Gửi lại OTP từ bước 1 |
| CORS error | Frontend URL khác | Kiểm tra `cors()` đã enable trên server |
