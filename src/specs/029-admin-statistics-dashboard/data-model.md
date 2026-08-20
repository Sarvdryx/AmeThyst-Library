# Data Model & Schema Specification: Admin Statistics Dashboard

## Overview
This document defines the analytical data models, API payloads, entities, and backend query structures supporting the Admin Statistics Dashboard.

## Data Entities

### 1. Summary Metrics (`SummaryMetrics`)
Represents executive KPI metrics aggregated over a specified timeframe (`week` or `month`) and branch filter (`all` or specific `branch_id`).

| Field | Type | Description |
|-------|------|-------------|
| `total_users` | Integer | Count of all registered library users |
| `users_growth_pct` | Float | Percentage change in user registration vs. previous period |
| `active_borrows` | Integer | Count of currently active book borrowings |
| `total_borrows` | Integer | Total count of book borrowings initiated within period |
| `overdue_books_count` | Integer | Count of books overdue for return (Alert metric) |
| `total_late_fees` | Decimal | Total amount of late fees collected (VND / currency unit) |

### 2. Category Borrow Turn (`CategoryBorrowTurn`)
Represents a ranked book category item for the top 10 categories bar chart visualization.

| Field | Type | Description |
|-------|------|-------------|
| `rank` | Integer | Rank position (1 to 10) |
| `category_id` | String | Unique identifier of the category |
| `category_name` | String | Display name of the book category |
| `borrow_turns` | Integer | Total borrow turns for books in this category during period |
| `percentage_share` | Float | Percentage share of total borrowing volume |

### 3. Top Borrowed Book (`TopBorrowedBook`)
Represents top-ranked borrowed books.

| Field | Type | Description |
|-------|------|-------------|
| `rank` | Integer | Rank position |
| `book_id` | String | Unique identifier of the book |
| `title` | String | Book title |
| `cover_url` | String | URL of the book cover image |
| `borrow_count` | Integer | Total borrow count in timeframe |
| `popularity_pct` | Float | Relative popularity percentage bar length (0-100%) |

### 4. Top Reserved Room Branch Turn (`TopReservedRoomBranch`)
Represents top reserved study rooms along with exact turn counts per branch location.

| Field | Type | Description |
|-------|------|-------------|
| `room_id` | String | Unique room identifier |
| `room_name` | String | Name of the study room |
| `branch_id` | String | Branch identifier |
| `branch_name` | String | Name of the branch location |
| `reservation_turns` | Integer | Total completed reservation turns |

---

## API Data Contract

### Response Payload Schema (`GET /api/admin/statistics`)

```json
{
  "status": "success",
  "data": {
    "filter": {
      "timeframe": "week",
      "branch_id": "all"
    },
    "summaryMetrics": {
      "totalUsers": 1250,
      "usersGrowthPct": 8.5,
      "activeBorrows": 342,
      "totalBorrows": 890,
      "overdueBooksCount": 18,
      "totalLateFees": 450000.00
    },
    "topCategories": [
      {
        "rank": 1,
        "categoryId": "cat-01",
        "categoryName": "Computer Science",
        "borrowTurns": 245,
        "percentageShare": 27.5
      },
      {
        "rank": 2,
        "categoryId": "cat-02",
        "categoryName": "Literature & Fiction",
        "borrowTurns": 180,
        "percentageShare": 20.2
      }
    ],
    "topBooks": [
      {
        "rank": 1,
        "bookId": "b-101",
        "title": "Architecture of Thought",
        "coverUrl": "/images/books/architecture.jpg",
        "borrowCount": 92,
        "popularityPct": 92.0
      }
    ],
    "topRoomsByBranch": [
      {
        "roomId": "rm-201",
        "roomName": "Quiet Study Room A",
        "branchId": "br-main",
        "branchName": "Main Branch",
        "reservationTurns": 64
      }
    ]
  }
}
```
