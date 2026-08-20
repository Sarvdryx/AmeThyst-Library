# Quickstart Guide: Profile Details Redesign

This guide provides steps for setting up, running, and testing the redesigned profile form details and sidebar borrowing information widget.

## 1. Prerequisites & Setup

Verify that the local environment has been configured:
- **Database**: PostgreSQL is running and has the `users` table with `occupation`, `birth_date`, `gender`, `hometown`, and `description` columns.
- **Backend**: Express server running on port `5000`.
- **Frontend**: Next.js client running on port `3000`.

To install dependencies on client/server:
```bash
# In src/server:
cd src/server
npm install

# In src/client:
cd src/client
npm install
```

---

## 2. Running the System

Start the development servers:

### A. Run Express Backend
```bash
cd src/server
npm run dev
```
Verify that the database connection initiates successfully.

### B. Run Next.js Frontend
```bash
cd src/client
npm run dev
```
Navigate to `http://localhost:3000` in your web browser.

---

## 3. Testing & Verification

Navigate to the Profile page `/profile` (after signing in).

### A. Form Details Redesign Verification
1. Verify that the page main layout contains exactly three sections using the `ProfileSectionCard` molecule:
   - **General & Contact Info**
   - **Personal Details**
   - **Description**
2. Confirm that there are **no** avatar image or uploader elements rendered inside these cards (retaining feature 021).
3. Try typing inside fields (Full Name, Phone Number, Occupation, Birth Date, Gender, Hometown, Description).
4. Verify that the "Save Changes" and "Cancel" buttons at the bottom right remain disabled until at least one input differs from its original value.
5. Click **Cancel** with dirty inputs. Verify that all fields immediately revert to their database-saved values and the buttons disable.

### B. Input Validation Verification
1. Modify the **Full Name** field to be empty, and click "Save Changes". Verify that it blocks and displays a validation alert.
2. Modify the **Phone Number** field to an invalid format (e.g. `12345` or `abcdef`), and click "Save Changes".
3. Verify that the save is blocked, and an inline error displaying `profile.phone_validation_error` appears in red below the phone input field.
4. Correct the phone number to a valid 9 or 10 digit value (e.g., `0987654321`) and click "Save Changes". Verify that the save succeeds, a success banner appears, and the buttons disable.

### C. Sidebar Borrowing Widget Verification
1. Check the Left Sidebar panel.
2. Confirm that a "Borrowing Information" section is visible above the logout button.
3. Verify that the **Borrowing Limit** row displays `5` (matching the backend constant `MAX_BORROW_LIMIT`).
4. Verify that the **Books Borrowed** row displays the user's current number of active borrows (e.g., `0` or `2`).

### D. Localization & Theme Verification
1. Toggle the application language in the navbar (English <-> Vietnamese). Verify that all form labels, placeholders, dropdown gender values, and the sidebar borrowing widget translate instantly.
2. Toggle Dark/Light mode in the navbar. Verify that card backgrounds, borders, inputs, text colors, and the select dropdown adapt correctly to light/dark system tokens.
