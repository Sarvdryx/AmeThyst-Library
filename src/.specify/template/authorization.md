# SYSTEM REQUIREMENT PROMPT: AUTHORIZATION & ROLE MANAGEMENT MODULE

## 1. Overview & Objectives
Build a dedicated **Authorization & Role Management** module on authorization tab of admin dashboard for the Library System with 3 isolated roles: `USER`, `LIBRARIAN`, and `ADMIN`.

Key Objectives:
- Execute account promotions and demotions safely following strict business rules.
- Guarantee immediate access control termination (Token Invalidation) upon role changes.
- Enforce strict security guardrails regarding `ADMIN` accounts.
- Audit every authorization modification inside the `authorized_history` table (read init_rest.sql).
- Deliver an intuitive Admin Dashboard UI, featuring a real-time Authorization History log.
- Before make any change to the role, verify that the status value on user table is active

---

## 2. Business Logic & Authorization Rules

### A. User Management (Promoting USER -> LIBRARIAN / ADMIN)
- **Pre-check Guard:**
  - Verify if the `USER` currently has unreturned books or outstanding overdue fines.
  - If pending liabilities exist $\rightarrow$ Block the action and return an explicit error message.
  - If clear $\rightarrow$ Proceed with promotion to `LIBRARIAN` or `ADMIN`.

### B. Librarian Management (Demoting LIBRARIAN -> USER)
- **Session/Token Invalidation:**
  - Immediately invalidate (blacklist/revoke) all active Access Tokens, Refresh Tokens, and JWTs associated with the demoted Librarian.
  - Update the account role to `USER`.
  - Force the user to re-authenticate to issue a new token with restricted permissions.

### C. Admin Management (Adding / Demoting ADMIN)
1. **Adding an Admin:**
   - *Option 1:* Promote an existing `USER` or `LIBRARIAN`.
   - *Option 2:* Direct Email Invite $\rightarrow$ The system creates a new account, generates a **Temporary Password**, and emails it so the new Admin can log in and update their password.
2. **Demoting / Removing an Admin:**
   - Change the Admin's role down to `LIBRARIAN` or `USER`.
   - Revoke active Tokens/Sessions immediately to strictly block access to all Admin-only endpoints.

### D. Critical Security Guardrails (Mandatory Enforcement)
1. **Self-Action Restriction:** An active Admin **CANNOT** demote, delete, or modify their own role.
2. **Last Admin Protection:** Check active Admin capacity (`COUNT(role = 'admin')`). If the count is $\le 1$, **BLOCK** any attempt to demote the sole remaining Admin.
3. **Re-Authentication (Sudo Mode):** Require the acting Admin to **re-enter their current password** before executing high-risk actions: Creating a new Admin or Demoting an existing Admin.

---