# Quick Start: Book Wishlist and Dashboard Integration

## Setup Verification

### 1. Database Verification
Ensure the primary database table `user_wishlist` is configured in PostgreSQL:
```sql
SELECT * FROM public.user_wishlist LIMIT 1;
```

### 2. Memgraph Verification
Verify that the Memgraph instance is running and accepts Bolt connections:
- Default connection parameters are configured via environment variables (`MEMGRAPH_URI` / `MEMGRAPH_USER` / `MEMGRAPH_PASSWORD`).

---

## Running the Application

### 1. Run the Backend API
Start the Express server on port `5000`:
```bash
cd server
npm install
npm run dev
```

### 2. Run the Next.js Frontend
Start the Next.js development client on port `3000`:
```bash
cd client
npm install
npm run dev
```

---

## Verifying the Features

### 1. Book Details Page Wishlist Action
1. Log in with a test user possessing the `user` role.
2. Navigate to the catalog and click a book card to open its details page (`/library/[bookId]`).
3. Click the outlined heart icon overlaid on the top-right corner of the cover image.
4. Verify:
   - The icon turns red immediately.
   - A success toast notification is displayed.
   - The PostgreSQL `user_wishlist` table has a new entry matching the user and book.
   - The `[:WISHLISTED]` relationship is created in Memgraph.
5. Click the heart icon again to remove it. Verify it reverts to outlined, notifies removal, and deletes records.

### 2. Dashboard Integration
1. Navigate to `/dashboard/user/recommendations` from the sidebar.
2. Verify:
   - The upper line displays recommendations.
   - The lower line displays "My Wishlist" with a horizontal carousel of the saved books.
   - Clicking a card in the wishlist carousel navigates to that book's detail page.
