# Quickstart: Study Together - Study Group

## Development Setup

1. **Locate Mock Data**:
   The mock data for study groups is located in `client/app/study-together/mockData.ts`. Modify this file to add or remove test groups.

2. **Component Mapping**:
   - **Page**: `client/app/study-together/page.tsx` (Main layout, data fetching/passing)
   - **Organisms**:
     - `StudyGroupGrid.tsx` (Grid layout containing multiple cards)
     - `RequestToJoinModal.tsx` (Popup modal for joining a group)
   - **Molecules**:
     - `StudyGroupCard.tsx` (Individual group item display)
     - `StudyGroupFilter.tsx` (Filtering logic and UI)
     - `StudyGroupSort.tsx` (Sorting logic and UI)

3. **Running the App**:
   From the `client` directory, run:
   ```bash
   npm run dev
   ```
   Navigate to `http://localhost:3000/study-together` to view the page.

4. **Localization**:
   All text must use `t('studyTogether.someKey')`. If adding new text, add the keys to both `client/app/locales/en.json` and `client/app/locales/vi.json`.
