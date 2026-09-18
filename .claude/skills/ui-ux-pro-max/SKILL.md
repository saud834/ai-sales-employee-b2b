---
name: ui-ux-pro-max
description: Use this skill for ANY interface work in this repository — building or editing pages, components, layouts, forms, navigation, buttons, or visual design, in either the internal builder tool (app/, components/) or the generated-website component library (lib/components/). Trigger it even when the request doesn't say "UI" or "design" explicitly, e.g. "add a page", "fix this button", "make the dashboard nicer", "the form doesn't do anything", "add a section". Enforces this repo's real design system (CSS custom-property theme tokens, Tailwind config, shared ui.tsx primitives), forbids generic/templated layouts and placeholder or dead interactions, requires accessible controls, and requires verifying responsive behavior and running the project's checks before considering the work finished.
---

# UI/UX standards for this repo

This repo is two UI systems living side by side — know which one you're in before you touch anything:

1. **The tool's own chrome** (`app/`, `components/`) — the AI Sales Employee dashboard, leads list, project list, and the builder shell. Styled directly with Tailwind's default slate palette (`bg-slate-50`, `text-slate-900`, `rounded-2xl`, `shadow-sm`, etc.). This is a normal SaaS app UI.
2. **The generated-website component library** (`lib/components/`) — Navbar, Hero, Menu, Reservation, and the rest, plus `SiteRenderer.tsx` and the shared primitives in `ui.tsx`. These never use Tailwind's default color classes. They're styled entirely through the theme's CSS custom properties (`--color-primary`, `--color-accent`, `--color-surface`, `--color-ink`, `--font-heading`, `--font-body`, `--radius`, `--density`), mapped in `tailwind.config.ts` to classes like `bg-primary`, `text-ink`, `rounded-site`. This is what lets a generated site's theme (colors, fonts, density) change at runtime without touching component code — mixing in a hardcoded `bg-blue-600` or `text-slate-900` here breaks that and will look wrong the moment someone picks a different theme or dark mode.

Don't blend the two. A component headed for `lib/components/` that reaches for `slate-*` classes is a bug, not a style choice.

## Before changing anything

Read before you write:
- `lib/components/registry.tsx` and `lib/components/ui.tsx` — the existing component set and shared primitives (`Container`, `SectionHeading`, `Btn`, `ImageBox`, `Stars`). If what you need already exists as a primitive, use it; don't hand-roll a second version of a button or a card.
- `lib/components/i18n.ts` — the small translation table (`t(lang, key)`) that backs microcopy (form labels, confirmations) in bilingual components like `Contact.tsx` and `Reservation.tsx`. Any new user-facing string in `lib/components/` that isn't content-driven (i.e. not already coming from the section's `props`) belongs here, in both languages, not hardcoded in English.
- `lib/components/SiteRenderer.tsx` — how `dir`, `lang`, and theme tokens actually get applied per page. A `PageSpec` can override the site's language/direction per page (used for the AR/EN bilingual pattern); don't assume `spec.meta.direction` is authoritative if you're inside a component that receives `page`.
- `tailwind.config.ts` `content` globs — they currently cover `app/`, `lib/`, and `components/`. A new top-level directory with its own `.tsx` files won't get its Tailwind classes generated unless its glob is added here. This has silently broken the builder's layout once already in this project — if a page renders with none of its classes applied, check this file before anything else.

For architectural changes (new shared primitive, new theme token, restructuring how a section is composed), look at how the existing sibling components solve the same problem first. Consistency with what's already there beats a locally "cleaner" one-off.

## No generic or templated layouts

Every section should look like it was designed for this specific business's content, not dropped in from a generic template — this is a real product for real businesses; genericness is the thing it's supposed to avoid. Concretely:
- Reuse `Container`/`SectionHeading` for structure and spacing rhythm rather than inventing new padding/margin conventions per component.
- Let content drive layout decisions (e.g. `Menu.tsx` only renders an image slot when `item.image !== undefined`, so a menu without photos doesn't show empty placeholder boxes). Don't force every section into the same card-grid shape regardless of what it's showing.
- When adding a new section type, check whether it's genuinely different from the ~22 existing ones before adding a 23rd — a near-duplicate of `Features` with different field names is a sign to extend the existing component instead.

## No placeholder or non-functional interactions

If it looks clickable, it must do something real — this codebase already has working patterns for the common cases, use them instead of stubbing something out:
- Forms that should submit somewhere real do (`ChatPanel.tsx`, `PropertiesPanel.tsx`, and the API routes under `app/api/` all follow fetch → loading state → success/error state). A new form needs the same three states, not just a submit handler that does nothing.
- WhatsApp/contact actions build a real deep link from real data (see `Reservation.tsx`'s `wa.me` link construction) rather than a static `href="#"`.
- Never ship a button, tab, or link with no handler "for now" — either wire it to its real behavior or don't add it yet.

## Accessible controls

This repo already has the patterns; match them rather than inventing new ones:
- Semantic elements: `header`/`nav`/`main`/`section`/`footer`, not `div` soup.
- Every icon-only or ambiguous control gets an `aria-label` (see the mobile menu toggle in `Navbar.tsx`).
- Interactive elements get a visible focus state — the established pattern is `focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent` (or `outline-offset-2` for buttons). Don't remove focus outlines without replacing them.
- Prefer a native element that already has the behavior you need over rebuilding it with ARIA and JS — `FAQ.tsx` uses `<details>/<summary>` specifically to get free keyboard support and no JS.
- Every image needs real alt text — this is enforced at the schema level (`lib/schema.ts` requires non-empty `alt` on gallery/team/product images), so don't work around it with an empty string.
- Color choices must come from theme tokens, not literals, so contrast stays correct across whatever theme a project ends up with.

## Consistent component styling

- In `lib/components/`: only theme-token classes (`bg-primary`, `text-accent`, `text-ink`, `bg-surface`, `rounded-site`, `font-heading`/`font-body`) — no arbitrary hex values, no default Tailwind color palette.
- In `app/`/`components/` (tool chrome): stay within the existing slate + white palette already used across the dashboard, leads, and builder screens — don't introduce a second accent color for the tool itself.
- Respect `dir`/RTL: prefer logical Tailwind/CSS properties (`ms-`/`me-`/`ps-`/`pe-`, `text-start`/`text-end`, or plain flow that mirrors naturally) over physical `left`/`right`/`ml-`/`mr-` in anything that renders inside `SiteRenderer` — the bilingual Arabic pages depend on this.

## Verify responsive behavior

Check mobile (~390px), tablet (~768px), and desktop (~1280px+) before calling UI work done:
- For generated-site components, use the builder's device toggle in `components/DeviceToggle.tsx` (desktop/tablet/mobile) against the live `/preview/[projectId]` route, or open that route directly at different viewport sizes.
- For the tool's own chrome, resize manually — the layout is plain Tailwind responsive classes (`sm:`/`md:`/`lg:` breakpoints), not a separate mobile build.
- No layout should produce horizontal scroll at any of these widths; if it does, that's a bug to fix before finishing, not a follow-up.

## Before finishing

Run, from the repo root:
```bash
npm run typecheck
npm run build
```
Both must pass clean. If the change touches `lib/components/` or `SiteRenderer.tsx`, also sanity-check the actual rendered output at `/preview/[projectId]` (or the exported standalone project via the export endpoint) rather than trusting the type check alone — a component can type-check fine and still render visually broken content.
