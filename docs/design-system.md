# screen companion — design system

status: ready for agent handoff
package: `packages/design-tokens` + `packages/ui`
principle: one primitive (`Box`), everything else is composition.

this is not a component-per-page system. almost every visual element in the app — cards, chips,
buttons, list rows, the tv focus ring container, the companion chat bubble — is a `<Box>` with
props, not a bespoke styled component. bespoke components are for behavior (a button's click
handling, an input's controlled state), not for visual styling — visual styling is always tokens
+ box props.

---

## 1. design principles

1. **box, then behavior.** style with `<Box>` props. add a dedicated component only when there's
   real interactive behavior (focus management, keyboard handling, form state) — not for visuals.
2. **tokens, never raw values.** no hex codes, no raw pixel numbers, no arbitrary tailwind values
   in feature code. if a value isn't in the token scale, that's a signal the scale is missing
   something — extend the scale, don't escape it.
3. **one scale, two platforms.** browser and tv share the same token names and the same `Box` api.
   the *values* differ (tv spacing and type are larger), but a developer moving from a browser
   screen to a tv screen should not have to learn a new mental model.
4. **spoiler-safe by default.** any component that can render unknown/untrusted content (ai
   answers, episode descriptions) must use the `Prose` component (§6.6), never raw `dangerouslySetInnerHTML`.
5. **focus is not optional.** every interactive `Box` has a defined focus state token. this isn't
   a tv-only concern — it's aa accessibility on browser too.

---

## 2. design tokens

all tokens live in `packages/design-tokens` as css custom properties + a typed ts export, so both
tailwind config and the tv app (which may not use tailwind) can consume the same values.

### 2.1 spacing scale

named, not numbered, so intent is legible in code (`gap='m'` reads better than `gap={4}`).

| token | value (browser) | value (tv) |
|---|---|---|
| `none` | 0px | 0px |
| `3xs` | 2px | 4px |
| `2xs` | 4px | 8px |
| `xs` | 8px | 12px |
| `s` | 12px | 16px |
| `m` | 16px | 24px |
| `l` | 24px | 32px |
| `xl` | 32px | 48px |
| `2xl` | 48px | 64px |
| `3xl` | 64px | 96px |

tv values are larger across the board — a tv is viewed from ~2–3 meters away, browser from
~40–60cm. this is the single biggest reason tv and browser can't share literal pixel values even
though they share token names.

### 2.2 radius scale

```text
none   0px    -- sharp edges, rarely used (dividers, full-bleed images)
xs     4px    -- chips, tags, small controls
s      8px    -- inputs, buttons, list rows
m      12px   -- cards, modals
l      16px   -- large cards, sheets
xl     24px   -- hero/feature panels
full   9999px -- avatars, pills, circular icon buttons
```

usage: `<Box radius='s'>` for a button, `<Box radius='m'>` for a card. tv uses the same scale —
do not create a separate tv radius scale, large-radius cards read fine on a tv.

### 2.3 color tokens

color is expressed as **semantic** tokens, never raw palette names, in component code. the raw
palette (`palette.blue.500` etc.) exists only inside the token package itself.

```text
-- surface (backgrounds)
surface.base           -- app background
surface.raised         -- cards, panels
surface.overlay        -- modals, sheets over dimmed background
surface.sunken         -- input fields, wells

-- content (text/icon)
content.primary        -- main text
content.secondary      -- supporting text
content.tertiary       -- least emphasis, placeholders
content.inverse         -- text on a filled/dark surface
content.link

-- border
border.subtle
border.default
border.strong
border.focus            -- the focus ring color, browser and tv both

-- action (interactive fills)
action.primary.default
action.primary.hover
action.primary.pressed
action.primary.disabled
action.secondary.default
action.secondary.hover

-- feedback
feedback.success
feedback.warning
feedback.danger
feedback.info

-- spoiler-specific (new, product-specific semantic layer)
spoiler.safe             -- e.g. a subtle green-tinted badge for "episode-only" tags
spoiler.caution          -- season-only
spoiler.full             -- full-series, visually the "most exposed" state
```

each semantic token has a light and dark value defined once in the token package; components
never branch on theme, they just use the token.

### 2.4 typography scale

named so the size reads as what it *is*, not where it sits in an abstract ramp — this is the same
enum the `Text` component (§3.4) exposes, so there is exactly one typography vocabulary in the
whole codebase.

| size token | browser size / line-height | tv size / line-height | use |
|---|---|---|---|
| `display` | 32px / 40px | 56px / 64px | landing hero, tv home title |
| `title-lg` | 24px / 32px | 40px / 48px | screen titles |
| `title-md` | 20px / 28px | 32px / 40px | section headers, card titles |
| `title-sm` | 16px / 24px | 26px / 32px | list-row titles |
| `body-lg` | 17px / 26px | 28px / 36px | companion answer text — the one place body text should be easy to read at a glance, not dense |
| `body-md` | 15px / 22px | 24px / 32px | default body text |
| `body-sm` | 13px / 18px | 20px / 28px | secondary/meta text |
| `caption` | 12px / 16px | 18px / 24px | timestamps, tags, badges |

font weight is a separate token (`weight.regular` / `weight.medium` / `weight.bold`), composed
with the size token, not baked into it — `<Text size="title-md" weight="bold">`, not a
`title-md-bold` variant.

### 2.5 elevation / shadow scale

```text
none      -- flat, most tv surfaces (shadows read poorly on tv panels, avoid overusing)
low       -- resting cards on browser
medium    -- dropdowns, popovers
high      -- modals, sheets
```

on tv, prefer `border.strong` + a slight background-color shift over shadow for separating
surfaces — physical tv panels render soft shadows inconsistently across brands/models.

### 2.6 motion tokens

```text
duration.fast     100ms   -- hover/press feedback
duration.default  200ms   -- most transitions
duration.slow     320ms   -- sheet/modal enter-exit
easing.standard   cubic-bezier(0.2, 0, 0, 1)
easing.decelerate cubic-bezier(0, 0, 0, 1)
```

tv motion should be **reduced**, not removed — fast, subtle focus transitions only. avoid large
sliding/parallax motion on tv, it reads as laggy on lower-powered tv socs (see requirements.md
§11 on tv thread performance).

---

## 3. the `Box` primitive

`Box` is the only styling primitive. everything else in `packages/ui` renders a `Box` (or a small
tree of them) under the hood.

### 3.1 props

```ts
type BoxProps = {
  // layout
  display?: 'flex' | 'grid' | 'block' | 'inline-flex' | 'none';
  direction?: 'row' | 'column';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  gap?: SpacingToken;

  // spacing
  padding?: SpacingToken;
  paddingX?: SpacingToken;
  paddingY?: SpacingToken;
  paddingTop?: SpacingToken;
  paddingBottom?: SpacingToken;

  // sizing
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;

  // appearance
  background?: SurfaceToken;
  radius?: RadiusToken;
  border?: BorderToken;
  borderWidth?: 'none' | 'thin' | 'thick';
  shadow?: ElevationToken;

  // interaction
  focusable?: boolean;        // renders a border.focus ring on :focus-visible / tv focus
  onPress?: () => void;       // unified click (browser) / ok-button (tv) handler

  as?: React.ElementType;     // escape hatch: render as 'button', 'a', etc.
  children?: React.ReactNode;
};
```

### 3.2 example usage

a card:

```jsx
<Box
  background="surface.raised"
  radius="m"
  padding="l"
  shadow="low"
  direction="column"
  gap="s"
>
  <Text size="title-md" weight="bold">severance</Text>
  <Text size="body-sm" color="content.secondary">
    a mystery thriller series.
  </Text>
</Box>
```

a small pill/chip with a tight radius:

```jsx
<Box
  radius="xs"
  paddingX="xs"
  paddingY="3xs"
  background="spoiler.safe"
  display="inline-flex"
  align="center"
>
  <Text size="caption">episode-only</Text>
</Box>
```

a focusable tv row:

```jsx
<Box
  as="button"
  focusable
  onPress={() => selectEpisode(episode.id)}
  radius="s"
  padding="m"
  background="surface.sunken"
  direction="row"
  align="center"
  gap="m"
>
  <Text size="title-sm">{episode.title}</Text>
</Box>
```

### 3.3 rules for using `Box`

- never pass a raw color, pixel value, or arbitrary tailwind class into `Box` — always a token.
- `focusable` is required on anything with `onPress`. this is how the tv focus ring and the
  browser `:focus-visible` ring both get applied consistently — it is not optional per §1.5.
- `Box` never contains business logic. if a "box" needs state (open/closed, controlled value), it
  graduates into a real component in §6, which composes `Box` internally.
- `Box` never renders text directly. any text content goes through `Text` (§3.4) — this is what
  keeps typography consistent instead of every screen inventing its own font-size/line-height pair.

### 3.4 the `Text` primitive

`Text` is `Box`'s sibling, not a variant of it — it's the only place typography tokens are
allowed to be used. every string of copy in the app, on every screen, on both platforms, renders
through `Text`.

```ts
type TextSize =
  | 'display'
  | 'title-lg'
  | 'title-md'
  | 'title-sm'
  | 'body-lg'
  | 'body-md'
  | 'body-sm'
  | 'caption';

type TextProps = {
  size?: TextSize;              // default: 'body-md'
  weight?: 'regular' | 'medium' | 'bold';   // default: 'regular'
  color?: ContentToken;         // default: 'content.primary'
  align?: 'start' | 'center' | 'end';
  as?: 'p' | 'span' | 'h1' | 'h2' | 'h3' | 'label';  // semantic tag, independent of visual size
  truncate?: boolean;           // single-line ellipsis
  maxLines?: number;            // multi-line clamp, e.g. episode synopses in a card
  children: React.ReactNode;
};
```

two things this enforces on purpose:

- **`size` picks the look, `as` picks the semantics.** a card title can be `<Text as="h3"
  size="title-sm">` — visually small, but still a real heading for screen readers and seo. this is
  why `size` and `as` are separate props instead of one `<h3>`-style component per size: it stops
  the common bug where developers pick heading level for visual size and end up with an
  inaccessible, skipped-heading-level document.
- **no inline size/weight overrides.** if a screen needs a size that isn't in the enum, that's the
  same signal as an unlisted token in §1.2 — extend the enum in `design-tokens`, don't reach for
  an inline style.

```jsx
<Text size="body-lg" color="content.primary">
  {answer.text}
</Text>

<Text size="body-sm" color="content.secondary" maxLines={2}>
  {episode.description}
</Text>

<Text as="h1" size="title-lg" weight="bold">
  {title.name}
</Text>
```

---

## 4. layout primitives (thin `Box` compositions)

these exist purely for readability — each is a `Box` with a fixed `display`/`direction` preset.

```jsx
<Stack gap="m">              {/* Box display="flex" direction="column" */}
<Inline gap="s" align="center">  {/* Box display="flex" direction="row" */}
<Grid columns={3} gap="m">   {/* Box display="grid" */}
```

use `Stack`/`Inline`/`Grid` in feature code instead of raw `Box` with `direction` set manually —
it reads better and makes intent obvious in review. `Box` itself stays available for anything
these three don't cover (backgrounds, radius, borders, one-off layouts).

---

## 5. theming

### 5.1 light / dark

every semantic color token (§2.3) has a light and dark value. theme switching is a single
attribute (`data-theme="dark"`) on the root — components never check the theme directly.

### 5.2 tv theme

the tv app uses a **separate token *values* file**, same token *names*. concretely:
`design-tokens/browser.css` and `design-tokens/tv.css` both define `--spacing-m`,
`--radius-m`, `--font-heading-m`, etc., with platform-appropriate values per §2.1–2.4. the `Box`
component and every composed component are written once and work on both, because they only ever
reference the token name.

---

## 6. component library (built on `Box`)

each of these is documented as: what it is, what makes it a "real" component (not just a styled
box), and its default token usage.

### 6.1 `Button`

real behavior: press state, disabled state, loading spinner swap, keyboard activation.
default styling: `radius='s'`, `padding` scaled to size prop, `background='action.primary.default'`.

```jsx
<Button variant="primary" size="m" onPress={handleAsk}>ask</Button>
```

### 6.2 `Card`

no real behavior beyond an optional `onPress` (making the whole card tappable). mostly a styled
`Box` preset: `radius='m'`, `background='surface.raised'`, `shadow='low'` on browser /
`shadow='none'` + `border='default'` on tv.

### 6.3 `Chip` / `SpoilerBadge`

`SpoilerBadge` is a `Chip` with the spoiler-level color pre-wired (`spoiler.safe` /
`spoiler.caution` / `spoiler.full` per the active mode). this is the component used everywhere the
active spoiler boundary must be visibly shown (requirements.md §7.3 — "the ui must always display
the active boundary").

```jsx
<SpoilerBadge mode="episode-only" />
```

### 6.4 `TextInput`

real behavior: controlled value, validation error state, focus management.
styling: `radius='s'`, `background='surface.sunken'`, `border='default'` default /
`border='focus'` on focus.

### 6.5 `FocusRow`

tv-primary component (also used in browser list views for consistency): a `focusable` `Box` row
used for search results, episode lists, settings rows. this is the single component responsible
for making remote-control navigation work correctly — see requirements.md §11.

### 6.6 `Prose`

the *only* component allowed to render ai-generated or provider-supplied text that might contain
markdown/html-like content. it sanitizes before rendering (requirements.md §13 — "no raw model
output injected into the dom"), then renders the sanitized output through `Text` (default
`size="body-lg"`, per §2.4's note that companion answers are the one place body text should read
easily at a glance). never use `Box` or `Text` with `dangerouslySetInnerHTML` directly in feature
code — always go through `Prose`.

### 6.7 `ChatBubble`

composes `Box` (bubble shape: `radius='m'`, `background` varies by `role='user' | 'assistant'`)
+ `Prose` (for the message content) + `SpoilerBadge` (when `containsSpoilers` info needs
surfacing) + follow-up question chips built from `Chip`.

### 6.8 `QrPairingPanel`

composes `Box` (`radius='l'`, `background='surface.raised'`, generous `padding='xl'` since it's
typically shown full-screen on tv) + the qr image + a `FocusRow`-based cancel action.

---

## 7. accessibility & focus rules (cross-cutting, restated from principle 5)

- every `focusable` box must have a visible `border.focus` state distinct from its resting border.
- tv: focus must be programmatically settable on screen entry (e.g. the first `FocusRow` in a
  list focuses automatically when the screen mounts) — a tv user must never land on a screen with
  no visible focus target.
- browser: never remove the default focus outline without replacing it with the `border.focus`
  token — this is a common accessibility regression and should be treated as a lint-level rule if
  the team sets one up.
- color is never the only signal for spoiler level — `SpoilerBadge` always pairs its color with a
  text label ("episode-only", not just a colored dot), for colorblind users and for the tv's
  potential accessibility profile.

---

## 8. file layout for the token + component packages

```text
packages/
├── design-tokens/
│   ├── tokens.ts          -- typed token definitions (spacing, radius, color, type, motion)
│   ├── browser.css         -- css custom properties, browser values
│   ├── tv.css               -- css custom properties, tv values
│   └── tailwind-preset.ts  -- maps tokens.ts into a tailwind theme extension
│
└── ui/
    ├── Box.tsx
    ├── Text.tsx
    ├── Stack.tsx
    ├── Inline.tsx
    ├── Grid.tsx
    ├── Button.tsx
    ├── Card.tsx
    ├── Chip.tsx
    ├── SpoilerBadge.tsx
    ├── TextInput.tsx
    ├── FocusRow.tsx
    ├── Prose.tsx
    ├── ChatBubble.tsx
    └── QrPairingPanel.tsx
```

`apps/web` and `apps/tv` both import from `packages/ui` and `packages/design-tokens`. neither app
should define its own one-off styled component that duplicates something `Box` already covers —
if a screen seems to need that, it's a sign a token or a `Box` preset is missing, and the fix goes
into `packages/ui`, not into the app.
