# Software Design Description (SDD) - Librarian Dashboard Interface

## 1. Document Overview
This Software Design Description (SDD) specifies the User Interface (UI) requirements and layout modifications for transitioning the existing User Dashboard into the new **Librarian Dashboard**. 

This document strictly focuses on the Frontend / UI layout, component hierarchy, visual interactions, and state flows. Backend integrations and API specifications will be designed in a subsequent phase.

---

## 2. Global Architecture & Layout Modifications
The Librarian Dashboard inherits the structural layout of the existing User Dashboard with the following mandatory modifications:

### 2.1 Navigation Sidebar Changes
* **Header Transition:** The existing header text/branding atop the side tab area must be changed to **"Librarian Dashboard"** (or simply **"Librarian"**).
* **Menu Item Replacement:** All previous user-facing side tabs are replaced by the following two primary views:
    1.  **Calendar View:** For tracking loan timelines, reservation dates, and deadliness.
    2.  **Book Loan Confirmation (Xác nhận mượn sách):** The active workflow interface for processing live borrowings via user PIN validation.
* *Note:* Placeholder zones must be maintained for future librarian-specific tabs (e.g., Inventory Management, Analytics), which will be implemented in later stages.

---

## 3. Detailed Interface Specifications

### 3.1 Tab 1: Calendar View
* **Purpose:** Provides a high-level scheduling overlay for upcoming pick-ups, overdue returns, and library events.
* **UI Components:**
    * Standard monthly/weekly toggleable calendar grid.
    * Color-coded event blocks (e.g., Green = Planned Pick-up, Red = Overdue Return Deadline).
    * Quick-view side panel showing event summaries upon clicking a date slot.

### 3.2 Tab 2: Book Loan Confirmation (Xác nhận mượn sách)
This tab houses the workflow for validating and processing immediate physical book check-outs using an automated verification flow.

#### 3.2.1 Core Page Canvas
* A clean workspace featuring an explicit action trigger button: **"Open Confirmation Modal"** (or an inline entry layout that maps directly to the verification system).

#### 3.2.2 Verification Modal Design (The Core Workflow)
When the checkout sequence is initialized, an overlaid modal screen locks focus. The layout structure inside this modal is organized hierarchically as follows:

```
+-------------------------------------------------------------+
| CONFIRM BOOK LOAN                                        [X]|
+-------------------------------------------------------------+
| Enter PIN provided by user:                                 |
| [  •  ] [  •  ] [  •  ] [  •  ] [  •  ] [  •  ]   ( Search ) |
|                                                             |
| ----------------------------------------------------------- |
| LOAN ORDER DETAILS:                                         |
|                                                             |
|  BORROWER PROFILE                REGISTERED BOOKS (2)       |
|  Nguyen Nhut Huy                1. Data Structures & Algos  |
|  ID: 2212XXXX                      Book Code: KHMT-012      |
|  Dept: Computer Science          2. Intro to AI             |
|  Status: [ Eligible ]              Book Code: KHMT-099      |
|                                                             |
+-------------------------------------------------------------+
|                                  ( Cancel ) [ CONFIRM (F8) ]|
+-------------------------------------------------------------+
```

##### A. Header Section
* **Title Text:** "Confirm Book Loan" / "Xác nhận mượn sách"
* **Dismissal UI:** An explicit `[X]` close icon positioned in the upper right quadrant.

##### B. Body Content (Bi-Phasic State Architecture)
The body modifies its presentation based on whether a valid PIN state exists.
* **Phase 1: Input State (Active Focus)**
    * **OTP-Style PIN Field:** Formatted as 6 discrete, isolated individual digit character blocks. 
    * **Behavior:** Auto-focus triggers natively inside the first slot immediately upon modal display. Characters mask securely as typed values populate.
    * **Trigger Button:** A adjacent "Search / Verify" text button to initiate manual submission if automatic sequence evaluation is bypassed.
* **Phase 2: Data Overlay State (Post-Validation)**
    Upon successful validation simulation, a dual-column flex-grid layout reveals structural information below the input section:
    * **Column 1: Borrower Profile (Độc giả)**
        * Full Name (Rendered with strong, emphasized typographical weight).
        * Student/Library ID Number.
        * Department/Faculty Designation.
        * *Account Health Tag:* A colored badge showcasing status (e.g., Emerald-Green for `[ Eligible ]`, Crimson-Red for `[ Overdue Violations / Suspended ]`).
    * **Column 2: Registered Book Assets**
        * Scrollable list stack displaying book entries mapped to the pending order.
        * Each item card yields: Small thumbnail image cover placeholder, Book Title, Author Name, and unique asset ID (ISBN/Barcode string).

##### C. Footer Action Row
* **Cancel Button:** Low-emphasis flat gray border option to terminate the transaction safely.
* **Confirm Button:** High-contrast accent color (System Green/Blue primary theme) block labeled **"Confirm Loan"**.

---

## 4. UI Interaction & Frontend UX Behaviors

To ensure high-throughput operational productivity for librarians, the interface enforces strict interactive logic:

* **Keyboard Accelerator Mapping (Shortcuts):**
    * `Escape (Esc)`: Instantly closes the modal canvas from any active sub-state.
    * `Enter`: Validates the complete PIN from the input phase to transition into the data view.
    * `F8` or `Ctrl + Enter`: Triggers the final action handler tied to the **"Confirm Loan"** command.
* **Validation Visual Cueing:**
    * If an input simulation fails (incorrect/expired PIN format), the 6 input boxes outline transitions into high-alert red borders backed by inline error text: *"Invalid or expired verification PIN code."*
* **State Micro-interactions:**
    * While transitioning states, the profile details region renders a simulated pulsing content skeleton framework rather than hard freezing the interface.
    * Upon successful confirmation click, the modal exits smoothly, firing a non-blocking floating **Toast Notification** at the viewport corner: *"Successfully confirmed book loan order for borrower: Nguyen Nhut Huy"*.
