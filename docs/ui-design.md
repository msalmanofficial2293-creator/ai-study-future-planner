# UI design

This document defines the visual system so later screens stay consistent. The identity is original to this product.

## Visual system

Name: Ink and Horizon.

The interface should feel like a premium student productivity platform: modern, calm, intelligent, and trustworthy. Use generous whitespace, clear hierarchy, and restrained motion. Futuristic cues stay limited to the mark, a horizon accent, and quiet color washes.

Do not imitate the interface of Gauth, ChatGPT, Notion, or other existing products.

## Color

| Token | Value | Use |
| --- | --- | --- |
| Ink | `#102033` | Primary text, primary buttons, mark background |
| Ink soft | `#243447` | Hover state for ink surfaces |
| Paper | `#F3EFE7` | Page background |
| Paper raised | `#FBF9F5` | Cards and header surface |
| Line | `#E3DCD0` | Borders and dividers |
| Muted | `#3F4D5C` | Secondary text |
| Horizon | `#B85A28` | Rules, dots, and non-text accent |
| Horizon deep | `#8D431C` | Small accent text and focus |
| Tide | `#1D5F5B` | Eyebrows and secondary marks |

Horizon is for large or non-text accents. Use Horizon deep when the accent is small text. Body copy uses Ink or Muted on Paper.

The product theme is this light paper system. Do not add a theme switcher unless a later task asks for one.

## Type

- Outfit is the UI sans serif.
- Fraunces is the display serif for headings and the wordmark.

Both are loaded with `next/font` in the root layout. Use `font-display` for headings and `font-sans` for interface text.

## Components

Shared primitives live in `src/components/ui`. Current primitives are `Button`, `Container`, and `SectionHeading`. Extend these before copying the same control into a new screen.

The mark is an inline SVG in `src/components/brand/mark.tsx`. The favicon is `src/app/icon.svg`.

## Layout

- Content width is `max-w-6xl`, with horizontal padding that increases from phone to tablet.
- The header stays visible. In-page links leave room for it with `scroll-padding`.
- Sections stack in one column on small screens. The journey becomes two columns on tablet and four on desktop. The approach becomes three columns on large screens.
- Touch targets for links and buttons are at least 44px tall.

## Motion

Hover changes are color and border changes. Respect `prefers-reduced-motion` by disabling smooth scrolling and shortening transitions.

## Accessibility

- One `h1` on the home page. Sections use `h2`, and cards use `h3`.
- The header, main content, footer, and primary nav are landmarks.
- A skip link moves keyboard users to `#main`.
- Focus is visible. Do not remove the focus ring without a replacement.
- The mark is decorative when the product name is beside it.
- Text and background pairs in this system are chosen for WCAG AA contrast.

## Empty, loading, success, and error

The home page is static, so it has no data-loading state. Unknown routes use `src/app/not-found.tsx`. Unexpected render failures use `src/app/error.tsx`, which offers a retry and shows only a safe error reference.

Later features must design all four states when they fetch or submit data.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [README](../README.md)
