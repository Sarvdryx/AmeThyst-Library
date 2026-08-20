# Quickstart Guide: Admin Statistics Dashboard

## Overview
This guide provides instructions for setting up, running, testing, and verifying the Admin Statistics Dashboard tab feature locally.

## Prerequisites
- Node.js installed
- PostgreSQL database running with initial schema from `database/init_db/postgres`
- Environment setup:
  - Frontend: `client/.env.local` configured with `NEXT_PUBLIC_API_URL=http://localhost:5000`
  - Backend: `server/.env` configured with `PORT=5000` and database connection string

## Local Development & Execution Steps

### 1. Start the Backend API Server
Navigate to the `server/` directory and start the Node.js Express server:
```bash
cd server
npm run dev
```
Verify the server starts on `http://localhost:5000`.

### 2. Start the Next.js Frontend App
In a separate terminal, navigate to the `client/` directory and start the Next.js development server:
```bash
cd client
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Verification Workflow

1. **Log in as Administrator**: Access the Admin Dashboard section.
2. **Navigate to Statistics Tab**: Select the "Statistics" tab from the side navigation bar.
3. **Verify Key Metric Cards**:
   - Check that Total Users, Active/Total Book Borrows, Overdue Books (styled in red alert highlight), and Total Late Fees load with valid numbers.
4. **Test Filter Toggles**:
   - Toggle between **This Week** and **This Month**. Confirm that summary figures, Top 10 Categories bar chart, and top rankings refresh seamlessly.
   - Change the **Branch Filter** dropdown to a specific branch location. Verify that top reserved rooms and branch turn metrics update accordingly.
5. **Verify Top 10 Categories Bar Chart**:
   - Confirm that the bar chart displays up to 10 top book categories ranked by borrow turns.
   - Hover over bars to test tooltip interactivity.
6. **Verify Light/Dark Mode & Localization**:
   - Switch system theme between Light and Dark mode to confirm readable colors and contrast.
   - Switch language between English and Vietnamese to verify dictionary translations.
