# Research: Bookshelf Frontend UI Implementation

## Component Decomposition (Atomic Design)

Based on the `template.txt` and project requirements, the following decomposition will be used:

### Atoms
- **Button**: Reusable button with variants (Teal, Navy, White).
- **Icon**: Search icon, Filter icon, Logo icon.
- **Typography**: Predefined styles for H2, H3, Body, Small.
- **Image**: Next.js `<Image>` wrapper for book covers and banners.

### Molecules
- **SearchBar**: Combines Search Icon + Input + Filter Button.
- **CategoryToggle**: The "All, Science, History..." button group.
- **BookCard**: Cover + Title + Author.
- **StudyGroupCard**: Name + Member Count + Join Button.

### Organisms
- **Navbar**: Logo + Links + User actions.
- **HeroSection**: Banner + CTA.
- **PopularPublishesSection**: Heading + CategoryToggle + Grid of BookCards.
- **StudyGroupSection**: Heading + "View All" + Grid of StudyGroupCards.
- **Footer**: Brand info + Links + Social.

### Templates / Pages
- **LandingPage**: Assembles all organisms in the specified order.

## Layout Architecture Decision

- **Decision**: Use a vertical Flexbox container for the main layout.
- **Rationale**: Ensures the specified order (Navbar -> Hero -> SearchBar -> PopularPublishes -> StudyGroup -> Footer) is maintained.
- **Technique**: Use `flex flex-col min-h-screen` on the main container.
- **Responsiveness**: Use Tailwind's `max-w-7xl mx-auto px-4` for content containment and `grid-cols-1 sm:grid-cols-2 md:grid-cols-4` for lists.

## Brand Implementation (Colors & Typography)

- **Colors**:
  - Background: `#F8EFE6` (Applied to `body` or main wrapper).
  - Primary: `#091426` (Deep Navy).
  - Secondary: `#006F66` (Teal).
  - Accent: `#FFB95F` (Orange).
- **Fonts**:
  - `Inter` (Sans-serif, general UI).
  - `Manrope` (Headings).
  - `Open Sans` (Body copy).
- **Decision**: Define these in `tailwind.config.js` or use arbitrary values if config modification is restricted. Given the scope, arbitrary values or a custom theme extension is preferred.

## Alternatives Considered

- **Absolute Positioning for Hero Overlap**: Rejected as per user requirement (Constraint 3).
- **Z-Index Layering for SearchBar**: Instead of `absolute top-*`, use negative margins or logical flow to place the SearchBar relative to the Hero section while maintaining responsiveness.
