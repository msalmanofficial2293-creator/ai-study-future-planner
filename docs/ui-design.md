# UI design

Design principles for AI Study Future Planner. This phase documents the current identity. It does not redesign the landing page.

## Character

The interface should feel premium, modern, calm, intelligent, student-focused, trustworthy, clean, and structured. Futuristic cues stay limited to the mark, a horizon accent, and quiet color washes.

The visual system is original to this product. Its name is Ink and Horizon.

Do not copy the interface of ChatGPT, Gauth, Notion, Google Classroom, or another existing product.

## Current identity

These tokens are already used by the landing page. Later screens should use them instead of inventing a second palette.

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#102033` | Primary text, primary buttons, mark background |
| Ink soft | `#243447` | Hover state for ink surfaces |
| Paper | `#F3EFE7` | Page background |
| Paper raised | `#FBF9F5` | Cards and raised surfaces |
| Line | `#E3DCD0` | Borders and dividers |
| Muted | `#3F4D5C` | Secondary text |
| Horizon | `#B85A28` | Rules, dots, and non-text accent |
| Horizon deep | `#8D431C` | Small accent text and focus |
| Tide | `#1D5F5B` | Eyebrows and secondary marks |

Horizon is for large or non-text accents. Use Horizon deep for small accent text. Body copy uses Ink or Muted on Paper. The theme is this light paper system. Do not add a theme switcher unless a task asks for one.

## Typography

- Outfit is the UI sans serif for interface text.
- Fraunces is the display serif for headings and the wordmark.
- Both load through `next/font` in the root layout. Use `font-display` for headings and `font-sans` for UI text.
- Use one `h1` per page. Sections use `h2`. Cards use `h3`.
- Keep line length comfortable. Do not set long paragraphs in the display face.

## Spacing

- Use the existing spacing scale. Do not mix arbitrary one-off gaps when a scale step fits.
- Content width is `max-w-6xl`, with horizontal padding that increases from phone to tablet.
- Separate sections with whitespace before adding more borders.
- Keep the header offset in `scroll-padding` so in-page targets are not hidden.

## Responsive design

- Design the phone layout first, then tablet, then desktop.
- The landing journey is one column on a phone, two columns on a tablet, and four columns on a desktop. The approach section becomes three columns on a large screen.
- The compact wordmark is "Study Future" on small screens. The full product name shows from the small breakpoint up. The accessible name remains AI Study Future Planner.
- Do not hide primary actions on a phone. Stack them instead of shrinking them below a 44px target.

## Accessibility

- Use landmarks for header, main, footer, and primary navigation.
- Keep the skip link to `#main`.
- Focus must stay visible. Do not remove the focus ring without a replacement.
- Do not use color alone to convey state.
- The mark is decorative when the product name is beside it.
- Text and background pairs in this system are chosen for WCAG AA contrast.
- Respect `prefers-reduced-motion` by shortening transitions and disabling smooth scrolling.

## Component consistency

Shared primitives live in `src/components/ui`. Current primitives are `Button`, `Container`, and `SectionHeading`. Extend these before copying a control into a new screen.

The mark is `src/components/brand/mark.tsx`. The favicon is `src/app/icon.svg`.

### Buttons

- Primary actions use the ink button. Secondary actions use the bordered button.
- Use the shared `Button` component for both links and actions.
- Minimum height is 44px. Labels are specific, such as "View the journey", not "Click here".

### Cards

- Use Paper raised, a Line border, and the existing radius.
- A card that is not a link must not look clickable.
- Put the title in a heading and the supporting text in Muted.

### Forms

No product forms exist yet. When a task adds one:

- Use a visible label tied to the control. Do not use a placeholder as the label.
- Show validation text next to the field and summarize it when several fields fail.
- Keep submit buttons on the shared `Button` component.
- Do not clear a student's input when saving fails.

### Navigation

The public header contains the product mark and in-page links. Later signed-in navigation should extend this shell rather than introduce a second header style. Current location must be understandable without relying on color alone.

## Feedback states

Every feature that loads or saves data needs an explicit state. The landing page is static, so it does not have a data-loading state.

| State | Expectation |
| --- | --- |
| Loading | Say what is happening. Do not leave a blank region. |
| Empty | Explain that nothing is here yet and what action starts the work. |
| Success | Show the result in the page, not only a momentary color change. |
| Error | Say what failed and what the student can do next. Do not show stack traces, secrets, or raw provider output. |

Unknown routes use `src/app/not-found.tsx`. Unexpected render failures use `src/app/error.tsx`, which offers a retry and may show a safe digest only.

## Motion

Hover changes are color and border changes. Do not add large movement, parallax, or decorative animation.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [Features](features.md)
- [README](../README.md)
