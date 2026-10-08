# UI design

The visual system is Ink and Horizon. It is original to AI Study Future Planner. The public landing page uses it for the header, hero, product statement, how-it-works, features, reasons, learning journey, benefits, FAQ, final call to action, and footer.

The interface should feel premium, modern, calm, intelligent, student-focused, trustworthy, clean, and structured. Futuristic cues stay limited to the mark, a horizon accent, and two quiet color washes.

Do not copy ChatGPT, Gauth, Notion, Google Classroom, Duolingo, or another existing product.

Do not add a theme switcher unless a task asks for one.

## Color

Tokens live in `src/app/globals.css` on `:root`. Component styles use those custom properties, including `--background`, `--surface`, `--border`, `--accent`, `--accent-deep`, and `--accent-secondary`. Do not add one-off colors in a component.

| Token | Value | Use |
| --- | --- | --- |
| Ink / foreground | `#102033` | Primary text, primary buttons, mark |
| Ink soft | `#243447` | Primary button hover, navigation |
| Foreground soft | `#314155` | Secondary text |
| Foreground muted | `#3F4D5C` | Captions and descriptions |
| Paper / background | `#F3EFE7` | Page background |
| Surface | `#FBF9F5` | Raised sections and secondary buttons |
| Elevated | `#FFFDF9` | Elevated cards and form controls |
| Border | `#E3DCD0` | Borders and dividers |
| Accent | `#B85A28` | Rules, dots, and other non-text marks |
| Accent deep | `#8D431C` | Small accent text and focus |
| Accent secondary / info | `#1D5F5B` | Eyebrows and the second sequence mark |
| Success | `#1B6B3A` on `#E7F3EA` | Success text on a success surface |
| Warning | `#8A5A10` on `#F8EFD8` | Warning text on a warning surface |
| Danger | `#9D2C2C` on `#F8E8E6` | Errors and destructive actions |

Accent is not for small text. Use accent deep, or the success, warning, and danger text colors, on their light surfaces. Do not communicate a state with color alone. Pair it with text such as "Error:".

## Typography

Two families, loaded in the root layout:

- Outfit for UI text, from 400 to 600.
- Fraunces for display text and the wordmark, at 500 and 600.

Reusable classes:

| Class | Use |
| --- | --- |
| `display-heading` | Hero title |
| `page-heading` | Page title, including not-found and error |
| `section-heading` | Section title |
| `principle-heading` | Larger card or principle title |
| `card-heading` | Compact card title |
| `lede` | Hero introduction |
| `body` | Primary reading text |
| `body-secondary` | Supporting text |
| `caption` | Secondary descriptions |
| `eyebrow` | Small section label |
| `nav-brand` | Wordmark |
| `nav-link` | Header navigation |
| `field-label` | Form labels |

Sizes use `clamp` where a heading must stay readable from a phone to a large desktop. One `h1` per page. Sections use `h2`. Cards use `h3`.

## Spacing

Use the 4px spacing scale. Shared rhythm:

- Page content width is `max-w-6xl`, centered, including on large desktops.
- Horizontal padding is `px-5`, then `px-8` from the small breakpoint.
- Sections use `py-16`, `py-20` from the small breakpoint, and `py-24` from the large breakpoint.
- Controls and navigation items are at least 44px tall.
- Cards use `1.25rem` padding and `0.75rem` internal gaps.
- Related actions use `gap-3`. Card grids use `gap-4`, then `gap-5` from the small breakpoint.

In-page targets clear the sticky header with `scroll-padding-top: 5.5rem`.

## Responsive behavior

Start from the phone layout, including a 320px width. Stack hero actions and sections in one column. The header keeps one row: a short wordmark below the small breakpoint, the full name from there, a Menu control below the large breakpoint, and the text links from the large breakpoint. The header call to action is visible from the small breakpoint and inside the menu on smaller screens.

How it works is two columns from the small breakpoint and five from the extra-large breakpoint. Feature cards are two columns from the small breakpoint and three from the large breakpoint. Reasons follow the same grid. The learning journey stays a single vertical path. Benefits become a number plus text from the small breakpoint. The hero splits into text plus the path card from the large breakpoint. Page width stays `max-w-6xl` on large desktops.

