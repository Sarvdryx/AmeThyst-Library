# Data Model: Avatar Upload and Profile Page Enhancements

This document specifies the database schema details, constraints, and validation rules for the user profile fields.

## Database Schema: `users` Table

The avatar and profile details are stored in the existing `users` table in PostgreSQL.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | `UUID` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Unique identifier for each user |
| `email` | `VARCHAR(255)` | `NOT NULL`, `UNIQUE` | User's email address |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Hashed password |
| `username` | `VARCHAR(100)` | `NOT NULL` | Display name of the user |
| `phone_number` | `VARCHAR(20)` | `NULL` | Optional contact phone number |
| `avatar` | `VARCHAR(500)` | `NULL` | Stores the avatar image URL (Cloudinary URL or pasted external web URL) |
| `role` | `VARCHAR(20)` | `NOT NULL`, `DEFAULT 'user'`, `CHECK` | User privileges role. Must be one of: `'user'`, `'admin'`, `'librarian'` |
| `borrow_num` | `INTEGER` | `NOT NULL`, `DEFAULT 0` | Total number of books currently borrowed by the user. Managed by borrowing transactions (Read-only here) |

## Validations and Constraints

### 1. Avatar Size and Type Limits (Server-Side)
- **MIME Types**: Must be one of `image/jpeg`, `image/png`, `image/gif`, `image/webp`.
- **File Size**: Maximum 2MB (2,097,152 bytes) limit enforced by the `multer` middleware.
- **Pasted URL Format**: Must start with `http://` or `https://` and match standard URL validation.

### 2. Read-Only Attributes
- **`role`**: Client components must display this value visually as a badge but must not expose any update controls.
- **`borrow_num`**: Checked out book count is calculated and incremented/decremented by the borrowing/return transactions. The user profile interface must display this value as a read-only statistic.

### 3. Untouched Attributes
- **Biography (`bio`)** & **Department (`department`)**: These fields must not be present in the update payloads and are completely out of scope for this profile enhancement.
