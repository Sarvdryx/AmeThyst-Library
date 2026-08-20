# Data Model & Schema Mapping: Profile Details Redesign

This document describes the schema structure of the `users` table and how the fields are mapped between the database (snake_case) and the application client (camelCase).

## 1. Database Table: `users` (Existing Structure)

No SQL schema migration is required. The columns are already defined on the PostgreSQL database table `users` and will be queried and updated directly.

| Column in DB | PostgreSQL Type | JS Field Mapping | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `user_id` | UUID | `userId` | Primary Key, NOT NULL | Unique identifier |
| `email` | VARCHAR(255) | `email` | Unique, NOT NULL | Login and contact email |
| `username` | VARCHAR(100) | `username` (or `fullName`) | NOT NULL | User's full name |
| `phone_number` | VARCHAR(20) | `phoneNumber` | DEFAULT NULL | Validated 9-10 digit contact phone |
| `avatar` | TEXT | `avatar` | DEFAULT NULL | Image secure URL |
| `role` | VARCHAR(20) | `role` | DEFAULT 'user' | Access control privilege |
| `borrow_num` | INTEGER | `borrowNum` | DEFAULT 0, >= 0 | Number of currently borrowed books |
| `occupation` | VARCHAR(100) | `occupation` | DEFAULT NULL | Career/academic occupation |
| `birth_date` | DATE | `birthDate` | DEFAULT NULL | Date of birth |
| `gender` | VARCHAR(20) | `gender` | DEFAULT NULL | Gender identity ('male', 'female', 'other') |
| `hometown` | VARCHAR(100) | `hometown` | DEFAULT NULL | User's hometown |
| `description` | TEXT | `description` | DEFAULT NULL | User biography / details |

---

## 2. Server-Side Data Mapping

To bridge the backend DB rows and client payloads, the mapping occurs in the following files:

### A. Selection Mapping (`src/server/src/models/user.models.mjs`)
Use SQL column aliases (`AS`) in `getUserById` and `updateUser` returning clauses to produce camelCase keys:
```sql
SELECT 
  user_id AS "userId",
  email,
  username,
  phone_number AS "phoneNumber",
  avatar,
  role,
  borrow_num AS "borrowNum",
  occupation,
  birth_date AS "birthDate",
  gender,
  hometown,
  description,
  (password_hash = 'GOOGLE_AUTH') AS "isGoogleAccount"
FROM users
WHERE user_id = $1
```

### B. Update Handling (`src/server/src/controllers/user.controllers.mjs`)
Accept incoming payload fields in camelCase and map them to database properties in `updateUser`:
```javascript
// Input request body fields:
const { username, phoneNumber, occupation, birthDate, gender, hometown, description } = req.body;
```
Inside the `updateUser` model utility, map them to DB columns:
```sql
UPDATE users
SET username = COALESCE($1, username),
    phone_number = COALESCE($2, phone_number),
    occupation = COALESCE($3, occupation),
    birth_date = COALESCE($4, birth_date),
    gender = COALESCE($5, gender),
    hometown = COALESCE($6, hometown),
    description = COALESCE($7, description)
WHERE user_id = $8
```

---

## 3. Client-Side Page State (`src/client/app/profile/page.tsx`)

### Form State Objects
- `profile`: Tracks current input values being typed by the user.
- `savedProfile`: Stores the last known clean copy fetched from the API.

### State Transitions
1. **Initialize**:
   - Call `GET /user/profile`.
   - Populate `profile` and `savedProfile` states with identical API data.
2. **Form Editing**:
   - User types in a field.
   - Update `profile` state (e.g., `setProfile(prev => ({ ...prev, occupation: newValue }))`).
   - `isChanged` is evaluated by comparing `profile !== savedProfile` property-by-property.
3. **Cancel**:
   - User clicks Cancel.
   - Revert current form values by setting `setProfile(savedProfile)`.
4. **Save**:
   - User clicks Save Changes.
   - Run format validations (like Phone Number check).
   - If validations pass, trigger API `PUT /user/profile` with changed fields.
   - On success, set `savedProfile` to the new `profile` state.
