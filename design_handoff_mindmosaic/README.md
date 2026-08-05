# Handoff: MindMosaic — marketing site, auth, and in-product screens

## Overview

MindMosaic is an Australian learning platform for Years 1–12 covering the Australian
Curriculum, Singapore Maths, and assessment-style preparation (NAPLAN-, ICAS-, AMC-
and selective school entry-style). This bundle contains ten screens: five public
marketing pages, two authentication screens, and three in-product screens.

## About the design files

**The files in this bundle are design references created in HTML.** They are
prototypes showing intended look and behaviour — not production code to copy.

The task is to **recreate these designs in the target codebase's existing
environment**, using its established patterns, component library and styling
approach. If no environment exists yet, choose the framework appropriate to the
project and implement there.

Each `.dc.html` file opens directly in a browser. They use a small runtime
(`support.js`) that renders a template plus a logic class; treat the template as
markup structure and the logic class as the component's state and derived values.
Do not port the runtime — port the design.

**Before implementing, read `Claude Code prompt — auth screens and repo audit.md`
in the parent project folder.** The client already has a partial implementation and
was not happy with it. That prompt produces a `DESIGN_AUDIT.md` of what exists so
these designs can be reconciled with the real fields, copy and routes rather than
replacing them blind. The Log in and Sign up screens here are explicitly speculative
on field names and validation.

## Fidelity

**High fidelity.** Final colours, typography, spacing, interaction states and copy.
Recreate pixel-accurately using the codebase's own libraries. Two caveats:

- **Photography is placeholder.** Every `<image-slot>` is an empty drop zone with a
  written description of what belongs there. Real learner photography and product
  screenshots have not been supplied. The descriptions in each slot's `placeholder`
  attribute are the art direction brief.
- **Auth field inventory is unverified** (see above).
- Designed at desktop widths only (1440 reference). Marketing pages use fluid
  `clamp()` and `auto-fit` grids so they degrade sensibly, but mobile has not been
  designed or reviewed. Ask before shipping mobile.

## Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| Plum ink | `#2A1145` | Auth panel background, darkest surface |
| Brand purple | `#5925A8` | Primary. "Mind" wordmark, buttons, links, active states |
| Purple hover | `#4A1E8D` | Primary button hover |
| Lavender | `#C9B6E4` | Accent on dark, secondary progress bars, "Mind" on dark |
| Lavender tint | `#F3EEFA` | Section background, badge fills, icon wells |
| Lavender tint 2 | `#EFEAF4` | Disabled button fill, mosaic strip |
| Lavender wash | `#FBF8FE` | Selected row, explanation panel background |
| Coral | `#FF555A` | "Mosaic" wordmark, accent rules, alert tiles, negative bars |
| Coral text | `#D8323A` | Error text on light (AA at 14px+) |
| Coral deep | `#98262C` | Error text inside error panel |
| Coral wash | `#FFF1F1` | Error panel, flagged question fill |
| Coral border | `#FFD3D4` | Error panel border |
| Paper | `#FCFBF8` | Page background |
| White | `#FFFFFF` | Card surface |
| Ink | `#18151F` | Body text, headings |
| Ink 2 | `#3D3846` | Secondary text, nav labels |
| Muted | `#625D69` | Body secondary, captions |
| Muted 2 | `#928C99` | Labels, disabled text |
| Border | `#E9E4ED` | Default border, dividers |
| Border light | `#F1EDF5` | Row dividers, track fill |
| Border lavender | `#DFD3EE` | Border on lavender surfaces |

Wordmark: "Mind" in `#5925A8` (or `#C9B6E4` on dark), "Mosaic" in `#FF555A`.
Note `#FF555A` on `#FCFBF8` is 3.03:1 — acceptable for the logo, **not** for body text.

### Typography

- **Display / headings:** Instrument Sans, weights 400–800, `letter-spacing: -0.028em`
  (headings), `-0.03em` to `-0.04em` on large display sizes.
- **Body / UI:** Geist, weights 300–700.
- **Numeric and code-like:** `ui-monospace, Menlo, monospace` — timers, scores,
  answer inputs, eyebrow labels.

