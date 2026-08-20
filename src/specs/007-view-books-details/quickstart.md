# Quickstart: View Book Details Validation

This guide provides scenarios to validate the "View Book Details" feature end-to-end.

## Prerequisites
- **Backend**: Running on `http://localhost:5000`
- **Frontend**: Running on `http://localhost:3000`
- **Environment**: `.env.local` must have `NEXT_PUBLIC_API_URL=http://localhost:5000`

## Validation Scenarios

### Scenario 1: Load Book Details (Happy Path)
1. **Action**: Open browser and navigate to `http://localhost:3000/library/1`.
2. **Expectation**: 
    - Page displays the book cover "Rectangle1270.png".
    - Heading shows "Harry Potter and the Deathly Hallows".
    - Info Grid correctly displays Floor 3, East Wing, and Shelf AR-204.
    - "Available" status badge is visible with "2 Copies Remaining".

### Scenario 2: Reserve for Pickup
1. **Action**: Click the "Reserve for Pickup" button.
2. **Expectation**:
    - Button enters a loading state.
    - Upon success, a confirmation toast appears.
    - Available copies count updates to "1 Copy Remaining".
    - "Reserve" button updates to "Reserved" or displays a success indicator.

### Scenario 3: Recommendation Carousel
1. **Action**: Scroll to the "You May Also Like" section.
2. **Expectation**:
    - At least 4-5 book cards are visible.
    - Each card displays a title, author, and category.
    - Navigation arrows scroll the carousel horizontally.

### Scenario 4: Responsive View (Mobile)
1. **Action**: Toggle browser DevTools to mobile view (e.g., iPhone 14).
2. **Expectation**:
    - Book cover image stacks on top of the details.
    - Info Grid adjusts to a single column or 2x2 grid.
    - Global NavBar collapses into a hamburger menu.

## Manual Test Verification
- [ ] UI colors match hex `#F8EFE6` (background) and `#091426` (text).
- [ ] No absolute positioning used in the final implementation.
- [ ] Images are optimized via Next.js `<Image>`.
