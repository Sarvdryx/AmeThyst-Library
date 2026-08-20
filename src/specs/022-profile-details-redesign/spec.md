# Feature Specification: Profile Details Redesign & Borrowing Info Widget

**Feature Branch**: `022-profile-details-redesign`

**Created**: 2026-06-30

**Status**: Draft

**Input**: Redesign the LIMA profile page (`/profile`) main content into a "Profile Details" form and add a "Borrowing Information" widget to the left sidebar, using the Figma export reference layout (adapted to proper responsive grid/flex layouts without hardcoded positions/pixels). Expose and consume real backend data for the borrowing limit and books borrowed. Align with all prior specifications (phone validation, page-level save/cancel, avatar placement in sidebar, and re-introducing the bio description field).

---

## User Scenarios & Testing

### User Story 1 - Profile Details Redesign (Priority: P1)
As a logged-in member, I want to view and edit my detailed personal and contact information on the profile page in a structured grid layout, so that I can keep my library account details up to date.

**Why this priority**: Core user management requirement. Provides a modern form layout with proper inputs for contact and personal information, aligning with modern profile pages.

**Independent Test**:
1. Log in and navigate to the `/profile` page.
2. Verify that two distinct form cards are visible: "General & Contact Info" and "Personal Details".
3. Verify that a separate "Description" textarea block is displayed.
4. Fill in changes for Full Name, Phone Number, Occupation, Birth Date, Gender, Hometown, and Description.
5. Click "Save Changes" and verify that changes are persisted to the database and displayed correctly on page reload.
6. Make changes, click "Cancel", and verify that all inputs revert to their previous saved values.

**Acceptance Scenarios**:
1. **Given** a user is on the `/profile` page, **When** the page renders, **Then** they see the "General & Contact Info" card containing Full Name, Email Address (disabled/read-only), Phone Number, and Occupation.
2. **Given** the user views the "Personal Details" card, **When** it renders, **Then** they see a Birth Date date picker, a Gender custom dropdown, and a Hometown text input.
3. **Given** the user views the bottom of the form, **When** they look at the Description block, **Then** they see a multiline text input block for their bio description.
4. **Given** the form is displayed, **When** no values have been changed from their original saved state, **Then** both the "Save Changes" and "Cancel" buttons are disabled.
5. **Given** the user makes a change in any input field, **When** the change is registered, **Then** both the "Save Changes" and "Cancel" buttons become enabled.
6. **Given** the user clicks "Cancel" with unsaved changes, **When** clicked, **Then** all form fields revert to their previously saved values, and both buttons become disabled.

---

### User Story 2 - Borrowing Information Sidebar Widget (Priority: P1)
As a logged-in user, I want to see my borrowing limit and the number of books I have currently borrowed in the sidebar, so that I am always aware of my lending status while navigating the library system.

**Why this priority**: Key usability feature. Gives immediate feedback on the user's borrowing status from any profile subpage, promoting active account awareness.

**Independent Test**:
1. Log in as a reader. Check the left sidebar on the `/profile` page.
2. Verify that the "Borrowing Information" section is visible above the logout container.
3. Verify that "Borrowing Limit" displays the system maximum limit (derived from the backend constant, e.g., `5`).
4. Verify that "Books Borrowed" displays the actual number of books the user is currently borrowing (e.g., `2`).

**Acceptance Scenarios**:
1. **Given** a logged-in user navigates to the profile or security page, **When** the sidebar loads, **Then** it renders a "Borrowing Information" widget below the navigation links.
2. **Given** the "Borrowing Information" widget is rendered, **When** it fetches user data, **Then** it displays "Borrowing Limit" dynamically retrieved from the backend constant (currently `5` in the server services) and "Books Borrowed" dynamically retrieved from the user's profile database row.
3. **Given** the widget is displayed, **When** the user switches the application language (English/Vietnamese), **Then** all labels in the widget immediately localize.
4. **Given** the widget is displayed, **When** the dark mode is toggled, **Then** the widget container, borders, labels, and values adapt correctly to the active theme.