Scale as used:

| Role | Size | Weight | Line height |
|---|---|---|---|
| Page h1 (marketing) | `clamp(34px, 4.2vw, 56px)` | 700 | 1.06 |
| Section h2 | `clamp(26px, 3vw, 40px)` | 700 | 1.12 |
| Card h3 | 17–21px | 700 | 1.3 |
| Body large | 18px | 400 | 1.6 |
| Body | 16–16.5px | 400 | 1.6 |
| Body small | 14–15px | 400 | 1.55 |
| Caption | 13–13.5px | 400 | 1.6 |
| Eyebrow | 11.5–12px | 700 | — · `letter-spacing: 0.1em–0.14em`, uppercase |
| Stat / timer | 26–40px | 800 (Instrument Sans) or 700 (mono) | 1 |

### Spacing, radius, shadow

- Page gutter: `clamp(20px, 4vw, 64px)`; content max width `1440px`.
- Section padding: `clamp(40px, 4vw, 64px) 0`; hero `clamp(36px, 3.5vw, 56px)`.
- Grid gaps: `clamp(16px, 1.8vw, 24px)` cards, `clamp(24px, 3vw, 56px)` two-column.
- Card padding: `clamp(20px, 2.4vw, 32px)`.
- Radius: 20px large cards, 18px panels, 16px cards, 13–14px inputs and small cards,
  10–11px buttons and chips, 9px tags, 3px mosaic tiles.
- Shadow, primary button: `0 6px 18px rgba(89,37,168,0.22)`.
- Shadow, featured plan card: `0 8px 30px rgba(89,37,168,0.10)`.
- Minimum hit target 44px throughout. Inputs 52–54px tall.

### Motion

- `mmRise` — `opacity 0→1, translateY(10px)→0`, 0.25–0.3s ease. Panel and step entry.
- `mmTile` — opacity 0.22→0.9→0.22, 5–12s ease-in-out, staggered 0–4s delay,
  infinite. The auth mosaic field.
- Explanation reveal in Practice: `mmIn`, 0.18s ease, same transform.
- Chevron rotate on `<details>` open: 0.18s ease, `rotate(45deg)`.

## Shared components

### MMHeader (`MMHeader.dc.html`)
76px tall, `#FCFBF8` at 95% alpha, 1px `#E9E4ED` bottom border. Logo (38px brain mark
+ wordmark) → nav (Learn, Practice, Exam Preparation, How It Works, Plans, Resources,
About) → right group (Log in text link, "Start free" filled purple button).

Active nav item: `#5925A8` text plus `box-shadow: inset 0 -2px 0 #FF555A` and
`aria-current="page"`. Inactive `#3D3846`, hover `#5925A8`. Takes one prop, `active`,
matching a route id.

### MMFooter (`MMFooter.dc.html`)
Five link columns: Platform, Programmes, Resources, Company and legal, plus a brand
column. Below them a 16-cell decorative mosaic strip (10px tall, 6px gap, purple /
lavender / coral / `#EFEAF4`), then the legal block.

The legal paragraph is a **compliance requirement, not decoration** — it states
MindMosaic is independent, that assessment-style material is original and not official
past papers, and that NAPLAN/ICAS/AMC/selective names describe style only. Carry it
verbatim and have it re-approved before production. Same for the wording of
`/privacy`, `/terms` and `/assessment-disclaimer`, which are stubs here.

### MMPageNav (`MMPageNav.dc.html`)
A prototype navigation aid, present on every screen. Row one: Back (history), Home,
then Previous / Next through the screen sequence. Row two: every screen as a chip,
current one highlighted, plus Log in and Sign up.

**This is scaffolding for reviewing the prototype. Do not ship it.** Real navigation
is MMHeader on marketing pages and the sidebar/app header in product.

## Screens

