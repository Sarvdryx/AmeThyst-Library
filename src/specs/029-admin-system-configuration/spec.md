# Feature Specification: Admin System Configuration

**Feature Branch**: `feature/StudyGroup`

**Created**: 2026-08-01

**Status**: Draft

**Input**: User description: "Create an admin-only System Configuration page, reachable from the admin dashboard, for maintaining borrowing limits, penalty fees, and book-damage coefficients through a file-backed configuration without using the database."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review and update system parameters (Priority: P1)

As an administrator, I can open System Configuration from the admin dashboard, review the current borrowing and penalty parameters, edit them in clearly labeled groups, and save all valid changes so future library operations use the new policy.

**Why this priority**: This is the core business value of the feature: policy values can be maintained without a developer editing application source code.

**Independent Test**: Sign in as an administrator, open System Configuration, change one damage coefficient and the maximum borrowing limit, save, reload the page, and verify that both saved values remain visible and are used for subsequent eligible calculations or borrowing checks.

**Acceptance Scenarios**:

1. **Given** an authenticated administrator is on the admin dashboard, **When** they select System Configuration, **Then** the system displays the current configuration grouped into borrowing policy, penalty fees, and damage coefficients.
2. **Given** the administrator changes one or more values to valid values, **When** they save the configuration, **Then** the system saves the complete configuration as one consistent update and shows a success confirmation.
3. **Given** a valid configuration has been saved, **When** the administrator reloads or revisits the page, **Then** the saved values are displayed.
4. **Given** a valid configuration has been saved, **When** a new borrowing eligibility check or penalty calculation occurs, **Then** it uses the newly saved applicable values without requiring the administrator to restart the system.

---

### User Story 2 - Prevent invalid or accidental policy changes (Priority: P2)

As an administrator, I receive immediate, understandable validation feedback and a clear summary of unsaved changes so that invalid values or accidental edits do not alter library policy.

**Why this priority**: Invalid fee coefficients or borrowing limits could directly affect patrons and library operations.

**Independent Test**: Enter negative, non-numeric, non-finite, and fractional borrowing-limit values; verify that each invalid field is identified, saving is blocked, and the last valid configuration remains unchanged.

**Acceptance Scenarios**:

1. **Given** an administrator enters an invalid value, **When** the field loses focus or the administrator attempts to save, **Then** the affected field displays a specific validation message and the configuration is not saved.
2. **Given** any editable configuration field is empty or contains only whitespace, **When** the administrator reviews the form or attempts to submit it, **Then** the Save action is unavailable, the empty field is identified as required, and no configuration change is submitted or applied.
3. **Given** the page contains unsaved changes, **When** the administrator chooses to discard them, **Then** every field returns to the last successfully saved value.
4. **Given** the configuration cannot be loaded or saved, **When** the operation fails, **Then** the page remains usable, explains that no change was applied, and retains the administrator's current input where recovery is possible.
5. **Given** no field differs from the last saved configuration, **When** the page is displayed, **Then** the save and discard actions are unavailable or clearly inactive.

---

### User Story 3 - Use a consistent, accessible admin experience (Priority: P3)

As an administrator, I can manage settings through an interface consistent with the existing admin dashboard on desktop, tablet, or mobile, in either supported language and visual theme.

**Why this priority**: Configuration controls must remain understandable and safe across the same environments supported by the rest of the administration area.

**Independent Test**: Exercise the page at representative desktop, tablet, and mobile widths in light and dark themes and in English and Vietnamese; verify that all settings, help text, errors, and actions remain readable and keyboard accessible.

**Acceptance Scenarios**:

1. **Given** an administrator uses any supported screen size, **When** they open the page, **Then** all controls remain visible and operable without horizontal page scrolling.
2. **Given** the administrator changes the application language or theme, **When** the page is rendered, **Then** all user-facing text and visual states follow the selected global preferences.
3. **Given** the administrator uses only a keyboard, **When** they navigate and edit the form, **Then** focus order, labels, validation messages, and save/discard actions are perceivable and operable.
4. **Given** an unauthenticated user or a non-administrator attempts to open the System Configuration route, **When** authorization is evaluated, **Then** no configuration values or editing controls are exposed and the existing access-denied flow is used.

### Edge Cases

