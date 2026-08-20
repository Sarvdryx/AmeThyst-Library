<!--
SYNC IMPACT REPORT
- Version change: 1.0.0 -> 1.1.0
- List of modified principles: None
- Added sections: Core Principle IX: Global Feature Requirements (Light/Dark Mode & Localization)
- Removed sections: None
- Templates requiring updates: None (Templates checked for alignment, no generic template changes required)
- Follow-up TODOs: None
-->

# Digital Library Project Constitution

## Core Principles

### I. Component-Driven & Reusability
All UI components must be built with an Atomic Design mindset. Components such as Buttons, Inputs, Cards, and Modals must be self-contained, receive data via `props`, possess a clear structure, and be highly reusable across different pages.

**MANDATORY UI/UX DESIGN FLOW:** All new UI/UX development must strictly comply with the Atomic Design system (do not create new folder, there is already existing folder lying in client/app/components). The design process must follow a mandated, bottom-up flow: 
1. **Atoms** (Basic indivisible elements) 
2. **Molecules** (Functional groupings of atoms) 
3. **Organisms** (Complex functional sections) 
4. **Templates/Pages** (Page layout and composition)
Prototyping or implementing higher-level components without first defining their underlying atomic building blocks is prohibited.

### II. State Management & Data Fetching
Utilize appropriate React/Next.js state management solutions. Prefer React Context for simple global states (e.g., Theme, User Session). When fetching data from the Backend (Node.js/Express.js), it is mandatory to handle all lifecycle states explicitly: `loading`, `error`, and `success` to ensure a seamless user experience.

**API CONNECTION & BASE URL (NEW):** The Frontend client runs on `http://localhost:3000` and the Backend server runs on `http://localhost:5000`. 
* All frontend data fetching operations (`fetch`, `axios`, etc.) targeting the backend MUST prefix their endpoint paths with the backend's Base URL (e.g., `http://localhost:5000/...`). 
* To ensure security and flexibility, **NEVER hardcode** the base URL strings directly in the source code. It must be dynamically loaded via environment variables.

### III. Responsive & Beautiful Design (UI/UX)
The user interface must be modern, clean, and fully responsive across all screen dimensions (Mobile, Tablet, Desktop). Use flexible Grid/Flexbox layouts. Prioritize intuitive library workflows: implement smart filtering for book searches, crisp notification banners/toasts for successful or failed borrowing transactions, and smooth micro-interactions/transitions.

### IV. Performance Optimization
Leverage Next.js features to maximize frontend performance. Use Server Components for static pages or SEO-heavy views (e.g., Landing Page, Public Catalog) and Client Components for highly interactive views (e.g., Admin Dashboard, Borrowing Cart). All book cover images must utilize the Next.js `<Image>` component to prevent Layout Shift and optimize loading times.

### V. Error Handling & Accessibility
All input forms (e.g., Add New Book, Reader Registration) must implement robust frontend validation before dispatching requests to the backend. The interface must be accessible and resilient: provide meaningful `alt` text for imagery, display user-friendly error messages, and ensure the UI gracefully handles API failures without crashing.

### VI. Directory Structure & Workspace Alignment (MANDATORY)
Before creating any new files, modifying existing source code, or writing any import statements, the AI Agent MUST analyze and strictly adhere to the project's actual directory hierarchy. Do not alter the root architecture or make assumptions about file locations.

### VII. Modular & Abstract Architecture (Backend - NEW)
The backend source code must strictly follow the **Layered Architecture** pattern, ensures high abstraction, separation of concerns, and clear encapsulation of business logic.

### VIII. Import Path Verification (NEW)
Before creating any new files, editing existing files, or writing import statements, the AI Agent MUST analyze the project directory structure to determine the exact relative path from the current file to the target file. Assumption-based imports are prohibited; all imports must be verified against the actual workspace file tree.

### IX. Global Feature Requirements (Light/Dark Mode & Localization) (NEW)
All newly created or updated UI components and pages MUST strictly adhere to the following two global systems:
* **Theme System (Light/Dark Mode):** Hardcoded color codes (hex, rgb, etc.) are strictly prohibited. All styling must utilize the system Design Tokens or explicit framework-level dark mode utilities (e.g., Tailwind CSS utility classes: `bg-white dark:bg-slate-900`). The theme must initially resolve to the user's Operating System preference (System Preference). If undetected, it must fallback to `light` mode. The active theme state must be synchronized and persisted in `LocalStorage` to maintain the user's preference across browser sessions and page reloads.
* **Localization System (i18n - English/Vietnamese):** Hardcoded text strings within UI files/components are strictly prohibited. All user-facing text, placeholders, and error messages must be managed as key-value pairs within the global localization dictionaries (`en.json` and `vi.json`). Text invocation must exclusively use the framework's i18n translation hook/method (e.g., `t('namespace.key')`). When generating or modifying components containing text, the system must automatically derive and append the corresponding keys to both `en.json` and `vi.json`. If an English translation is not immediately available, the Vietnamese text must be used as a temporary fallback value, but the keys must structurally exist in both translation files simultaneously.

## Coding Conventions

### Tech Stack
* **Frontend:** Next.js (ReactJS)
* **Backend:** Node.js & Express.js (Using ES Modules `.mjs`)
* **Database:** PostgreSQL

