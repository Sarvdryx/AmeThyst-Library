# Quickstart: Bookshelf Frontend UI Validation

## Prerequisites
- Node.js installed.
- Dependencies installed: `npm install` in `client/` directory.

## Setup & Run
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open browser to `http://localhost:3000`.

## Validation Scenarios

### Scenario 1: Vertical Layout Check
- **Action**: Scroll from top to bottom.
- **Expectation**: Components appear in this order: Navbar -> Hero -> SearchBar -> PopularPublishes -> StudyGroup -> Footer.

### Scenario 2: Responsive Grid Test
- **Action**: Open DevTools, switch to Mobile view (iPhone SE).
- **Expectation**: 
  - Book grid in "Popular Publishes" should stack to 1 or 2 columns.
  - Study Group cards should stack to 1 column.
  - No horizontal scroll bar should appear.

### Scenario 3: Branding Consistency
- **Action**: Inspect elements for colors and fonts.
- **Expectation**:
  - Background is `#F8EFE6`.
  - Main text is `#091426`.
  - Buttons use `#006F66` or `#091426`.
  - Fonts are Inter/Manrope/Open Sans.