### 1. Landing (`MindMosaic Landing.dc.html`)
Marketing home. Hero with a full-height image bleeding off the right gutter,
credibility section on lighter plum-ink, ten quality-check tiles (second row all
coral), 14 question-type tiles, tabbed interactive previews, plans, FAQ. Pricing copy
was removed from the plans section at the client's request — the Plans page carries it.
FAQ ends with a link line to Help Centre, Privacy, Terms and Assessment Disclaimer.

### 2. How It Works (`MindMosaic How It Works.dc.html`)
Three-mode explanation (Learn / Practice / Exam simulation) as image-topped cards, a
video tutorial section (one 16:9 hero placeholder with a 76px purple play badge plus
three 132px-thumbnail clip rows — all placeholders, videos to be supplied), a
five-step first-week list, and the ten-item quality grid on `#F3EEFA`.

### 3. Plans (`MindMosaic Plans.dc.html`)
Three cards: free trial `$0` / 7 days; **monthly `$14.99` AUD**, bordered 2px
`#5925A8` with a "Most families choose this" tab and elevation; **family year `$149`**
AUD with a coral eyebrow. Then a nine-row comparison table (zebra `#fff` / `#FCFBF8`,
`#F3EEFA` header) and five billing FAQs. All prices AUD inc. GST; billing and refund
terms need legal approval.

### 4. Resources (`MindMosaic Resources.dc.html`)
Learning Hub library. Search field, seven category tabs (All, Maths, English, Exam
skills, Singapore Maths, For parents, Study habits) filtering a nine-card grid, one
featured guide in a split card, then a Help Centre index of six link cards.
Filtering is client-side over a static list in the logic class.

### 5. About (`MindMosaic About.dc.html`)
Why-we-built-it narrative, six principle tiles (every third one inverted to solid
`#5925A8`), a five-step content pipeline on `#F3EEFA`, a plain-terms privacy summary,
and a contact form (name, email, message — placeholder, no endpoint).

### 6. Log in (`MindMosaic Log in.dc.html`)
Split layout, `1.05fr / 1fr`. Left: `#2A1145` panel with a 12-column animated mosaic
field of `aspect-ratio: 1` tiles at 34% container opacity, a vertical scrim gradient
(`rgba(42,17,69,0.55)` → `0.94`) so text stays legible while tiles animate, logo top,
value copy centre, disclaimer bottom.

Right: Parent / Student segmented control inside a `#F3EEFA` pill. The identity field
label and placeholder swap with it (email vs student username), as does the error
message and submit label. Password field with an inline Show/Hide button. Custom
checkbox for "keep me signed in", default on. Error state sets a `#FF555A` input
border and renders a `role="alert"` panel. Empty fields on submit trigger the error;
valid submit routes parent → Landing, student → Learn. Below: a divider, then school
access code and one-time email link options.

### 7. Sign up (`MindMosaic Sign up.dc.html`)
Split `0.85fr / 1.15fr`, same mosaic panel treatment with a 10-column field. The left
rail is the step tracker: done steps get a coral `#FF555A` tile with a tick, current
gets lavender `#C9B6E4` on plum, upcoming gets `rgba(255,255,255,0.10)`.

Three steps in one card, with a three-segment progress bar above:

1. **Parent account** — first name, last name, email, password with a live strength
   meter (0 / <6 "Too short" coral / <10 "Getting there" lavender / else "Strong"
   purple), and a required consent checkbox. The primary button is disabled
   (`#EFEAF4` on `#928C99`, `not-allowed`) until consent is ticked.
2. **Add a student** — first name, single initial, a 12-button year-level grid, an
   eight-button state/territory row. Has a "Skip for now" secondary.
3. **First programme** — four radio cards (Australian Curriculum, Singapore Maths,
   Exam-style preparation, Let the platform decide) and a what-happens-next panel
   restating the trial terms and prices.

Back on step 1 leaves to Landing; otherwise it decrements. Step 3 primary reads
"Start the 7-day trial" and routes to Learn.

### 8. Learn (`MindMosaic Learn.dc.html`)
Logged-in. 264px sticky sidebar: logo, student chip (initials tile, name, year), Modes
nav (Learn active, Practice, Exam preparation, Learning Hub), a "This week 4 of 5"
lavender panel, and a Site nav group (Home, How It Works, Plans, About, Parent view).

