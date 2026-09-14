# Design system — Centralized Support Ticket System

This covers both surfaces: the **agent dashboard** (data-dense, internal tool) and the
**widget + status page** (public-facing, must look clean embedded in arbitrary client sites).

## 1. Design principles

- **Dashboard = information density done cleanly.** Agents live here all day — prioritize
  scannability (tables, badges, filters) over decoration.
- **Widget = minimal footprint.** It's a guest inside someone else's product. No heavy
  branding, no animation that fights the host site, small bundle size.
- **Status colors carry real meaning.** A stage's configured `color` is used consistently
  everywhere that stage appears — badge in dashboard, badge on status page, accent in email.

## 2. Tailwind config — design tokens

```js
// tailwind.config.ts (shared base, extend per app)
export default {
  theme: {
    extend: {
      colors: {
        // Neutral scale — dashboard backgrounds, borders, text
        surface: {
          0: '#FFFFFF',
          1: '#F7F7F5',
          2: '#EFEEEA',
        },
        border: {
          DEFAULT: '#E2E1DC',
          strong: '#C7C6BF',
        },
        text: {
          primary: '#1F1E1B',
          secondary: '#5B5A54',
          muted: '#8B8A82',
        },
        // Brand accent — used sparingly: primary buttons, active nav, links
        brand: {
          50: '#EEF2FF',
          500: '#4F46E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        // Semantic — reserved for real states, not decoration
        success: { 50: '#EAF3DE', 600: '#3B6D11' },
        danger:  { 50: '#FCEBEB', 600: '#A32D2D' },
        warning: { 50: '#FAEEDA', 600: '#854F0B' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
};
```

**Rule**: stage colors are **stored per-project as hex values**, not mapped to a fixed Tailwind
palette — an admin picks any color when configuring a stage. Render those as inline
`style="background-color: ..."` on badges, with the dashboard computing a readable text color
(light/dark) from the hex at render time rather than hardcoding white/black.

## 3. Typography

| Use | Size | Weight |
|---|---|---|
| Page title | 20px | 600 |
| Section heading | 16px | 600 |
| Body / table text | 14px | 400 |
| Label / meta text | 12px | 500 |
| Widget form labels | 14px | 500 |

Line height 1.5 for body text, 1.2 for headings. Don't go below 12px anywhere, including
badges — the widget will render at unpredictable host-page zoom levels.

## 4. Core components (dashboard)

- **StageBadge** — pill, `bg: stage.color @ 12% opacity`, `text: stage.color darkened`,
  12px medium text, used in ticket list, ticket detail header, and filters.
- **TicketTable** — columns: ticket number, subject/first field, requester email, stage badge,
  updated-at (relative time). Sticky header, row hover state, click → ticket detail.
- **FieldBuilder** (project create/edit) — sortable list of `FormFieldDefinition` rows, each
  with a type dropdown, label input, required toggle, and (conditionally) an options editor
  for dropdown/radio. Drag handle for reordering — reordering just updates `order`.
- **StageBuilder** — same pattern for `StageDefinition`: sortable rows with name, color
  picker, default/terminal toggles, and an expandable email-template editor
  (subject input + textarea with a token cheat-sheet: `{{ticketNumber}}`, `{{stageName}}`,
  `{{statusUrl}}`).
- **EmptyState** — every list view (no tickets yet, no projects yet) gets an icon + one-line
  copy + primary action, never a bare blank table.

## 5. Widget & status page components

- **Trigger button** — fixed position (bottom-right default, configurable later), single
  brand color, icon + optional label, `z-index` high enough to sit above host content but
  never `position: fixed` tricks that break on mobile Safari — test on real devices.
- **Dynamic form** — renders straight from `formFields`, in `order`. Every input has a real
  `<label>` (never placeholder-as-label). Submit button disabled until required fields valid.
- **Confirmation screen** — checkmark icon, "We got it — check your email for updates,"
  ticket number shown for reference.
- **Status page** — stage badge at top, a simple vertical timeline of `stageHistory` (dot +
  stage name + timestamp per entry), read-only view of the original submitted fields below.

## 6. Accessibility baseline

- Every form input: real `<label for="">`, not just placeholder text.
- Color is never the only signal — stage badges pair color with the stage name text, not
  color alone.
- Focus states visible on every interactive element (`focus-visible:ring-2`) — don't strip
  Tailwind's default outline without replacing it.
- Contrast: body text at least 4.5:1 against its background; verify custom stage colors
  against their badge background programmatically (simple luminance check) rather than by eye.

## 7. Icons

Use `lucide-react` — consistent stroke-based icon set, tree-shakeable, matches a clean
dashboard aesthetic without extra licensing concerns.

## 8. What to avoid

- No heavy shadows/gradients on the widget — it needs to look native-ish inside very
  different host sites, not like a branded overlay.
- No modal-heavy flows in the dashboard for anything frequent (stage change should be an
  inline dropdown on the ticket, not a modal).
- Don't hardcode the 4-5 "common" stage names anywhere in component code — every dashboard
  view must render stage name/color from project config, since stages are fully custom
  per project.
