# Room Reservation, Check-In, and Check-Out Feature Specification

## 1. Overview
This specification details the end-to-end workflow for room reservations, PIN-based check-ins handled by library staff, user check-outs, and historical record tracking. The mechanism mirrors the existing library book-borrowing workflow to ensure architectural consistency and code reusability.

---

## 2. Database & State Management

### Affected Tables & Fields
* **`reserve_room`**:
  * `pin`: Stores the generated verification PIN.
  * `expired_at`: Timestamp indicating when the PIN expires (set to 3 minutes from creation).
  * `status`: Tracks reservation states (`reserved`, `pending`, `used`).
  * `avail_id`: Foreign key pointing to `room_avail`.
* **`return_room`**:
  * `return_id`: Unique identifier (follows the same generation logic as `return_book`).
  * `reserve_id`: Foreign key referencing `reserve_room`.
  * `checkout_time`: Timestamp of the check-out event.

---

## 3. User Dashboard Workflow

### 3.1. PIN Generation & Status Transitions
* **Location:** User Dashboard → **Room Reservation** tab → Room Card.
* **Action:** The user clicks the **"Create PIN"** button (utilizing the same underlying logic as the book borrowing feature).
* **System Actions:**
  * Generates a verification PIN and saves it to the `pin` field in the `reserve_room` table.
  * Sets the `expired_at` timestamp to **3 minutes** from the time of generation.
  * Updates the reservation `status` to **`pending`**.
* **Timeout Handling:** If the 3-minute window expires without staff verification, a background cleanup mechanism automatically reverts the `status` back to **`reserved`** and clears the PIN data.

### 3.2. Check-Out Process
* **Trigger:** Once the librarian has confirm the checkin, the user room card replaces the "Create PIN" and "Cancel" buttons with a **"Checkout Confirm"** button.
* **Action:** The user clicks **"Checkout Confirm"**.
* **System Actions:**
  * Automatically initializes a new record in the `return_room` table containing:
    * `return_id`: Generated using the standard book return ID format.
    * `reserve_id`: Mapped from `reserve_room`.
    * `checkout_time`: Recorded as the exact timestamp when the user clicked the confirmation button.
  * **Fallback Handling:** If the user fails to click the check-out button, the system defaults `checkout_time` to the `end_time` retrieved from the `room_avail` table (linked via `avail_id` in `reserve_room`).

### 3.3. Reservation History
* **Filtering & Display:** The room reservation history view must support **date-based filtering**.
* **Rendered Information:** Displays all standard data points shown in an "Upcoming" room panel, plus two additional tracking fields:
  * `checkin_time` (sourced from `reserve_room`)
  * `checkout_time` (sourced from `return_room`)

---

## 4. Librarian Dashboard Workflow

### 4.1. PIN Verification & Check-In
* **Location:** Librarian Dashboard → **PIN Verification** section → **Confirm Room Check-in** tab.
* **Action:** The librarian inputs the PIN provided by the user.
* **System Verification:**
  * Queries the `reserve_room` table for rows where `status = 'pending'` and matches the input PIN.
* **Post-Verification Actions (Upon Valid Match):**
  * Records the `checkin_time` in `reserve_room` using the exact timestamp of PIN entry.
  * Clears (nullifies) the values in the `pin` and `expired_at` fields.
  * Updates the reservation `status` to **`used`**.
  * Dynamically updates the user's room card UI to replace the "Create PIN" and "Cancel" buttons with the **"Checkout Confirm"** button.

---

## 5. Implementation & Code Reusability Notes
* **Shared Logic:** The PIN generation, expiration countdown, and automatic cleanup cron/handler must reuse or extend the existing modular codebase established for the book borrowing feature. Ensure utility functions are refactored to support multi-entity handling (books and rooms) to minimize code duplication.