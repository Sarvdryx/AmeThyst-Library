### System Specification: Librarian PIN Verification and Book Borrowing Workflow

**1. PIN Verification**
* When the librarian enters a PIN, look up this PIN in the `pin` column of the `borrow_book` table.
* If the PIN is not found, display an error message: "The PIN has expired or does not exist."
* If the PIN exists, proceed to the next step.

**2. Branch Verification**
* Retrieve and compare the librarian's `branch_id` with the `branch_id` associated with the record in the `borrow_book` table.
* If they do not match, display an error message: "You have arrived at the wrong book borrowing branch."
* If they match, proceed to the next step.

**3. Information Display & Action Confirmation**
* Display the primary information within the shell layout (you may replace the `children` component used for PIN verification with this new view, designing the UI layout appropriately).
* **Information to include:**
    * **User Details:** Username, gender, phone number, and email.
    * **Book Details:** Title, author, publisher, genre, and price.
    * *(Design a clean, well-structured UI layout to accommodate all the information above).*
* Place a **Confirm** and a **Cancel** button at the bottom corner of the layout.
* **If the librarian clicks Cancel:**
    * Show a confirmation dialog to verify the cancellation.
    * If confirmed, delete the corresponding row from the `borrow_book` table and increment the book's `quantity` by 1 for that specific branch (you can refer to the existing code logic used when a user cancels a reservation).
* **If the librarian clicks Confirm:** Proceed to the next step.

**4. Status Update & Finalization**
* Update the `status` in the `borrow_book` table to `borrowed`.
* Set the `due_date` column to exactly 14 days from the confirmation date.
* Render this event onto the user's calendar.
* Remove the `expired_reserve` date (Note: `expired_reserve` is a derived attribute calculated by adding 7 days to the `reserve_date` in the `borrow_book` table. Ensure a clear distinction between `due_date` and this date).