# Quickstart Guide: Librarian Book Management

**Feature**: `028-librarian-book-management`  
**Target Users**: Librarians & System Administrators  

---

## 1. Prerequisites & Environment Setup

Ensure backend and database services are running:
```bash
# 1. Start PostgreSQL and Memgraph (Docker containers)
cd database
docker-compose up -d

# 2. Start Backend Server (Node.js/Express)
cd ../server
npm run dev

# 3. Start Frontend Client (Next.js)
cd ../client
npm run dev
```

---

## 2. Verification Steps

### Step 1: Login as Librarian
1. Open browser at `http://localhost:3000/login`.
2. Login with librarian credentials (`role = 'librarian'` or `'admin'`).
3. Verify access to `/librarian/books` management panel. (Regular users attempting to navigate to this page receive a 403 Forbidden screen).

### Step 2: Catalog a New Book
1. Click **Add New Book**.
2. Upload cover image using device file upload or paste image URL. Verify image preview renders correctly.
3. Fill metadata: Title: `Fahrenheit 451`, ISBN: `9781451673319`, Price: `12.99`, Author: `Ray Bradbury`.
4. Configure stock: Branch 1 quantity `10`, shelf input `104`.
5. Submit form.
6. **Verify Result**:
   - Bookshelf code generated as `F104` (initial `F` from `Fahrenheit`).
   - Book catalog row created in `public.books` and stock row in `public.library`.
   - Vector embedding computed.
   - Sync executed to Memgraph.

### Step 3: Test Uniqueness Check
1. Attempt to add another book with the same ISBN `9781451673319`.
2. **Verify Result**: Form blocks submission and displays error: *"ISBN 9781451673319 already exists in catalog."*

### Step 4: Test Bookshelf Prefix Rule for Special / Non-English Titles
1. Catalog a book titled `1984` or `Áo Dài`.
2. Input shelf number `55`.
3. **Verify Result**: Bookshelf code generated as `X55`.

### Step 5: Test Book Update & Removal Guard
1. Select an existing book. Edit description and save. Verify DB update.
2. Attempt to delete a book with active borrowings in `borrow_book`. Verify deletion is blocked with a user-friendly safeguard error.
