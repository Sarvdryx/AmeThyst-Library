# Research: Admin Statistics Dashboard Tab

## Overview
This document records key technical decisions, architectural research, and design choices for implementing the Admin Statistics Dashboard feature.

## Decisions & Rationale

### 1. Visualization & Charting Strategy
- **Decision**: Implement the Top 10 Categories Borrow Turns Bar Chart using clean SVG / CSS component bars matching the exact design tokens, typography, radii, and shadows from `style1_statistic.css` and `style2_statistic.css` (or Chart.js/Recharts wrapped with custom design tokens).
- **Rationale**: Direct alignment with the project's atomic design system and CSS files avoids external styling bloat while providing full control over hover tooltips, light/dark mode tokens, and i18n translation strings.
- **Alternatives Considered**: Generic third-party chart themes without custom token integration (rejected due to styling inconsistency with `style1_statistic.css` and `style2_statistic.css`).

### 2. Backend Aggregation & Endpoint Design
- **Decision**: Expose a unified API endpoint `GET /api/admin/statistics?timeframe=week|month&branch_id=...` handled by `statistics.controllers.mjs` and `statistics.services.mjs`.
- **Rationale**: Fetching summary KPIs (total users, active/total borrows, overdue books count, total late fees), top 10 categories bar chart data, top borrowed books list, and top reserved rooms per branch in a single JSON payload eliminates network waterfall delays and guarantees UI synchronization across tabs.
- **Alternatives Considered**: Multiple separate endpoint calls for each KPI card and chart (rejected due to increased network latency and potential partial rendering states).

### 3. Database Query Architecture
- **Decision**: Utilize PostgreSQL SQL aggregations (`COUNT`, `SUM`, `GROUP BY`, `ORDER BY ... DESC LIMIT 10`) operating directly against existing schema tables (`users`, `borrowing_records`, `books`, `categories`, `room_reservations`, `branches`).
- **Rationale**: PostgreSQL handles time window filtering (`DATE_TRUNC('week', ...)` / `DATE_TRUNC('month', ...)`) efficiently. Indexes on date fields and branch IDs ensure sub-second query latency.
- **Alternatives Considered**: In-memory JavaScript array filtering in Node.js (rejected for scale and performance reasons).

### 4. Localization & Theme Persistence
- **Decision**: Integrate all UI labels, KPI titles, table column headers, and chart tooltip keys into global dictionaries (`en.json` and `vi.json`). Use CSS variables and framework dark mode utilities for color adaptation.
- **Rationale**: Strictly complies with Constitution Principle IX (Global Feature Requirements: Light/Dark Mode & Localization).
