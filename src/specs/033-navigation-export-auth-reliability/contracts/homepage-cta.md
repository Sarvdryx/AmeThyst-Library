# Contract: Homepage CTA Behavior

## Explore Library

- **Precondition**: The Library hero and catalog are rendered.
- **Activation**: Pointer click, Enter, or Space on the existing control.
- **Outcome**: Focus and viewport move to the existing catalog/search region on the same page.
- **Repeat behavior**: Repeated activation is idempotent and does not create a duplicate route.
- **Preserved properties**: Existing translated label, Button variant, theme classes, and responsive layout.

## How It Works

- **Precondition**: The Library hero is rendered.
- **Activation**: Pointer click, Enter, or Space on the existing control.
- **Outcome**: The existing `/help` Help Center opens using client navigation.
- **Repeat behavior**: While navigation is already scheduled, repeated activation does not schedule another route push.
- **Preserved properties**: Existing translated label, Button variant, theme classes, responsive layout, and browser back behavior.
