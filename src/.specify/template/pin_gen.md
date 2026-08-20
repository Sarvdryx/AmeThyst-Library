# Technical Specification: PIN Generation Workflow for Book Pickup

This document specifies the implementation requirements for the PIN generation feature within the book reservation system.

---

## 1. Frontend Requirements (UI/UX)

### 1.1 PIN Generation Button
* **Location:** Located inside each individual book card within the **"Currently Borrowing"** tab.
* **Trigger:** When clicked, it initiates the PIN generation request to the server.
* **Status Update:** Upon successful generation, the reservation status changes to **`pending`**.

### 1.2 PIN Display Modal/Window
* When the PIN is generated, a modal window pops up to display:
  * The generated **6-digit PIN**.
  * A **countdown timer** showing the remaining time before expiration.
* **Persistence:** Users can close/click outside the modal window and click the button again to re-view the active PIN and its ongoing countdown.

---

## 2. Database Schema Updates

The `borrow_book` table must support the following two fields to store the PIN data:

* **`pin`**: `CHARACTER` type. Stores the unique 6-digit random string. **Must allow `NULL`**.
* **`expired_at`**: `TIMESTAMP` type. Stores the exact date and time when the PIN becomes invalid. **Must allow `NULL`**.

---

## 3. Backend & Business Logic

### 3.1 PIN Generation Rules
* **Format:** Must be a randomly generated 6-digit number.
* **Uniqueness:** The generated PIN must be unique within the active database records.
* **Expiration Time:** The `expired_at` timestamp must be set to exactly **5 minutes** from the moment the user clicks the generation button.

### 3.2 Automated Cleanup Mechanism
The server must automatically clear expired PIN data from the database in the following two scenarios:

1. **Periodic Cleanup:** Automatically delete the PIN after its 5-minute lifespan has elapsed.
2. **Server Startup Cleanup:** Automatically clear all existing PIN data immediately upon server boot up. This ensures that any leftover, uncleaned PINs from a sudden mid-operation server crash are thoroughly flushed.

---

## 4. Non-Breaking & Data Isolation Rules

### 4.1 Backward Compatibility
* **No modification to existing workflows:** All current APIs, triggers, or existing borrowing/return logic must remain completely untouched. The PIN feature is designed purely as an add-on layer that runs concurrently and interacts solely via the `pending` status.
* **Database Migration:** When adding the two new fields (`pin` and `expired_at`) to the `borrow_book` table, they must be configured as **`ALLOW NULL`**. This prevents any existing records or parallel borrowing processes that do not utilize PINs from crashing.

### 4.2 Timeline Differentiation
The system must clearly distinguish between three independent time markers within the `borrow_book` table:

| Column Name | Data Type | Business Logic & Description | Impact on PIN Expiration / Cleanup |
| :--- | :--- | :--- | :--- |
| **`expired_at`** *(New)* | `TIMESTAMP` | **PIN Expiration (5 minutes):** Restricts the valid window for physical pickup verification at the counter. | Data is completely cleared (set to `NULL`). The reservation status reverts to `reserved`. |
| **`reserve_date` + 7 days** *(Existing)* | `TIMESTAMP` / `DATE` | **Pickup Window Deadline (7 days):** Specifies the time limit for the user to pick up the book before the reservation is automatically cancelled. | **No impact.** The 7-day countdown process runs independently in the background. |
| **`due_date`** *(Future feature)* | `TIMESTAMP` / `DATE` | **Return Deadline:** Specifies the time limit for the user to hold the physical book after a successful checkout. | **No impact.** (Inactive during this implementation phase). |

---

## 5. Summary of Workflow States

| Trigger Action | Status Field | `pin` / `expired_at` Fields | UI Component Behaviour |
| :--- | :--- | :--- | :--- |
| Click "View PIN" | Changes to **`pending`** | Populated with a unique 6-digit string & Current Time + 5 mins | Opens a modal displaying the PIN and a 5-minute countdown. Allows closing and reopening to persist tracking. |
| **5-Minute Timeout / Server Restart** | **Reverts to `reserved`** | **Cleared / Set to `NULL`** | PIN expires; data is automatically cleaned up by the server. The modal informs the user of expiration, and the trigger button resets to its original state. |