# UI Design System

MapWiki uses a restrained data-product interface inspired by Linear, GitHub, Notion, Figma, and Arc Browser.

## Principles

- Maps first: the primary artifact is always the interactive geographic view.
- Dense but readable: compact controls, clear grouping, predictable navigation.
- Professional palette: neutral surfaces with teal primary actions and dataset-specific layer colors.
- No AI or crypto styling.
- Cards are reserved for repeated items, modals, and framed tools.
- Controls use familiar icons through `lucide-react`.

## Components

Local ShadCN-style components live under `components/ui`:

- `Button`
- `Card`
- `Input`
- `Textarea`
- `Label`
- `Badge`
- `Tabs`
- `Select`
- `Switch`

## Accessibility

- Semantic headings and landmarks.
- Keyboard-focus rings on interactive controls.
- Labels for form inputs and map actions.
- Reduced-motion media query.
- Sufficient contrast in the default light theme.

