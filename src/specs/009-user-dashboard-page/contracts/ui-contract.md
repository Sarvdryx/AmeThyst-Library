# UI Contract: User Dashboard Page

## Page Route

`/dashboard/user` → `client/app/dashboard/user/page.tsx`

## Component Hierarchy & Props

### 1. Toast (Atom)
**Props**:
- `message`: string — text to display
- `type`: `'info'` | `'error'` | `'warning'` | `'success'` — visual style
- `onDismiss`: () => void — callback when dismissed
- `duration?`: number — auto-dismiss ms (default 4000)

**Behavior**: Fixed top-center position, slide-in animation, auto-dismiss.

---

### 2. DashboardCalendar (Molecule)
**Props**:
- `events`: Array<{ date: string, type: string, title: string }> — events for current month
- `onMonthChange`: (month: number, year: number) => void — callback when navigating months
- `view`: `'month'` | `'week'` | `'day'` — current view mode
- `onViewChange`: (view: string) => void — view toggle callback

**Internal State**:
- `viewDate`: Date — the currently displayed month/year
- `today`: Date — reference to today for highlighting

**Composition**:
- Header: month/year label + left/right arrow buttons + Month/Week/Day toggle
- Day headers row: MON TUE WED THU FRI SAT SUN
- Grid: 6 rows × 7 columns of day cells
- Event indicators: colored dots/labels on cells with events
- Legend: colored circles matching event types below the grid

**Calendar Legend Colors**:
| Type | Color |
|------|-------|
| Book return | `#061D32` (dark navy) |
| Room reservation | `#009484` (teal) |
| Study group | `#6E5191` (purple) |
| PIN expiry | `#BA1A1A` (red) |
| Personal task | dashed border style |

---

### 3. DashboardSidebar (Organism)
**Props**: None (reads user data from localStorage via `getLoggedInUser()`)
**Composition**:
- "USER" branding label at top
- Navigation items: Profile, Borrowed Books, Your Study Groups, Room Reservations, Loan & Fees, Recommended Books
- Each item: icon (SVG) + label
- Active item highlighting based on current route

---

### 4. UpcomingAgenda (Organism)
**Props**:
- `today`: Array<{ title, time, location, type }> — today's events
- `tomorrow`: Array<{ title, time, location, type }> — tomorrow's events
- `onAddTask`: () => void — callback for "Add Personal Task" button
- `isLoading`: boolean

**Composition**:
- "UPCOMING AGENDA" header
- "Today" section with separator line
- Event rows: time column + color indicator dot + title + location
- "Tomorrow" section with separator line
- "Add Personal Task" dashed-border button at bottom

---

### 5. UserDashboardTemplate (Template)
**Composition**:
- `DashboardSidebar` (left, fixed width 260px)
- `DashboardCalendar` (center, main content area)
- `UpcomingAgenda` (right, fixed width 331px)

**Layout**: CSS Grid or Flexbox with three columns matching the UI_des.txt proportions.

---

## Visual Standards

- **Sidebar width**: 260px
- **Calendar min-width**: 710px
- **Agenda width**: 331px
- **Content padding**: `p-16` (64px) around main area
- **Container background**: `bg-[#F8EFE6]` (warm cream) → Tailwind: `bg-amber-50`
- **Card backgrounds**: white rounded-xl shadow
- **Typography**: Inter (headings), Manrope (body), Hanken Grotesk (sidebar)

## Layout Structure

| Region | Component | Notes |
|--------|-----------|-------|
| Top | NavBar | Existing — shared across pages |
| Left sidebar | DashboardSidebar | Fixed 260px, below NavBar |
| Center top | Welcome greeting | "WELCOME BACK, {name}!" heading |
| Center bottom | DashboardCalendar | Calendar with event overlays |
| Right | UpcomingAgenda | Fixed 331px, event list |
| Bottom | Footer | Existing — shared across pages |