---

### Edge Cases
* **Invalid Date Inputs**: If a user enters an invalid date via standard manual entry or keyboard inputs in the date picker, the input must reject or fallback cleanly to empty or the previous state, preventing database save errors.
* **Null or Empty Values**: If optional fields (Occupation, Birth Date, Gender, Hometown, Description) are saved as empty or null, the backend must save them as `NULL` in the database, and the frontend should show empty inputs or default placeholders appropriately.
* **Network/API Failures**: If saving changes fails (e.g., database timeout, 500 error), the UI must display a localized error banner `profile.update_failed`, and keep the form in its current dirty/modified state so the user doesn't lose their input.

---

## Requirements

### Functional Requirements

#### Frontend (Next.js React Client)
- **FR-001**: Redesign the main layout of the `/profile` page using atomic design components.
  - Wrap sections inside modular container components styled with Tailwind CSS (grid layouts like `grid grid-cols-1 md:grid-cols-2 gap-6`, flex layouts, etc.). Do not use absolute positioning or hardcoded coordinate values.
  - The form MUST have two main card containers: "General & Contact Info" and "Personal Details".
  - Below these cards, place a full-width card container for the "Description" (bio) text field.
- **FR-002**: Map the fields inside the cards as follows:
  - **General & Contact Info Card**:
    - **Full Name**: Input element, editable, localized label, placeholder: `profile.full_name_placeholder`.
    - **Email Address**: Input element, disabled/read-only (styled as read-only, matching `bg-neutral-100 dark:bg-neutral-800 cursor-not-allowed`), localized label.
    - **Phone Number**: Input element, editable, localized label, placeholder: `profile.phone_placeholder`.
    - **Occupation**: Input element, editable, localized label, placeholder: `profile.occupation_placeholder`.
  - **Personal Details Card**:
    - **Birth Date**: Input element with `type="date"`, editable, localized label.
    - **Gender**: Custom dropdown using the `CustomSelect` atomic component, editable, options loaded from localization: Male (`profile.gender_male`), Female (`profile.gender_female`), Other (`profile.gender_other`), with default placeholder option (`profile.gender_select`).
    - **Hometown**: Input element, editable, localized label, placeholder: `profile.hometown_placeholder`.
  - **Description Card**:
    - **Description**: Textarea element, editable, localized label, placeholder: `profile.description_placeholder`. Supports multiple lines (min-height `120px`).
- **FR-003**: The form must adhere to the page-level save changes and cancel pattern:
  - Keep a state object for current inputs (`profile`) and a separate state object for the last saved database state (`savedProfile`).
  - Disable "Save Changes" and "Cancel" buttons if no fields differ between `profile` and `savedProfile`.
  - Clicking "Cancel" reverts `profile` state to `savedProfile`.
  - Display both buttons in the bottom right corner of the form. "Save Changes" button must be styled with a dark slate background (`bg-[#0F172A]`) and white text. "Cancel" button must be styled as a white/transparent background button with a border.
- **FR-004**: Add the "Borrowing Information" widget inside the sidebar (`Sidebar.tsx`) below the navigation list (`<nav>`) and above the logout button container.
  - The widget must display two metrics: "Borrowing Limit" and "Books Borrowed".
  - The "Borrowing Limit" must come from the backend payload (`maxBorrowLimit`).
  - The "Books Borrowed" must display the real user `borrowNum` (already passed as `borrowNum` prop to the `Sidebar` component).
  - The widget layout must match the Figma reference text and hierarchy, using responsive Tailwind layout details.
- **FR-005**: All user-facing text, placeholders, and error messages MUST be localized using English (`en.json`) and Vietnamese (`vi.json`) files.
- **FR-006**: All inputs, select elements, cards, and text labels MUST support the global light/dark theme system.

#### Backend (Node.js/Express Server)
- **FR-007**: Add database migrations to support the new profile fields:
  - `occupation` (VARCHAR 100, NULL)
  - `birth_date` (DATE, NULL)
  - `gender` (VARCHAR 20, NULL)
  - `hometown` (VARCHAR 100, NULL)
  - `description` (TEXT, NULL)
