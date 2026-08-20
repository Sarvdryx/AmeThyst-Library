# Research & Technical Decisions: Study Together - Study Group

## Decisions

### 1. Mock Data Storage
- **Decision**: Store mock data as a frontend array in `client/app/study-together/mockData.ts`.
- **Rationale**: Since backend integration is out of scope for this feature, a static frontend module provides the necessary data efficiently without cluttering component files.
- **Alternatives considered**: A separate `data.json` file. TypeScript module chosen to enforce type checking and provide better IntelliSense across components.

### 2. Localization
- **Decision**: Use the existing framework i18n hook (`t('namespace.key')`) and update `en.json` and `vi.json` accordingly for all new UI strings (e.g., "Join Group", "Request to Join", "Send", "Cancel", "Filter by subject...").
- **Rationale**: Adheres to Constitution Section IX.

### 3. "Request to Join" Modal Architecture
- **Decision**: Create a new organism `RequestToJoinModal.tsx` that utilizes the existing `Modal.tsx` atom (if exists) or a standard dialog implementation matching Atomic Design.
- **Rationale**: The modal represents a complex interaction with forms and actions. Keeping it separate as an organism keeps the card molecule clean.