- A numeric value is empty, contains whitespace only, is negative, is not finite, or uses unsupported characters.
- The borrowing limit is zero, fractional, non-finite, or otherwise not a positive whole number.
- A coefficient or fee is entered as `0`; zero is accepted where it represents no charge, while the maximum borrowing limit still requires a positive integer.
- `perfect_condition` remains `0` because a book in perfect condition must never create damage cost.
- Two administrators edit the page around the same time; each successful save must produce a complete configuration, never a partially mixed set of values.
- The configuration source is missing, malformed, unreadable, or not writable; the system must not silently claim success or apply a partial/default mixture.
- A save is interrupted; the last complete valid configuration remains active.
- A patron already has more active loans than a newly reduced maximum; existing loans remain valid, but the patron cannot create another loan until below the new limit.
- A penalty or loan record already exists when policy changes; the recorded result is not recalculated retroactively.
- An existing business flow explicitly supplies an item-specific lost-item penalty amount; that supplied amount continues to take precedence over the general lost coefficient, but this feature does not create, store, or retrieve such an amount.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST expose System Configuration as a selectable destination within the existing admin dashboard navigation.
- **FR-002**: The system MUST allow only authenticated accounts with the administrator role to view or modify system configuration, enforcing this restriction for both page access and save operations.
- **FR-003**: The page MUST present only the settings in this feature scope, organized into three understandable groups: borrowing policy, penalty fees, and damage coefficients.
- **FR-004**: The borrowing policy group MUST expose `MAX_BORROW_LIMIT`, initially set to `5`, as the maximum number of simultaneous active borrowings allowed for one patron.
- **FR-005**: The penalty fees group MUST expose `FEE_ADMIN`, initially set to `1`, and `FEE_ADDON`, initially set to `0.5`, with descriptions explaining their role in the damage-cost calculation.
- **FR-006**: The damage coefficients group MUST display the fixed set of condition keys and initial values: `perfect_condition` (`0.0`), `slight_cover_scratches` (`0.05`), `folded_pages` (`0.10`), `pencil_marks` (`0.15`), `ink_marks` (`0.40`), `torn_pages` (`0.50`), `water_damage` (`0.70`), `damaged_binding` (`0.30`), `missing_mats` (`0.30`), `missing_pages` (`1.00`), and `lost` (`2.00`).
- **FR-007**: The system MUST provide human-readable labels and concise explanations for every setting while preserving the stable configuration keys used to identify them.
- **FR-008**: The administrator MUST be able to edit every fee and damage coefficient except `perfect_condition`, which MUST remain visible at `0` and non-editable to preserve the no-damage rule.
- **FR-009**: All editable coefficients and fees MUST accept finite numeric values greater than or equal to `0`; `MAX_BORROW_LIMIT` represents the configured simultaneous-borrowing policy and MUST accept only a positive whole number, without a separate feature-defined upper bound.
- **FR-010**: The system MUST require a value in every configuration field before saving. If any editable field is empty or contains only whitespace, the Save action MUST remain unavailable, the field MUST be identified as required, and no save operation may be submitted or applied.
- **FR-011**: The administrator MUST be able to distinguish unchanged, modified, invalid, saving, saved, and failed states and MUST be able to discard all unsaved changes.
- **FR-011a**: The librarian return-inspection penalty preview and the final persisted return penalty MUST use the same active fee and damage policy snapshot, so the preview reflects administrator changes without exposing the admin configuration endpoint to librarian accounts.
- **FR-011b**: Return inspection MUST bind to the configuration version active when the Return PIN is verified. If an administrator saves a newer version before preview or confirmation, the backend MUST invalidate that pending Return PIN, reject the stale inspection with a distinct configuration-changed error, and the client MUST notify the librarian and return to Enter Return PIN.
- **FR-012**: A save MUST update the configuration as one complete unit; if any part fails, none of the submitted changes may become active.
- **FR-013**: After a successful save, the new values MUST persist across page reloads and server restarts and MUST become effective for new applicable operations without an administrator-triggered restart.
- **FR-014**: Damage cost MUST add the full standalone charge of every distinct applicable damage condition: `sum(bookPrice × conditionCoefficient + FEE_ADMIN) + additionalConditionCount × FEE_ADDON`. Adding another positive-coefficient condition MUST increase the damage cost by at least that condition's standalone charge; when it is beyond the first condition, its increase is `bookPrice × addedConditionCoefficient + FEE_ADMIN + FEE_ADDON`.
- **FR-015**: The general `lost` coefficient MUST determine the lost-item charge as a multiple of the book price unless an existing business flow explicitly supplies an item-specific lost penalty amount. A supplied item-specific amount MUST take precedence, but this feature MUST NOT create, store, or retrieve item-specific lost penalty amounts.
- **FR-016**: Changes MUST apply prospectively: previously recorded penalties and existing loans MUST not be recalculated, canceled, or otherwise modified.
- **FR-017**: If configuration loading or saving fails, the system MUST show a localized, actionable error, MUST not report success, and MUST preserve the last complete valid active configuration.
- **FR-018**: All page content, labels, help text, validation feedback, confirmations, and errors MUST be available in English and Vietnamese.
- **FR-019**: The page MUST retain the existing application admin shell and accessibility, localization, responsive, and theme behavior. Within the page content, `admin-system-configuration-layout.txt` MUST be the primary visual and structural reference: a simple page title followed by bordered white setting cards, section title/description, compact fields, and pill-shaped Save Changes actions. Only the referenced settings content is replaced by the borrowing limit, penalty fees, and damage coefficients required by this feature.
- **FR-019a**: Dynamic penalty calculation MUST use cumulative condition contributions rather than only the highest selected coefficient. A damage cap applies only when an explicit item-specific cap is supplied. Lost-book and overdue handling MUST not gain an implicit cap or surcharge solely from moving values into configuration.
- **FR-020**: The configuration MUST be maintained in the stakeholder-designated `system-configuration.json` file in an appropriate server-owned configuration location. Configuration loading, saving, and business-rule reads MUST NOT add, read, or update database records; existing authentication and account-role verification MAY continue using their current database access.
- **FR-021**: The fixed configuration key set MUST remain intact; administrators cannot add, rename, or delete settings through this page.
- **FR-022**: Overdue-fee percentages, grace periods, creation/management/storage of item-specific lost penalties, notifications, security controls, onboarding controls, user management, and database-backed configuration history are outside this feature's scope. Honoring an item-specific amount explicitly supplied by an existing caller remains required by FR-015.

