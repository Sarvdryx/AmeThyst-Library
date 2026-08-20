# Validation Guide: Theme and Localization Toggles

This guide provides end-to-end scenarios to validate that global theme toggling and translation switching work as specified.

## Prerequisites
* Install client dependencies: `npm install` in `client/`
* Start the Next.js development server: `npm run dev` in `client/`

---

## Scenario 1: Initial Theme Resolution (System Preference)
1. Set operating system theme preference to **Dark Mode**.
2. Clear browser LocalStorage or open in Incognito.
3. Open `http://localhost:3000` in the browser.
4. **Expected Result**: Page renders in dark mode theme immediately. No layout flicker or flash.

---

## Scenario 2: Theme Persistence and Transition
1. Click the theme toggle button (shows Sun icon in dark mode).
2. **Expected Result**: Theme transitions smoothly to Light Mode with a CSS transition. Toggle icon changes to Moon.
3. Reload page.
4. **Expected Result**: Page loads directly in Light Mode (reads from LocalStorage).

---

## Scenario 3: Instant Language Toggle
1. Hover over the language toggle (Globe/Text icon).
2. **Expected Result**: Tooltip is displayed in active language.
3. Click the language toggle button.
4. **Expected Result**: All user-facing strings (e.g. Navbar links "Library" -> "Thư viện") translate instantly without page reload. Tooltip updates to reflect alternative language action.
5. Reload page.
6. **Expected Result**: Selected language remains active.

---

## Scenario 4: Automated Key Synchronization Verification
1. Add a dummy key `test_key` to `client/app/locales/en.json` (e.g., `"test_key": "Test Value"`).
2. Run the synchronization script:
   ```bash
   node client/scripts/sync-locales.mjs
   ```
3. Open `client/app/locales/vi.json`.
4. **Expected Result**: The `test_key` is present in `vi.json` with the temporary value `"Test Value"`.