### JavaScript/TypeScript Standards
* **Linting:** Strictly follow standard ESLint guidelines.
* **camelCase:** Enforced for variable names, function names, object properties, and custom hooks.
    * *Examples:* `const bookList = [];`, `function getBorrowerDetails()`, `const [isLoading, setIsLoading] = useState(false);`
* **PascalCase:** Enforced for Next.js components, page files, and Express models/classes on the backend.
    * *Examples:* `LibraryCard.jsx`, `BookDetail.tsx`, `BookModel.js`.
* **UPPERCASE_SNAKE_CASE:** Enforced for environment variables and global constants.
    * *Examples:* `NEXT_PUBLIC_API_URL`, `PORT`, `DATABASE_URL`, `MAX_BORROW_LIMIT`.

### Environment Variables & Ports (NEW)
* **Frontend Port:** `3000` (`http://localhost:3000`)
* **Backend Port:** `5000` (`http://localhost:5000`)
* **Frontend Environment Variable:** Use `NEXT_PUBLIC_API_URL` inside `.env.local` to store the backend base URL. 
    * *Example in code:* `const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, { ... });`
* **Backend Environment Variable:** Use `PORT=5000` inside `.env` to configure the ExpressJS server listening port.

### Folder Structure Convention (Next.js App Router)
* Shared/UI components belong in `/components` (e.g., `/components/ui/Button.jsx`).
* Core page logic and routing belong in the `/app` directory matching App Router structure.
* Global utility and helper functions belong in `/utils` or `/helpers`.

### Folder Structure Convention (Backend - ExpressJS - NEW)
Backend source code must be categorized into the following functional directories:
* **`config/`**: Holds configuration files for third-party services and system settings.
* **`controllers/`**: Acts as the bridge between requests and responses. Receives requests from routes, extracts data (`params`, `body`, `query`), calls the relevant service, and returns the final JSON response to the client.
* **`middlewares/`**: Interceptor functions running during the request-response cycle to perform security checks, authentication, data validation, or logging before a request reaches the controller.
* **`models/`**: Defines the "blueprint" or schema of the data (fields, data types, and relationships), ensuring database consistency and validity.
* **`routes/`**: The navigation system for the API. Defines which URL path maps to which controller function and which middlewares execute first. Organized by resource.
* **`services/`**: The "engine room" of the application. Contains the core business logic (e.g., calculating fines, complex database transactions, coordinating multiple models). Keeps controllers lean and reusable.
* **`utils/`**: Contains reusable, pure support functions that do not depend on the core business logic of the system.

### Backend Naming Conventions (NEW)
All backend files must use ES Modules extension (`.mjs`) and follow strict naming patterns based on their directory:
* **Within `config/`**: `[third-party-service].config.mjs` (e.g., `postgres.config.mjs`, `gemini.config.mjs`).
* **Within `utils/`**: `[target-object].utils.mjs` (e.g., `string.utils.mjs`, `matrix.utils.mjs`).
* **Within `services/`**: `[domain-object].services.mjs` (e.g., `book.services.mjs`, `user.services.mjs`).
* **Within `middlewares/`**: `[auth-layer-name].middlewares.mjs` (e.g., `auth.middlewares.mjs`, `role.middlewares.mjs`).
* **Within all other folders (`controllers`, `routes`, `models`)**: `[page-or-feature-name].[folder-type].mjs` (e.g., `home.routes.mjs`, `dashboard.controllers.mjs`, `auth.models.mjs`).

## Development Workflow

### Step-by-Step Implementation with AI
#### 1.  **Analyze & Contextualize:** 
Before generating code, the AI must review this `constitution.md` file and the existing project directory structure.
#### 2.  **Architectural Assessment & Track:** 
* **For Frontend Tasks:** Break down the UI request to determine if a new component is necessary or if an existing one can be extended or reused.
* **For Backend Tasks:** Map out the data flow ensuring high abstraction. Verify that the request strictly follows the layer chain: `Route -> Middleware(s) -> Controller -> Service -> Model`. Ensure no business logic is leaking into routes or controllers.
#### 3.  **Implementation & Self-Review:** 
* **For Frontend Tasks:** Generate clean code adhering strictly to the Coding Conventions (proper camelCase/PascalCase casing, robust loading/error states).
* **For Backend Tasks:** Generate modular code using ES Modules (`.mjs`). Implement the business logic inside the Service layer (*Fat Services*). Ensure explicit try-catch blocks and error forwarding to the global error handler.
#### 4.  **Verification & Quality Control:** 
* **For Frontend Tasks:** Ensure CSS/Styling (Tailwind or CSS Modules) strictly complies with the layout's responsiveness, spacing system (padding/margin), and consistent color palette.
* **For Backend Tasks:** Verify that the API returns responses matching the unified JSON structure. Ensure all inputs are properly sanitized/validated via middlewares and status codes (e.g., 200, 400, 401, 500) are used correctly.

## Governance
* This Constitution serves as the absolute source of truth for all prompts and source code generated by AI for this project.
* Any AI-generated code that violates naming conventions (e.g., using snake_case for variables) or lacks responsiveness is considered non-compliant and must be automatically refactored by the AI following these guidelines.

**Version**: 1.1.0 | **Ratified**: 2026-06-10 | **Last Amended**: 2026-06-22