- **FR-008**: Update the `User` models and query helpers:
  - In `getUserById` query, add columns `occupation`, `birth_date`, `gender`, `hometown`, `description` to the `SELECT` list.
  - Expose the backend `MAX_BORROW_LIMIT` constant (defined as `5` in library services) by adding a `max_borrow_limit` field to the payload returned by the profile model or controller.
  - In `updateUser` query, add columns `occupation`, `birth_date`, `gender`, `hometown`, `description` to the `UPDATE` list and include them in the `RETURNING` clause.
- **FR-009**: Update the User controllers:
  - In `getProfile` handler, map the database row fields (including the new ones and the `max_borrow_limit` constant) to the JSON response.
  - In `updateProfile` handler, retrieve the new fields from `req.body`, perform necessary sanitization/format verification, and pass them to the update query.
- **FR-010**: Standard field format conversion must take place:
  - Backend snake_case names (`birth_date`, `phone_number`, `max_borrow_limit`) must be mapped to frontend camelCase names (`birthDate`, `phoneNumber`, `maxBorrowLimit`) during JSON parsing/serialization.

---

## Interaction with Prior Specifications

### Spec `020-avatar-upload-profile-enhancements` (FR-010) - *Superseded*
- **Previous Rule**: FR-010 stated that the profile page must NOT contain inputs/edit options/submit actions for biography (`bio` or `description`) or department.
- **Supersession**: The "Description" (bio) textarea field is now officially reinstated and must be added as a separate full-width card block at the bottom of the profile form. The "department" field is replaced by "Occupation" per the new Figma layout.

### Spec `018-page-level-profile-save` - *Preserved*
- **Existing Behavior**: Established page-level save changes and cancel button flow. Forms are dirty-tracked; buttons are disabled until a change is made. Cancel resets fields.
- **Alignment**: This pattern is fully preserved. The new fields (Occupation, Birth Date, Gender, Hometown, Description) must be added to the state objects, and changes in any of these fields must trigger button enablement and be reset properly on Cancel.

### Spec `019-profile-phone-validation` - *Preserved*
- **Existing Behavior**: Validates Phone Number using `/^\d{9,10}$/` when "Save Changes" is clicked. Renders inline error `profile.phone_validation_error` in Tailwind red below the field.
- **Alignment**: This rule is fully preserved. The Phone Number input field must display the validation error below it if the format is invalid.

### Spec `021-avatar-placement-redesign` - *Preserved*
- **Existing Behavior**: Avatar is permanently moved into the left Sidebar, and the main profile page content contains zero avatar uploader or image elements.
- **Alignment**: This layout is fully preserved. No avatar uploader elements, profile headers, or avatars may be added inside the main content page `/profile` form.

---

## Key Entities & Data Schema

### User Model updates
The `users` table will be updated with 5 new fields:

| Column Name | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `occupation` | VARCHAR(100) | NULL | Professional title / role of the user |
| `birth_date` | DATE | NULL | Birth date of the user |
| `gender` | VARCHAR(20) | NULL | Gender identity ('male', 'female', 'other', or NULL) |
| `hometown` | VARCHAR(100) | NULL | Hometown location of the user |
| `description` | TEXT | NULL | Bio/personal description of the user |

### Migration SQL
```sql
-- Add profile fields to the users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS birth_date DATE DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS gender VARCHAR(20) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hometown VARCHAR(100) DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;
```

---

## Success Criteria

### Measurable Outcomes
- **SC-001**: 100% of the main profile page content layout uses responsive flexbox/grid components (e.g. Tailwind `grid-cols-1 md:grid-cols-2`), adapting cleanly to desktop (>1024px), tablet (768px-1024px), and mobile (<768px) viewports with zero horizontal overflow or absolute position overlaps.
- **SC-002**: The borrowing information sidebar widget displays the exact maximum borrowing limit (`5` as configured in the backend) and the user's actual count of borrowed books.
- **SC-003**: The "Save Changes" and "Cancel" buttons accurately track dirty state across all 7 editable fields (Full Name, Phone Number, Occupation, Birth Date, Gender, Hometown, Description).
- **SC-004**: Submitting a phone number that does not match the 9-10 digit regex displays the error message `profile.phone_validation_error` and prevents backend API transmission.
- **SC-005**: All labels, placeholders, and options inside the form and sidebar widget translate instantly when language selection toggles.