### Key Entities

- **System Configuration**: The complete active policy snapshot. It contains one borrowing limit, two penalty fee values, and the fixed set of damage coefficients and is saved as a single consistent unit.
- **Borrowing Policy**: The maximum number of simultaneous active borrowings allowed for a patron.
- **Penalty Fee Policy**: The base administrative charge and the charge applied for each additional damage condition.
- **Damage Coefficient**: A stable condition key, a localized label and explanation, and a non-negative numeric multiplier used by applicable penalty calculations.
- **Configuration Draft**: The administrator's current editable values before saving, including its unchanged, modified, and validation state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An authenticated administrator can reach System Configuration from the admin dashboard in no more than two navigation actions.
- **SC-002**: At least 9 of 10 representative administrator participants who have not previously completed the walkthrough can correctly update one borrowing setting and one penalty setting on their first attempt without assistance.
- **SC-003**: In the acceptance walkthrough, elapsed time from the completed initial configuration load until the success confirmation after saving all 14 displayed values MUST be under three minutes.
- **SC-004**: 100% of tested invalid, missing, empty, and whitespace-only inputs prevent saving, display a field-specific explanation, and leave the active configuration unchanged.
- **SC-005**: 100% of successful saves remain visible after a page reload and a server restart and affect the next applicable operation.
- **SC-006**: 100% of tested unauthenticated and non-administrator access attempts expose no configuration values and perform no configuration changes.
- **SC-007**: The primary review, edit, validation, discard, and save flows can be completed at representative mobile, tablet, and desktop widths using either supported language and theme.
- **SC-008**: A failed or interrupted save leaves the last complete valid configuration active in 100% of recovery tests.
- **SC-009**: Under normal local single-process load, authenticated configuration GET and valid PUT requests each complete within two seconds, excluding environment startup and external network transit.

## Assumptions

- The feature is deployed to a single application server running exactly one Node.js backend process with durable, writable server storage. Clustered workers and multiple backend instances sharing the JSON file are outside scope.
- `system-configuration.json` is the single source of truth for these settings; no database table or other persistent configuration store is introduced.
- The initial configuration is seeded from the values currently defined in the penalty and library business rules.
- Existing authentication, role-based access, admin navigation, localization, theme, feedback, and form components are reused or extended.
- System Configuration is reached through the existing `/dashboard/admin/system` destination within the existing admin shell.
- The page uses one page-level save operation rather than separate saves for each group so the active policy remains internally consistent.
- The application has one currency convention already used by penalty calculations; this feature does not add currency conversion or currency selection.
- Reducing the borrowing limit affects only future eligibility checks and does not invalidate loans already in progress.
- Historical audit reporting is not required for this file-backed, single-server version.
- The feature stakeholder is responsible for recruiting the 10 representative administrator participants required by SC-002 and confirming the anonymous acceptance evidence; the implementation team prepares the protocol and evidence template.
