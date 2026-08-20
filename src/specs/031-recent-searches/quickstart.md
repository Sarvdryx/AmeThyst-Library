# Quickstart: Recent Search History for Logged-In Users

## Overview
This guide provides instructions to run and test the Recent Search History feature locally.

---

## 1. Prerequisites
- **Node.js**: >= 18.x
- **Backend Running**: Express server on `http://localhost:5000`
- **Frontend Running**: Next.js client on `http://localhost:3000`
- **PostgreSQL Database**: Table `public.search_history` available

---

## 2. Verification Steps

### Step 1: Log in to User Account
1. Open `http://localhost:3000/login`.
2. Log in with a standard user account.

### Step 2: Perform 6 Searches
1. Go to the Library catalog page (`http://localhost:3000/library`).
2. Submit 6 distinct search queries one by one (e.g., `Python`, `Algorithms`, `Design`, `Physics`, `History`, `AI`).

### Step 3: Check Top 5 Dropdown
1. Clear the search bar and click into the search bar input.
2. Verify that a dropdown appears listing the 5 most recent queries (`AI`, `History`, `Physics`, `Design`, `Algorithms`), while `Python` (the 6th oldest) is omitted.

### Step 4: Click Recent Search Item
1. Click on `Algorithms` in the dropdown.
2. Verify that the search input fills with `Algorithms`, the search results load, and `Algorithms` is now promoted to rank 1.

### Step 5: Verify Guest Behavior
1. Log out of the user account.
2. Click into the search bar as a guest.
3. Verify that no search history dropdown appears.