---

## Localization Dictionary Updates

Both `en.json` and `vi.json` files must be updated with the new profile layout keys.

### English (`en.json`) keys:
```json
{
  "profile": {
    "profile_details": "Profile Details",
    "personal_information": "Personal Information",
    "general_contact_info": "General & Contact Info",
    "occupation": "Occupation",
    "occupation_placeholder": "Your current role",
    "personal_details": "Personal Details",
    "birth_date": "Birth Date",
    "gender": "Gender",
    "gender_select": "Select gender",
    "gender_male": "Male",
    "gender_female": "Female",
    "gender_other": "Other",
    "hometown": "Hometown",
    "hometown_placeholder": "Enter your hometown",
    "description": "Description",
    "description_placeholder": "Add a brief bio about yourself",
    "borrowing_info": "Borrowing Information",
    "borrowing_limit": "Borrowing Limit:",
    "books_borrowed": "Books Borrowed:"
  }
}
```

### Vietnamese (`vi.json`) keys:
```json
{
  "profile": {
    "profile_details": "Chi tiết hồ sơ",
    "personal_information": "Thông tin cá nhân",
    "general_contact_info": "Thông tin chung & Liên hệ",
    "occupation": "Nghề nghiệp",
    "occupation_placeholder": "Vai trò hiện tại của bạn",
    "personal_details": "Thông tin cá nhân chi tiết",
    "birth_date": "Ngày sinh",
    "gender": "Giới tính",
    "gender_select": "Chọn giới tính",
    "gender_male": "Nam",
    "gender_female": "Nữ",
    "gender_other": "Khác",
    "hometown": "Quê quán",
    "hometown_placeholder": "Nhập quê quán của bạn",
    "description": "Mô tả",
    "description_placeholder": "Thêm một tiểu sử ngắn về bản thân",
    "borrowing_info": "Thông tin mượn sách",
    "borrowing_limit": "Hạn mức mượn:",
    "books_borrowed": "Sách đã mượn:"
  }
}
```

---

## Implementation Plan Outline

### Phase 1: Database & Backend Updates
1. Create a database migration script or query execution mapping to add the 5 new profile fields to the `users` table.
2. Expose the `MAX_BORROW_LIMIT` constant globally or dynamically import it in the user profile retrieval pipeline.
3. Update `user.models.mjs` to fetch and save the new fields (`occupation`, `birth_date`, `gender`, `hometown`, `description`) in `getUserById` and `updateUser`.
4. Update `user.controllers.mjs` to parse/validate the body payload, mapping between camelCase and snake_case formatting on input/output operations.

### Phase 2: Frontend Localization & Widget Setup
1. Add translation keys to `src/client/app/locales/en.json` and `src/client/app/locales/vi.json`.
2. Update the `Sidebar.tsx` layout: add the "Borrowing Information" section widget. Read the borrow limit (`maxBorrowLimit`) and active borrows (`borrowNum`) from the profile/session data. Apply styling matching the Figma mockup, using Tailwind CSS and ensuring support for dark mode.

### Phase 3: Profile Form Redesign
1. Update `profile/page.tsx` states to accommodate the new fields and track changes/validations for all fields.
2. Build the two card structures ("General & Contact Info" and "Personal Details") using grid layouts.
3. Integrate components like the date picker for Birth Date, `CustomSelect` for Gender, and a textarea block for Description.
4. Hook up the page-level Cancel and Save Changes buttons, verifying state comparison (isChanged), Phone Number validation, and success/failure alerts.
5. Perform responsive visual testing and theme checks across all device viewports.
