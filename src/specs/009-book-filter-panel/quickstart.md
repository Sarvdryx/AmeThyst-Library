# Quickstart Guide: Book Filter Panel

**Feature**: Book Filter Panel | **Date**: 2026-06-22

This guide outlines how to boot up both client and server applications, test the book filter API endpoint, and check frontend visual changes locally.

## Prerequisite Services
Ensure the PostgreSQL database docker containers are running:
```bash
# In the database/ directory
docker-compose up -d
```

## Running the Application Locally

### 1. Start the Backend API Server
1. Navigate to the `server/` directory.
2. Ensure you have configured the port and credentials in `server/.env`.
3. Start the dev server:
   ```bash
   npm install
   npm run dev
   ```
   The backend server should run on `http://localhost:5000`.

### 2. Start the Frontend Client
1. Navigate to the `client/` directory.
2. Build/run the Next.js development server:
   ```bash
   npm install
   npm run dev
   ```
   The Next.js client should boot on `http://localhost:3000`.

---

## Verifying Features via HTTP Requests

### Verify Filtering API
You can run `curl` commands to hit the backend directly and test the filtering logic:

```bash
# 1. Fetch available books in Mathematics and Physics
curl "http://localhost:5000/api/library/books?genres=Mathematics,Physics&availableOnly=true"

# 2. Fetch books published between 2010 and 2020 at branch 1
curl "http://localhost:5000/api/library/books?startYear=2010&endYear=2020&branches=1"

# 3. Fetch books under fallback genre "Others"
curl "http://localhost:5000/api/library/books?genres=Others"
```

## Running Frontend Component Verification
Open browser at `http://localhost:3000/library`.
1. Verify the "Filter" button toggles a side drawer panel.
2. Check that closing the panel via close icon or screen backdrop backdrop functions correctly.
3. Test combinations of genre selections, availability toggle, branch campus checkboxes, and years input to confirm correct books are rendered in real-time.