The short wordmark "Study Future" is visual only. The accessible name remains AI Study Future Planner.

## Components

Shared UI lives in `src/components/ui`.

| Component | Role |
| --- | --- |
| `Button` | Primary, secondary, outline, ghost, and destructive actions or links. Supports hover, focus, disabled, and loading. |
| `Container` | Page width and horizontal padding. |
| `Section` | Section spacing and surface tone. |
| `SectionHeading` | Eyebrow, title, and description. |
| `Card` | Quiet, raised, or elevated surface. Optional icon, title, description, and footer. |
| `Badge` | Short status or step label. |
| `Divider` | Horizontal rule. |
| `Field`, `Input`, `Textarea`, `Select`, `Checkbox`, `Radio` | Form foundation. Not used by a product form yet. |
| `Dialog` | Native modal foundation. Not mounted on the landing page. |
| `Tooltip` | Text shown on hover and keyboard focus. Not used for essential information. |
| `LoadingState`, `EmptyState`, `ErrorState`, `Skeleton` | Feedback foundation. The error route uses `ErrorState`. |

The mark is `src/components/brand/mark.tsx`. The favicon is `src/app/icon.svg`. No icon library is installed. Pass an icon into `Card` only when it supports the content.

### Buttons

Use `Button` instead of a new control. Primary is ink on paper. Secondary is a surface with a border. Outline is a transparent ink border. Ghost is text with a surface hover. Destructive is for a dangerous action and is not used on the landing page. Loading shows a spinner and the word "Loading" for assistive technology, and the control cannot be activated. Disabled controls use reduced opacity as well as the disabled state.

### Cards

Feature cards are elevated and marked Planned. How-it-works steps are quiet cards with a larger heading. Reasons use a divider instead of a card. The learning journey alternates elevated and quiet cards on a vertical rail. The hero path and the final call to action use elevated cards. A card that is not a link does not change on hover.

### Landing navigation

In-page links use the section ids `product`, `how-it-works`, `features`, `why`, `journey`, `benefits`, `faq`, and `start`. The header action "Start Planning" and the hero action "Build My Study Plan" go to `start`. "Start Planning Your Future" goes to `how-it-works` and does not open an account. The mobile menu is the only client component on the page. It closes when a link is chosen or Escape is pressed. FAQ questions use `details`, so they work without JavaScript.

### Forms

No product form exists on the landing page. Onboarding at `/onboarding` collects the first goal. The Future Planner at `/app/future-planner` lets the student revise that goal. Profile at `/app/profile` shows identity, education, goals, and account controls. Email stays read-only. The profile photo uses a square avatar with `object-fit: cover`; when no photo exists, initials show. Upload and remove stay accessible (labeled buttons and a confirmation dialog). The authenticated shell user menu reuses the same photo or initials. A signed-in header links to Profile:

- `Field` supplies a visible label, optional description, and an error announced with `role="alert"`.
- The message starts with "Error:" so the state is not color alone.
- Invalid controls set `aria-invalid` and a danger border.
- Disabled controls are visibly faded and cannot be used.
- Do not clear the student's input when saving fails.

### Feedback

| State | Expectation |
| --- | --- |
| Loading | Name the wait. Use `LoadingState` or the button loading state. |
| Empty | Say that nothing is here yet and how to start. |
| Success | Show the result, not only a color change. |
| Error | Say what failed and what to do next. Do not show stack traces, secrets, or raw provider output. |

Unknown routes use `src/app/not-found.tsx`. Unexpected render failures use `src/app/error.tsx`.

## Motion

Hover and focus changes are color and border changes of about 160ms. The skeleton and button spinner are the only repeating motions, and they stop when reduced motion is requested. Do not add bounce, parallax, or a page-load animation.

## Accessibility

- Landmarks: header, main, footer, primary navigation, product and resource footer navigation, and the hero path aside.
- Skip link moves keyboard focus to `#main`.
- Focus is a 2px accent-deep outline. Do not remove it without a replacement.
- Text and control labels meet WCAG AA contrast on their surfaces.
- Respect `prefers-reduced-motion`.

## Related documents

- [Product](product.md)
- [Architecture](architecture.md)
- [Features](features.md)
- [README](../README.md)
