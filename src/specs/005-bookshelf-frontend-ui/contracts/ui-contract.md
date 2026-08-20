# UI Contract: Bookshelf Landing Page

## Component Hierarchy & Props

### 1. SearchBar (Molecule)
**Props**: None (Static for now)
**Elements**:
- `Input`: Text type, placeholder "Search...".
- `Button`: Label "Filter", with Filter icon.

### 2. BookCard (Molecule)
**Props**:
- `book`: Object (id, title, author, image)
**Behavior**: Hover shadow effect, responsive image container.

### 3. StudyGroupCard (Molecule)
**Props**:
- `group`: Object (id, name, members, theme)
**Variants**:
- `dark`: Background #091426, Text White.
- `light`: Background White, Text #091426, Border #C5C6CD.

### 4. PopularPublishes (Organism)
**Props**: None
**Composition**:
- Heading (H2)
- CategoryList (Molecule)
- BookGrid (Responsive Grid)

## Layout Contract

| Order | Component | Sticky | Content |
|-------|-----------|--------|---------|
| 1 | Navbar | Yes | Logo, NavLinks, Auth Buttons |
| 2 | HeroSection | No | Brand Message, Accent Image |
| 3 | SearchBar | No | Centered, overlapping Hero bottom (using margins) |
| 4 | PopularPublishes | No | Grid of 4-8 books |
| 5 | StudyGroup | No | Grid of 2-4 groups |
| 6 | Footer | No | Navigation, Copyright |

## Visual Standards

- **Grid Gap**: `gap-6` (24px).
- **Section Padding**: `my-12` (48px vertical).
- **Container**: `max-w-7xl mx-auto px-4`.
- **Transitions**: `transition-all duration-200` for hover states.