Main: 72px sticky header (eyebrow + programme h1, truncating with ellipsis; right
group `flex:none` with Home, Change programme, Practise this skill). Then a continue-
lesson card with a 16:9 screenshot slot, a pathway-progress panel of four labelled
bars, a "worth revisiting" pair, a lesson list, and three next-step cards.

The lesson list is driven by a programme tab set (Australian Curriculum / Singapore
Maths / English) and renders three row states — done (tick, `#F3EEFA` tile, Review),
current (`#FBF8FE` row, solid purple tile, Resume), not started (outlined tile, Start).

### 9. Practice (`MindMosaic Practice.dc.html`)
Question-answering loop, no timer. 72px header: logo, skill breadcrumb (ellipsis
truncation), then a `flex:none` 230px progress block ("Question 4 of 10" / "2 correct
so far", `white-space: nowrap`) and Home + Exit to Learn.

Body `1fr / 320px`. Question card: type badge, skill line, Flag for review, question
h1, a stimulus image slot (`fit="contain"`), then four option buttons.

Option states — idle `#E9E4ED` border; selected `#5925A8` border on `#FBF8FE`;
after submit the correct option goes purple on `#FBF8FE` labelled "Correct", and a
wrong pick goes `#FF555A` on `#FFF6F6` labelled "Your answer". Letter tile fills
purple when selected or correct.

Submit is disabled until an option is picked. On submit an explanation panel animates
in: verdict eyebrow (purple "Correct" or `#D8323A` "Not quite"), a written
explanation, four numbered step tiles, then Next question / Try again / Read the
lesson. A ten-button question strip sits below the card.

Sidebar: this-set stats, question types in the set as chips, and a lavender
"ready for exam conditions" prompt.

### 10. Exam Preparation (`MindMosaic Exam Preparation.dc.html`)
Four screens behind a view switcher (the switcher is prototype scaffolding — in
product these are separate routes).

- **Programme overview** — next scheduled simulation card, readiness-by-skill bars,
  four format cards (NAPLAN-, ICAS-, AMC-, selective entry-style; the last carries a
  coral "Coverage being confirmed" note), recent papers table.
- **Jurisdiction picker** — eight state/territory tiles, each with a Confirmed
  (`#F3EEFA`/purple) or Being confirmed (`#FFF1F1`/`#D8323A`) badge, selected tile at
  `#5925A8` border on `#FBF8FE`; a sticky detail aside for the selection. Only NSW,
  VIC and WA are marked confirmed — the rest must not imply coverage.
- **Simulation in progress** — a `#DFD3EE` condition bar with a coral "Exam conditions"
  eyebrow, a mono `28:14` countdown, autosave state, Pause and exit. Numeric-entry
  question with a 56px mono input, a toggling flag button, Previous / Next /
  Review before submit. Sidebar: a 20-cell question grid in four states (answered,
  flagged, current, blank) with a legend, and a conditions note.
- **Results and explanations** — four summary tiles (Score solid purple, Unanswered
  solid coral, two outlined), by-skill bars, then a filterable question review
  (All / Incorrect only / Flagged) where each row carries the mark, skill, worked
  explanation, the student's answer against the correct one, and a link to the lesson.
  Incorrect rows tint `#FFFBFB`. Ends with a suggested-next-steps panel.

## Interactions and state

All state is local to each screen; nothing is fetched. Per screen:

- **Log in** — `role` (Parent | Student), `ident`, `pw`, `show`, `remember`, `error`.
- **Sign up** — `step` (1–3), `pw`, `agreed`, `year`, `st`, `prog`.
- **Learn** — `prog` (which programme's lesson list shows).
- **Practice** — `picked` (option index or null), `submitted`, `q`.
  Correct answer is index 2. Submit gates on `picked !== null`.
- **Resources** — `cat` (category filter).
- **Exam Preparation** — `view`, `jur`, `flagged`, `answer`, `filter`.

Focus is visible everywhere: `outline: 3px solid #5925A8; outline-offset: 3px`.
Every interactive control has a hover state; buttons and links state them explicitly.

## Accessibility notes carried in the markup

`aria-current="page"` on active nav; `role="tablist"`/`tab` with `aria-selected` on
segmented controls; `role="radiogroup"`/`radio` with `aria-checked` on Practice
options; `role="checkbox"` with `aria-checked` on the custom checkboxes;
`aria-pressed` on the year, state, jurisdiction and programme toggles;
`role="alert"` on the login error; `aria-label` on every question-grid cell;
`aria-hidden` on all decorative tiles, rules and mosaic fields.

Contrast: body text meets AA. `#FF555A` is logo-only. The auth mosaic sits under a
scrim precisely so the animation cannot drop text below AA mid-cycle — keep the scrim
if you keep the animation.

## Assets

`assets/` holds the brain logo mark plus the photography already dropped in on the
landing page. Every other image position is an `<image-slot>` placeholder describing
what it needs. The logo mark is rendered via
`background-size: 290% auto; background-position: 50% 46%` to crop to the glyph —
replace with a proper cropped SVG when one is available.

No icon library is used. The few glyphs in the design are text characters
(`←` `→` `⌂` `⌕` `▶` `✓` `✕` `+`) — swap them for the codebase's icon set.

## Files in this bundle

Screens: `MindMosaic Landing.dc.html`, `MindMosaic Learn.dc.html`,
`MindMosaic Practice.dc.html`, `MindMosaic Exam Preparation.dc.html`,
`MindMosaic How It Works.dc.html`, `MindMosaic Plans.dc.html`,
`MindMosaic Resources.dc.html`, `MindMosaic About.dc.html`,
`MindMosaic Log in.dc.html`, `MindMosaic Sign up.dc.html`.

Shared: `MMHeader.dc.html`, `MMFooter.dc.html`, `MMPageNav.dc.html`.

Support: `support.js` (prototype runtime — do not port), `image-slot.js` (placeholder
drop zones — do not port), `assets/`.

### Screenshots (`screenshots/`)

Captured at the review viewport, not 1440 — treat them as a visual index, and take
measurements from the token tables above rather than from the pixels.

| File | Shows |
|---|---|
| `01-landing.png` | Landing, top of page |
| `02-how-it-works.png` | How It Works, top of page |
| `03-plans.png` | Plans, three pricing cards |
| `04-resources.png` | Resources, hub search and categories |
| `05-about.png` | About, top of page |
| `06-log-in.png` | Log in, Parent tab, idle |
| `07-sign-up-step-1-parent-account.png` | Sign up step 1, consent ticked |
| `07-sign-up-step-2-add-student.png` | Sign up step 2, year and state pickers |
| `07-sign-up-step-3-programme.png` | Sign up step 3, programme radio cards |
| `08-learn.png` | Learn, sidebar and continue-lesson card |
| `09-practice-unanswered.png` | Practice, options idle, submit disabled |
| `09-practice-explanation-shown.png` | Practice, correct answer submitted, explanation revealed |
| `10-exam-01-overview.png` | Exam Prep, programme overview |
| `10-exam-02-jurisdiction-picker.png` | Exam Prep, jurisdiction tiles with coverage badges |
| `10-exam-03-simulation-in-progress.png` | Exam Prep, timed simulation with question grid |
| `10-exam-04-results.png` | Exam Prep, results and question review |

Not captured, but specified above: Practice with a wrong answer submitted, Log in
Student tab, Log in error state, Resources category filtering, Learn programme tabs.

## Open items for the client

1. Real learner photography and product screenshots for every `<image-slot>`.
2. Tutorial videos for the How It Works section.
3. Legal sign-off on the footer disclaimer, `/privacy`, `/terms`,
   `/assessment-disclaimer`, and the billing and trial terms on Plans.
4. Confirmation of selective entry coverage for QLD, SA, TAS, ACT and NT before
   those jurisdictions lose the "Being confirmed" badge.
5. The repo audit, so Log in, Sign up and onboarding match the real implementation.
6. A decision on mobile: not designed yet.
