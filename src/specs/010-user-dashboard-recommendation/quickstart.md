# Quickstart

This document provides a brief overview of how to implement the User Dashboard Recommendation Page.

## Adding the Page

1. Create the new directory structure: `client/app/dashboard/user/recommendations/`.
2. Add a `page.tsx` file inside this directory.
3. Import the `RecommendationCarousel` component.
4. Implement the data fetching logic to retrieve recommended books from the backend API (for "Based on your reading history" and "Trending this week").
5. Manage loading and error states during data fetching.
6. Render two instances of `RecommendationCarousel` passing the fetched data.
7. Ensure i18n keys are added to `en.json` and `vi.json` for the page titles and section headers.
