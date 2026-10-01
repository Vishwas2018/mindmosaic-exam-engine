# MindMosaic Design Reference

**Status:** **MANDATORY CANONICAL DESIGN CONTRACT — governs all future MindMosaic development until explicitly overridden by the product owner**  
**Version:** 2.2  
**Baseline date:** 12 September 2026 (v2.0) · **Updated:** 15 September 2026 (v2.1 — added §28 Data & Question Visuals; added data-series tokens to §32; noted machine-readable token companion) · 26 September 2026 (v2.2: added §29 Future AI-Assisted Learning; future AI features appear only as labelled, non-functional concepts)  
**Product:** MindMosaic  
**Reference implementation:** Current `main` implementation of `Vishwas2018/mindmosaic-exam-engine`, corresponding to the current Vercel application  
**Primary purpose:** Ensure every new screen, route, component, feature, state, and user-facing change looks and behaves like it belongs to the existing MindMosaic product rather than introducing a new design language.

> [!IMPORTANT]
> **This document is mandatory for all future MindMosaic development.** Every implementation agent (Claude Code, Codex, Stitch, Antigravity, human developer, or other tool) must read and follow it before designing or changing user-facing functionality. It remains in force until the product owner explicitly calls out an exception or replaces this document. Silence, convenience, an agent preference, a framework default, an imported template, or an older repository document is **not** an override.

### Governance rule

For every future change:

1. **Follow this document by default.**
2. Reuse the closest existing MindMosaic pattern before creating anything new.
3. Preserve established behaviour on untouched surfaces.
4. If a requirement conflicts with this document, stop treating the conflict as a design decision and flag it explicitly in the implementation notes.
5. Only an explicit owner instruction may override a rule here.
6. An approved exception applies only to the specifically called-out feature/surface unless the owner says it changes the design system globally.

This contract governs visual design, typography, colour, spacing, components, states, responsive behaviour, accessibility, interaction patterns, content presentation, and design consistency. Backend-only work must not silently change or regress the user-facing contract.

### Machine-readable companion

A machine-readable token companion exists (`mindmosaic.tokens.json` / `mindmosaic.tokens.css` / a tool-consumable `DESIGN.md` front-matter file) derived from this document. **This prose document is the source of truth**; the token files simply expose the same decisions to tooling. If a token file ever disagrees with this document, this document wins, and the token file is corrected — not the other way around. Do **not** adopt an auto-generated token file (Stitch/Figma/Material export) that introduces Plus Jakarta Sans, a `#41008C` primary, a `#fef7ff` surface, or a Material `surface-container-*`/`inverse-*`/`tertiary` ladder; those are off-contract drift.

---

## 1. Core Instruction

**Do not redesign MindMosaic. Extend it.**

The current application is the visual source of truth. New work must reuse its established:

- colour language;
- surface hierarchy;
- layout widths and gutters;
- card treatments;
- button treatments;
- navigation behaviour;
- border and radius language;
- icon style;
- interaction states;
- density and spacing;
- responsive behaviour;
- accessibility conventions;
- restrained motion.

The **only intentional forward-looking visual change introduced by this contract is typography**:

> **Canonical future typography: Geist for body/UI text and Instrument Sans for headings/display text.**

The current repository still contains legacy/general product surfaces using DM Sans and a very small number of DM Serif Display exceptions. Those are **current-state implementation details, not the future design direction**. Do not perform a wholesale migration merely to satisfy this document; migrate typography when a screen is new, substantially redesigned, or explicitly included in the scope of work.

The MindMosaic logo/wordmark is a fixed brand asset and is **not** to be re-typeset or altered as part of this typography direction.

---

# 2. Design Character

MindMosaic should feel:

- premium but approachable;
- educational without being childish;
- modern but not futuristic;
- calm and trustworthy;
- polished without looking like a generic AI/SaaS template;
- spacious without wasting screen area;
- visually distinctive through composition, typography, purple/coral accents, and the mosaic motif rather than decorative noise.

### Avoid

Do not introduce:

- generic blue SaaS palettes;
- neon gradients;
- glassmorphism everywhere;
- excessive blur;
- heavy dark-mode-style panels on otherwise light screens;
- oversized pills everywhere;
- very broad or chunky display fonts;
- extra-bold headings as the default;
- random gradients;
- rainbow accents;
- floating decorative shapes with no purpose;
- excessive shadows;
- childish illustrations;
- inconsistent border radii;
- new one-off component styles when an existing MindMosaic pattern already exists.

---

# 3. Typography — Canonical Future Standard

Typography is the one deliberate forward-looking refinement to the existing visual system. The rule is designed to make MindMosaic feel sleeker and less broad/heavy **without forcing unnecessary rewrites of stable legacy screens**.

## 3.1 Canonical font roles

### UI and body — Geist

```css
font-family:
  var(--font-geist),
  "Helvetica Neue",
  system-ui,
  -apple-system,
  "Segoe UI",
  sans-serif;
```

Use Geist for:

- body copy;
- labels and metadata;
- navigation;
- buttons and controls;
- inputs, selects and form help;
- tables;
- card supporting text;
- filters and tabs;
- dashboard UI;
- student progress information;
- exam controls and utility UI;
- **all text inside data/question visuals** (chart titles, axes, labels).

### Headings and display — Instrument Sans

```css
font-family:
  var(--font-instrument-sans),
  "Helvetica Neue",
  system-ui,
  sans-serif;
```

Use Instrument Sans for:

- page titles;
- hero headings;
- section headings;
- prominent card titles;
- dashboard section titles;
- large numerical/display callouts when a display treatment is appropriate.

### Logo — existing brand asset only

The existing `MindMosaicLogo`/approved SVG or logo asset remains untouched. The current code may use Roboto 700 within the wordmark; this is a **logo implementation detail**, not a UI typeface. Never recreate the logo using page typography.

## 3.2 Current implementation vs canonical direction

The current repository contains more than one typography behaviour. Treat them as follows:

| Surface/state | Current implementation | Rule going forward |
|---|---|---|
| Marketing / legal | Geist body + Instrument Sans display | Preserve |
| `.mm-root` redesigned product/auth surfaces | Geist body + Instrument Sans display | Preserve and extend |
| Legacy/general product surfaces | DM Sans | Preserve when untouched; use canonical pair for new/substantially redesigned UI |
| Limited exam setup/instruction display headings | DM Serif Display | Preserve only where already established; do not expand usage |
| MindMosaic wordmark | Existing logo treatment / Roboto 700 implementation | Never re-typeset |

**Do not introduce a sixth font, broad geometric display family, or page-specific font stack.** In particular, do not introduce Plus Jakarta Sans; an auto-generated token export that specifies it for display/headline type is off-contract and must be corrected to Instrument Sans.

## 3.3 Weight policy

The desired typography is **sleek, compact, clean and refined**. Hierarchy comes from size, spacing and contrast before weight.

| Use | Canonical weight |
|---|---:|
| Body copy | 400 |
| Secondary text | 400 |
| Labels / metadata | 500 |
| Navigation | 500–600 |
| Buttons | 600 |
| Card titles | 600 |
| H3–H5 | 600 |
| H1–H2, product UI | 600 |
| H1–H2, marketing | 500–600 |
| Strong emphasis | 600–700 maximum |
| Wordmark | Existing asset only |

Avoid 800/900 page typography. If Tailwind utilities map `font-black` above the loaded font range, do not use `font-black` for new UI. Prefer `font-bold`/`font-extrabold` only where the hierarchy genuinely requires it.

## 3.4 Tracking

MindMosaic headings use close optical tracking.

```css
/* Default display heading */
letter-spacing: -0.028em;

/* Large H1/H2 marketing display */
letter-spacing: -0.034em;

/* Buttons / compact controls */
letter-spacing: -0.01em;
```

Body text should normally remain at `normal`. Very tight tracking (`<-0.04em`) should be inherited from an existing verified component rather than invented for a new one.

## 3.5 Type scale guidance

Do not invent a new type scale if extending an existing screen. Match the nearest existing sibling component.

For genuinely new screens, use approximately:

| Role | Preferred treatment |
|---|---|
| Marketing hero | `clamp(40px, 5vw, 68px)`, 500–600, tight tracking |
| Major section heading | `clamp(28px, 3.2vw, 44px)`, 500–600 |
| Product page H1 | 32–40px desktop, 28–32px mobile, 600 |
| Product section H2 | 24–30px, 600 |
| Card title | 18–22px, 600 |
| Large body/intro | 17–18px, 1.55–1.65 line height |
| Body | 15–16px, 1.5–1.65 line height |
| Small/supporting | 13–14px |
| Eyebrow | 12px, 600, uppercase, `0.08em–0.14em` tracking |

Typography hierarchy should come primarily from **size, spacing and contrast**, not from very heavy weight.

# 4. Canonical Colour System

The rendered application palette is the reference for new UI.

## 4.0 Token governance

The repository contains overlapping historical token vocabularies. **Do not consolidate, rename, or migrate tokens as part of unrelated feature work.** Within an existing component or route, use the established token family already present there. For a new design surface, prefer the canonical MindMosaic tokens documented below and the nearest shared component.

A palette discovered in an external Stitch/Claude canvas or an uncommitted local workspace is **not canonical merely because it exists**. It becomes canonical only when it is either (a) present in the verified target implementation and consistent with this contract, or (b) explicitly approved by the product owner. Auto-generated Material-3 tonal ladders (`surface-container-*`, `inverse-*`, `tertiary`, `background: #fef7ff`) and a demoted primary (`#41008C`) are explicit examples of drift that must **not** be adopted.

## 4.1 Core MindMosaic colours

| Token | Value | Usage |
|---|---|---|
| Brand purple | `#5925A8` | Primary CTA, links, active states, brand accents |
| Brand purple deep | `#4A1E8D` | Hover/pressed primary actions |
| Coral | `#FF555A` | Accent/decorative emphasis, not ordinary body text |
| Coral accessible text | `#CC2429` | Small coral text on light surfaces |
| Warm page | `#FCFBF8` | Marketing/public page background |
| White | `#FFFFFF` | Cards and primary surfaces |
| Primary ink | `#18151F` | Headings and high-emphasis copy |
| Ink soft | `#3D3846` | Secondary emphasis |
| Muted | `#625D69` | Supporting copy |
| Quiet text | `#5C5664` | Lower-emphasis text |
| Default line | `#E9E4ED` | Borders/dividers |
| Soft line | `#F1EDF5` | Internal separators |
| Purple tint | `#F3EEFA` | Branded full-width bands |
| Purple tint soft | `#F7F3FC` | Branded card/subsection surfaces |
| Track | `#EFEAF4` | Progress/meter tracks |

### Learning Hub accent

| Token | Value |
|---|---|
| Ember | `#FA6C30` |
| Ember text | `#B4470F` |
| Ember tint | `#FFF4EE` |
| Ember line | `#FFDCC9` |

`#FA6C30` is a decorative/icon accent. For small text, use the darker accessible `#B4470F`.

---

## 4.2 Product utility palette

Existing core product routes also use:

```css
--purple: #5925a8;
--text-dark: #1a1a2e;
--text-mid: #4a4a6a;
--text-light: #6b6b8a;
--bg-page: #f7f6fb;
--bg-white: #ffffff;
--border: #e4e0f0;

--success: #0f6b32;
--warning: #92400e;
--error: #b91c1c;
```

When extending a **current product screen**, match the tokens already used by that screen. Do not migrate a route from one established surface family to another merely because a new component is being added.

---

## 4.3 Coral rule

Coral is an accent, not a second primary colour.

Use `#FF555A` for:

- small visual accents;
- mosaic tiles;
- short rules;
- decorative emphasis;
- non-text indicators with another accessible signal.

Do not use `#FF555A` for ordinary small text because it does not provide sufficient contrast on light surfaces (measured ~3.1:1 on white — AA-large only). Do not use `#FF555A` as a chart data-series or mark colour (see §28.2). Use `#CC2429` when coral-coloured text is genuinely required.

---

## 4.4 Gradient rule

Do **not** add generic gradients.

The present visual language is predominantly solid warm surfaces with restrained violet/coral accents.

A subtle existing gradient may be reused only where a current component already establishes that pattern, for example a soft white-to-lilac accent card.

Never create a new "AI gradient" hero or multi-colour gradient merely to make a screen feel more premium.

---

# 5. Surface Families

MindMosaic intentionally contains two closely related surface systems.

## 5.1 Marketing/public surface

Use for:

- landing;
- public programme pages;
- public methodology pages;
- pricing;
- help/resources where the marketing shell is appropriate;
- legal pages that already use the public shell.

Characteristics:

- background: `#FCFBF8`;
- container: up to `1440px`;
- fluid horizontal gutter: `clamp(20px, 4vw, 64px)`;
- alternating warm page / white / light-purple section tones;
- minimal borders;
- restrained shadows;
- large editorial spacing;
- Instrument Sans headings;
- Geist body.

## 5.2 Product/application surface

Use for:

- dashboards;
- practice catalogue;
- practice configuration;
- learning flows;
- results;
- exam runner;
- account/product screens.

Characteristics:

- denser than marketing;
- usually `1200px` maximum content width;
- 32px desktop / 24px tablet / 16px mobile page gutters;
- white cards on a very light neutral/purple background;
- stronger functional hierarchy;
- compact interaction spacing;
- accessible focus states;
- Geist UI/body;
- Instrument Sans headings on new/redesigned screens.

Do not copy a landing-page hero composition into a dashboard.

---

# 6. Layout and Widths

## 6.1 Marketing container

```css
.mm-width {
  width: 100%;
  max-width: 1440px;
  margin-inline: auto;
  padding-inline: clamp(20px, 4vw, 64px);
}
```

## 6.2 Product container

```css
.site-width {
  max-width: 1200px;
  margin-inline: auto;
}
```

Effective gutters:

- desktop: `32px`;
- tablet: `24px`;
- mobile: `16px`.

## 6.3 Section rhythm

Marketing sections:

```css
padding-block: clamp(40px, 4vw, 64px);
```

Use larger spacing only for genuine hero/closing compositions.

Product pages should remain more compact. Typical vertical blocks should use the existing Tailwind spacing rhythm rather than arbitrary pixel values.

---

# 7. Responsive Design

MindMosaic is mobile-first in behaviour even when layouts are composed for desktop.

### Required breakpoints

Use the project's existing Tailwind breakpoints and component behaviour.

Key current transitions include:

- mobile under `640px`;
- tablet between `640px` and `1023px`;
- desktop/global nav from `lg` (`1024px`) upward.

### Rules

At smaller widths:

- stack columns rather than squeeze them;
- preserve at least 16px page gutters;
- maintain 44px minimum interactive targets;
- do not shrink body text below readable size;
- move secondary actions below primary actions when required;
- convert global navigation to the established full-width disclosure/drawer pattern;
- avoid horizontal scrolling for ordinary application content;
- maintain clear question/exam controls without reducing accessibility.

---

# 8. Global Navigation

## 8.1 Marketing header

The current public header pattern is:

- sticky at top;
- subtle bottom border;
- warm page background with slight translucency;
- minimal backdrop blur;
- logo left;
- primary links centred/inline on desktop;
- account/CTA controls right;
- hamburger at smaller widths;
- full-width mobile disclosure panel.

Typical height:

```css
clamp(64px, 7vw, 80px)
```

### Active state

Use:

- purple active text;
- a **2px coral inset underline**;
- `aria-current="page"`.

Do not use a large filled purple pill for the public navigation active state.

---

## 8.2 Product/global header

The application header is:

- sticky;
- approximately 72px high;
- white/translucent surface;
- subtle purple-tinted divider;
- logo left;
- functional navigation beside logo on desktop;
- account controls right;
- mobile menu below `lg`.

Current functional navigation patterns should remain role-aware.

Use a subtle light-purple active background and purple text where the existing application header uses that treatment.

---

# 9. Buttons

MindMosaic buttons are solid, clear and tactile.

## 9.1 Marketing primary

```text
Background: #5925A8
Text: white
Radius: 12px
Height: 48px standard / 52px prominent
Weight: 600
Shadow: subtle violet
Hover: #4A1E8D
Pressed: 1px downward shift
```

## 9.2 Marketing outline

```text
Background: white
Border: #E9E4ED
Text: #18151F
Hover border/text: #5925A8
Radius: 12px
```

## 9.3 Product primary

- brand purple;
- white text;
- 12px radius;
- min-height 44/48/56px depending on size;
- subtle purple shadow;
- very small upward hover movement is allowed;
- 4px focus ring with a light purple alpha.

## 9.4 Destructive action

Use semantic red/error styling.

Never style deletion, exit-with-loss, or destructive confirmation as the normal purple primary action.

## 9.5 Button rules

- one clear primary action per immediate decision area;
- use sentence case;
- avoid all caps;
- use icons only when useful;
- do not create pill-shaped CTAs unless the existing local pattern is a pill;
- keep text concise;
- preserve at least 44px touch height.

---

# 10. Cards and Panels

There are two established card treatments.

## 10.1 Marketing card

Default:

```text
Surface: white
Border: 1px #E9E4ED
Radius: 16px
Shadow: none or very restrained
```

Use these for:

- programme cards;
- explanatory blocks;
- resource tiles;
- informational marketing content.

Do not turn every marketing card into a floating shadow panel.

## 10.2 Product card

The current shared product `Card` primitive uses:

```text
Radius: 24px
Surface: white
Border: subtle purple
Shadow: soft violet/ink shadow
Padding: typically 24px
```

Variants include:

- default;
- soft/translucent;
- outlined;
- subtle white-to-lilac accent.

Reuse the existing primitive when working in the product shell.

## 10.3 Card hierarchy

A card should generally contain:

1. optional icon/status;
2. title;
3. supporting text;
4. core data/content;
5. optional action row.

Avoid cards inside cards unless necessary to express a real hierarchy.

---

# 11. Controls, Tabs and Filters

Tabs, year selectors, programme filters and similar choices should use the established compact pressed-state treatment.

### Default

- min-height 44px;
- 10px radius;
- 1px border;
- white background;
- dark/soft ink text.

### Selected

- purple background;
- purple border;
- white text;
- minimal shadow.

### Disabled

- quiet neutral/purple surface;
- readable muted text;
- explicit wording/icon if availability matters.

Never rely on colour alone for disabled, error or selected meaning.

---

# 12. Forms

Form controls must feel consistent with the rest of MindMosaic.

Use:

- white input surface;
- quiet purple/neutral border;
- 10–12px radius;
- generous internal spacing;
- Geist body text;
- clear persistent labels;
- readable placeholders;
- purple focus ring;
- semantic red error state;
- helpful error/support copy below the relevant control.

Avoid:

- borderless inputs on white;
- very rounded 24px+ form fields;
- floating labels unless the existing screen already uses them;
- low-contrast placeholder text;
- using only colour to communicate invalid state.

---

# 13. Eyebrows and Section Labels

The existing marketing section kicker is a strong brand element.

```text
Size: 12px
Weight: 600
Case: uppercase
Tracking: 0.14em
Colour: #5925A8
```

Where the design calls for the short rule:

```text
Width: 26px
Height: 3px
Colour: #FF555A
```

Use this sparingly. It should identify major content sections rather than every card.

---

# 14. Mosaic Motif

The mosaic tile rule is one of the few recurring decorative elements that makes the interface recognisably MindMosaic.

The established tile tones are:

- purple;
- coral;
- lilac;
- quiet tint.

Use it only where it adds brand continuity, such as:

- major marketing compositions;
- selected hero/closing imagery;
- footer or prominent branded separators.

Do not place mosaic tiles on every page or every card.

---

# 15. Icons

Use the existing icon vocabulary first.

The application currently uses **Lucide** for functional UI icons.

### Icon rules

- simple line icons;
- generally 16–20px inside controls;
- 20–24px for card-level features;
- use brand purple for emphasis;
- use current semantic colours for success/warning/error;
- pair important icon meaning with text;
- avoid mixed icon libraries on one surface;
- no emoji as core UI icons.

Decorative illustrations are separate from functional icons.

---

# 16. Shadows

Shadows are supporting detail, not the primary way to create hierarchy.

### Marketing

Use almost no shadow or a very subtle purple/neutral shadow.

Example established primary CTA shadow:

```css
0 2px 8px rgba(89, 37, 168, 0.22)
```

### Product cards

A larger soft shadow may be used on functional cards:

```css
0 18px 50px rgba(49, 32, 86, 0.09)
```

Menus/modals may use stronger elevation where layering genuinely requires it.

Avoid black, hard-edged shadows.

---

# 17. Borders and Dividers

Preferred borders are thin and quiet.

Use:

```text
Default: #E9E4ED
Soft internal line: #F1EDF5
Quiet/disabled: #DED8E4
Product purple-tinted border: low-alpha #5925A8
```

Prefer `1px` borders.

Do not use thick card outlines except for a functional selected/error state.

---

# 18. Border Radius

Radius is intentionally soft but structured. MindMosaic does **not** use one radius for every surface.

| Element | Typical radius | Notes |
|---|---:|---|
| Shared product `Card` | `rounded-3xl` ≈ 24px | Existing component convention; preserve when using `Card` |
| Marketing/simple content card | `rounded-2xl` ≈ 16px | Calm editorial/marketing surface |
| Token `rounded-card` | 16px effective theme value | Use where the token is already established |
| Buttons | `rounded-xl` ≈ 12px | Shared button convention |
| Compact controls | 10–12px | Tabs/segmented controls/chips where appropriate |
| Chart data bars | 2–4px | Data marks are not cards |
| Pills/status badges | Full/pill | Only when the semantic shape is genuinely pill-like |

The repository may also contain older `:root` radius declarations (for example 12px/8px) that are superseded by effective Tailwind theme values. **Match the rendered/shared component convention, not a stale declaration.**

Do not:

- flatten cards into sharp rectangles;
- make every container a 24px rounded card;
- turn ordinary buttons into oversized pills;
- create one-off 6px/18px/28px radii without an existing precedent.

# 19. Motion

Motion should be fast, subtle and functional.

Canonical timing:

```css
--motion-fast: 150ms;
--motion-base: 200ms;
--motion-slow: 400ms cubic-bezier(.4, 0, .2, 1);
```

Appropriate motion:

- button hover/press;
- card hover where already established;
- menu disclosure;
- accordion `+` to `×` rotation;
- small opacity/transform transitions;
- progress changes.

Avoid:

- large parallax;
- looping decorative animation;
- bouncing CTAs;
- animation that delays task completion.

Respect reduced-motion preferences.

---

# 20. Focus and Accessibility

Accessibility is part of the visual system.

### All interactive controls

Must have:

- visible keyboard focus;
- at least 44×44px effective target where appropriate;
- sufficient colour contrast;
- readable disabled states;
- semantic element where possible.

### Focus treatment

The current visual language uses a broad, low-opacity purple focus ring, commonly:

```text
4px ring using brand purple at ~20–30% opacity
```

Use a small offset where needed so the ring remains visible against the background.

### Colour

Never rely only on:

- purple vs coral;
- green vs red;
- filled vs unfilled colour;

to communicate critical state. Add text, iconography, shape or another signal.

---

# 21. Loading, Empty and Error States

Every new data-backed screen must design its states, not only its successful state.

## Loading

Use existing skeleton components or a compact spinner inside the initiating control.

Avoid whole-page spinners where meaningful skeleton structure is possible.

## Empty

An empty state should:

- say what is empty;
- explain what the user can do;
- present one useful action where appropriate;
- use the normal product card/surface style.

## Error

Use semantic error red with accessible copy.

An error should say:

1. what could not be completed;
2. whether work/data is safe;
3. what the user can do next.

---

# 22. Information Density

MindMosaic is a learning product, not a marketing dashboard full of decorative analytics.

For product screens:

- prioritise the learner's next action;
- keep primary progress information visible;
- group related metadata;
- avoid showing every possible metric at once;
- use whitespace to separate decisions;
- keep cards purposeful.

For dashboards:

- one strong page title;
- one clear next-action area;
- a small number of meaningful progress/status blocks;
- secondary history/details below.

---

# 23. Student Experience Pattern

For new student screens, use the product shell and keep the hierarchy task-oriented.

A typical structure should be:

1. global/role navigation;
2. page title and short context;
3. current/next learning action;
4. core content or programme choices;
5. progress/history;
6. secondary information.

### Learning and practice

Keep curriculum/exam options visually scannable.

Prefer:

- clear subject/programme identity;
- short metadata;
- obvious year/level status;
- one primary action per item;
- visible progress where meaningful.

Avoid long explanatory copy inside every programme card.

---

# 24. Practice and Exam Screens

Practice/exam screens prioritise task completion over decoration.

### Keep

- question content dominant;
- persistent progress/state;
- clear next/previous navigation;
- obvious selected answer state;
- obvious unanswered/flagged state;
- timer visible but not visually aggressive;
- consistent exit behaviour;
- accessible confirmation for destructive exit.

### Avoid

- marketing illustrations;
- unnecessary gradients;
- hover-dependent instructions;
- decorative cards that reduce question space;
- tiny navigation targets.

Timed assessment UI must remain calm.

---

# 25. Results and Progress Screens

Results should communicate:

1. overall outcome;
2. what was done well;
3. what needs improvement;
4. what to do next;
5. detailed breakdown/history.

Use colour as reinforcement, not the only meaning.

Recommended visual order:

- result/summary header;
- score/progress;
- skill or strand breakdown;
- actionable recommendation;
- detailed attempts/review.

Avoid turning result screens into dense BI dashboards.

---

# 26. Marketing Page Composition

The current landing-page language should be extended rather than replaced.

Established ingredients include:

- sticky public header;
- large editorial hero;
- warm paper background;
- restrained photography/visual frames;
- short purple eyebrow labels;
- coral micro-accents;
- alternating white/purple-tint sections;
- programme and feature cards;
- simple interactive filters/tabs;
- generous section spacing;
- recurring mosaic rule;
- clear closing CTA;
- structured footer.

A new marketing section should look as though it could have shipped with these existing sections.

---

# 27. Photography and Illustrations

Visual assets should support the educational subject matter rather than behave as decoration.

Use:

- warm, clean lighting;
- uncluttered composition;
- high-quality educational context;
- image crops that work responsively;
- intentional negative space;
- consistent corner treatment with the surrounding component.

Avoid:

- visible stock-photo clichés;
- fake app UI embedded in photos;
- text baked into imagery;
- overly synthetic "AI" aesthetics;
- unrelated 3D blobs/characters.

When an illustration system already exists for a subject area, extend that system rather than mixing in a new style.

---

# 28. Data & Question Visuals (Charts, Number Lines, Geometry, Tables)

Question visuals are **content**, not chrome, but they are still part of the MindMosaic visual system. A chart must look like it belongs to the same product as the card it sits in — while being optimised for **fast, unambiguous reading by a Grade 3–5 learner under exam conditions.** §16 Shadows, §18 Border Radius, §19 Motion and §20 Accessibility still apply; this section adds the rules those cannot cover.

## 28.1 Non-negotiable: structured JSON → deterministic renderer

Reaffirming the product contract: **AI generates structured visual JSON; the application renders deterministic SVG from that JSON.** Design rules in this section apply to the **renderer**, not to model output. Never ship AI-authored raw `<svg>` as the primary source of truth. Raw SVG is permitted only under the project's sanitisation rules (no `<script>`, no inline handlers, no external links, required `<title>`/`<desc>`), and only when structured JSON genuinely cannot express the diagram.

Every visual asset **must** carry `altText`. A visual with no alt text is not publishable (§21; project rule 9).

## 28.2 Data-series palette (categorical)

Brand purple and coral are **not** a data palette. Coral `#FF555A` is **banned as a data mark or series colour** — at ~3.1:1 on white it fails the WCAG 1.4.11 (3:1) non-text-contrast requirement for graphical objects. Brand purple `#5925A8` is **series 1 only**, never "the colour charts are".

Use this dedicated categorical sequence, in order. Every colour is verified ≥ 4.5:1 on both white `#FFFFFF` and tint `#F7F3FC`, so all are safe for marks **and** for direct value labels:

| Token | Value | On white | Role |
|---|---|---:|---|
| `--mm-data-1` | `#5925A8` | 9.31:1 | Series 1 (brand purple) |
| `--mm-data-2` | `#0F7A86` | 5.06:1 | Series 2 (teal) |
| `--mm-data-3` | `#B4470F` | 5.46:1 | Series 3 (ochre — the ember text tone) |
| `--mm-data-4` | `#1D4ED8` | 6.70:1 | Series 4 (blue) |
| `--mm-data-5` | `#0F6B32` | 6.63:1 | Series 5 (green) |
| `--mm-data-6` | `#A21C68` | 7.24:1 | Series 6 (plum) |
| `--mm-data-7` | `#475569` | 7.58:1 | Series 7 (slate) |
| `--mm-data-8` | `#8A6D0B` | 4.91:1 | Series 8 (gold) |

Rules:

- **Single-category charts** (most Grade 3–5 questions) use `--mm-data-1` for all bars/points and reserve a **second** colour only to mark the answer or the item the question asks about.
- Do not exceed **6 series** in one visual for this age group; prefer fewer.
- The order is fixed. Do not reshuffle per chart, so the same series index means the same colour across the bank.
- For a **sequential / intensity** single-series ramp (e.g. a heat-style table), use a purple ramp: `#F3EEFA → #D9C7F0 → #B79BE0 → #8B5FCC → #5925A8`. Do not build diverging ramps for primary work.

## 28.3 Never colour alone (mandatory for question visuals)

Because answers are auto-marked and read by young learners, **meaning is never carried by colour alone** (§20). Every visual must add a second signal:

- **Direct labels over legends.** Label bars/points/slices in place. Use a legend only when direct labelling is impossible, and never as the *only* way to tell series apart.
- The **correct / model answer** in a worked solution is marked with `--mm-success #0F6B32` **plus** a check icon **plus** the word "Correct" — never a green fill on its own.
- An **incorrect** selection uses `--mm-error #B91C1C` **plus** an ✕ icon **plus** text.
- The **item the question refers to** ("the tallest bar", "Train B") is marked with a shape/label cue (outline, arrow, bold label), not merely a colour swap.
- Provide a **tabular fallback**: chart JSON already contains the data, so every chart must be reachable as an accessible `<table>` (visually hidden or on demand) for screen-reader users.

## 28.4 Typography & line language inside visuals

- All in-visual text is **Geist** (§3). Titles inside a visual are `title-sm`/`title-md` weight 600; axis labels, tick labels and data labels are `body-sm` (13–14px), weight 400–500. **No Instrument Sans inside charts**, and never a third font.
- Axis / baseline / gridline colour: `--mm-line #E9E4ED` for gridlines, `--mm-ink-soft #3D3846` for the primary axis line and axis titles. Gridlines are `1px`, light, and **behind** the data.
- Tick and data-label text: `--mm-muted #625D69` for supporting labels; `--mm-ink #18151F` for the emphasised value the question hinges on.
- Data mark stroke weight follows the Lucide language (§15): **1.5–2px** for lines and outlines.
- Corner radius on bars: **2–4px** only (bars are data, not cards — do not apply `rounded-2xl`).

## 28.5 Per-visual specifications

**bar_chart** — vertical bars by default; horizontal when >6 categories or long labels. Bars `--mm-data-1`; single accent colour for the referenced bar. Value label above/inside each bar. Y-axis starts at **0** always (no truncated axes — truncation misleads and breaks correctness checks). Light horizontal gridlines only.

**line_graph** — 1.5–2px line, series colour from the palette; visible point markers (4–5px) so individual values are readable. Direct end-of-line labels preferred over a legend. X-axis baseline solid `--mm-ink-soft`; horizontal gridlines light.

**pie_chart** — max **5 slices**; each slice a distinct palette colour **and** a direct label with its value/percentage on or beside the slice. 1.5–2px white slice separators for definition. Do not use pie charts where a bar chart reads more accurately (i.e. most comparison questions).

**table** — reuse the product table language: `--mm-line` row dividers, `--mm-tint-soft #F7F3FC` header row, Geist `body-sm`, comfortable cell padding, left-aligned text / right-aligned numbers. The referenced row/column ("Train B") gets a subtle `--mm-tint #F3EEFA` highlight **plus** a label, not colour alone. No zebra striping heavier than `--mm-line-soft`.

**number_line** — horizontal axis `--mm-ink-soft`, 1.5px; evenly spaced ticks at `tickInterval` with `body-sm` labels; named markers as filled `--mm-data-1` dots (7–8px) with the marker label above. Ensure the line has ≥16px breathing room from the card edge and remains ≥44px tall for touch/tap where interactive.

**geometry_shape** — shape outline 1.5–2px `--mm-ink-soft`, fill `--mm-tint-soft` or none; dimension annotations in Geist `body-sm` with thin extension/dimension lines in `--mm-muted`. Right angles shown with the standard small square. Keep annotations outside the shape where possible.

## 28.6 Surface, sizing, responsive, motion

- A visual sits on the question card's surface; give it its own inner container with `--mm-line` border only if it needs separation — **do not** nest it in a second heavy shadowed card (§10.3).
- Author every visual as a **responsive SVG** (`viewBox` + `width:100%`, `max-width` cap, no fixed pixel width). It must remain legible at 375px without horizontal scroll (§7); switch bar charts to horizontal or reduce label density at narrow widths rather than shrinking text below 12px.
- **Motion:** question visuals are static. No entrance/reveal animation that delays reading a timed question (§19, §24). A worked-solution reveal may use a single ≤200ms opacity/height transition, and must respect `prefers-reduced-motion`.

## 28.7 Visual correctness is a design requirement too

The design must not undermine the project's correctness/consistency checks: the rendered visual must match the JSON exactly (a bar labelled 12 is drawn at 12), there must be a **unique** visible answer where the question implies one, and any element the prompt names must be present and identifiable in the render. If the renderer cannot express the JSON faithfully, it fails the visual rather than approximating.

---

# 29. Future AI-Assisted Learning

MindMosaic will make room for responsible AI features in the future. **None of them exists today.** This
section governs two things:

1. how future AI concepts may appear **now**: as clearly labelled concepts, never as working features;
2. the principles any AI feature must meet **when it is eventually built**.

## 29.1 The one rule for today: concept, not capability

Every AI surface is a **future concept** until the product owner explicitly approves it *and* it is built,
verified and live. Until then:

- **Label it every time.** Each concept carries a visible **"Future concept"** badge and the words
  "Not available yet", in text, not just an icon or colour (§20). Use the neutral badge style: `--mm-tint`
  surface, `--mm-ink-soft` text, `--mm-line` border.
- **Look different from real features.** Concept cards use a **dashed** `--mm-line` border and no primary
  action. That is the same language as other coming-soon items. Never style a concept like a live
  feature card.
- **Nothing that looks usable.** No text box that accepts typing, no "Send"/"Ask"/"Try it"/"Generate"
  button, no chat bubble thread that suggests a live conversation. Any illustrative example is static, marked
  **"Example"**, uses invented placeholder content only, and never shows real student data, scores or
  progress.
- **No data collection.** No waitlists, sign-ups, "notify me" forms or surveys attached to AI concepts in the
  student area. A parent-facing interest form, if ever wanted, needs a separate owner decision.
- **Placement.**
  - *Allowed:* the marketing roadmap / "Coming next" area, a parent-facing "What's coming" page, and a
    single clearly separated "Coming later" area in the student app.
  - *Not allowed:* inside the exam runner, inside a practice question, inside results, or mixed into lists
    of real features, where a child could mistake it for something they can use.
- **No hype styling.** No sparkle icons as decoration, no "AI gradient" (§4.4), no glow, no robot or
  mascot characters. Calm, plain and honest, like the rest of the product.
- **Copy.** Say what it *would* do, in plain Australian English, without promising dates. Prefer "Planned: a
  hint helper that asks guiding questions" over "Meet your AI tutor!".

## 29.2 Concepts to explore

| Concept | What it would do | Key guardrail |
|---|---|---|
| **Socratic learning assistant** | Guides with questions and staged hints instead of giving the answer straight away. | Never reveals the answer before the student has attempted; never available in exam mode. |
| **Adaptive hinting** | Gives increasingly specific hints based on the student's attempts. | Hints come from the question's approved explanation; hint use is visible to the student and parent, never hidden. |
| **Error-pattern detection** | Identifies likely misconceptions (place value, operation choice, grammar, reading comprehension). | Framed as "a pattern worth practising", never as a judgement about the child; needs enough evidence and shows it. |
| **Personalised practice recommendations** | Suggests the next skill or a short practice set from verified performance data. | Real attempt history only; published questions only; honest "not enough data yet". |
| **Explanation adjustment** | Rewrites an explanation more simply, with another example, a visual model or steps. | Must stay faithful to the approved explanation; visuals via structured JSON → deterministic renderer (§28.1). |
| **"Explain my mistake"** | Compares the student's reasoning with the correct method, without judgement. | Kind, specific, non-judgemental wording; only after an answer is submitted. |
| **Reading support** | Explains difficult words, summarises passages, asks year-appropriate comprehension questions. | Never answers the comprehension question being assessed; year-level vocabulary. |
| **Writing coach** | Age-appropriate feedback on structure, clarity, spelling, grammar and vocabulary. | Never writes the response or rewrites whole sentences for the student. Feedback, not ghost-writing. |
| **Maths visualiser** | Turns suitable problems into number lines, bar models, arrays, diagrams or visual steps. | Structured visual JSON → deterministic renderer only; never AI-authored raw SVG. |
| **Practice generator** | Creates curriculum-aligned variations from reviewed question templates. | Every generated item goes through the question-factory pipeline: validation, independent review, **human approval (`approvedBy`)**. Never shown before approval. |
| **Revision planner** | Builds a manageable study plan from upcoming assessments, available time and topics to review. | Short, gentle sessions; no pressure framing, streak guilt or countdown anxiety. |
| **Parent summaries** | Turns learning activity into clear, neutral weekly summaries with practical next steps. | Real data only; no predicted NAPLAN bands, rankings or cohort comparisons. |
| **Teacher / reviewer workflow** | Flags AI-generated questions and explanations for human review before publication. | AI assists reviewers; it never approves or publishes anything itself. |
| **Accessibility support** | Read-aloud, simplified language, translation assistance, dyslexia-friendly presentation, alternative explanations. | Never changes what is being assessed; simplified or translated text is labelled as such. |

## 29.3 Non-negotiable principles for any AI feature

All AI assistance must be **age-appropriate, privacy-conscious, transparent, and grounded in approved
MindMosaic content**. It must **not**:

- provide unrestricted or open-ended chat;
- collect unnecessary personal information;
- make high-stakes psychological or ability judgements (no "gifted", "behind", "struggling learner", IQ-style
  or diagnostic labels);
- fabricate progress, mastery or predictions;
- complete assessed work for students;
- publish generated questions or explanations without human review.

Students must **always** be able to report an incorrect or confusing response.

MindMosaic-specific rules that follow from the existing contract:

- **Grounded only in published, approved content.** An AI feature may only draw on published questions,
  approved explanations and verified curriculum data. If nothing approved exists, it says so honestly and
  stops (the same fail-closed rule as practice).
- **Never in assessment.** No AI help of any kind in exam mode, timed papers or the diagnostic warmup.
- **Answers stay on the server.** No AI feature may send answer keys to the browser before the student has
  answered (see the practice-reveal decision).
- **Always labelled.** Every AI-produced response is visibly marked (e.g. "Suggested by MindMosaic's
  helper. It can make mistakes.") and carries a **"Report a problem"** action.
- **No persona, no companion.** No named AI character, no human-like personality, no emotional
  "friend" framing, nothing that encourages a child to rely on it emotionally.
- **Privacy by default.**
  - Send the minimum to any model provider, with no names or contact details and no free-text personal
    information.
  - No training on children's data.
  - Parents can see what the AI features do and switch them off.
  - Must meet the Australian Children's Online Privacy Code before launch.
- **Fallback without AI.** If the AI feature is unavailable, the student still gets the normal approved
  explanation. Learning never depends on the AI responding.
- **Human in the loop for content.** Generated content follows the question-factory pipeline:
  generator ≠ independent reviewer, automated checks, and human approval before a child sees it.

## 29.4 When a concept is eventually built

- Its **"Future concept"** label is removed only when the feature is live, verified and owner-approved.
  Never earlier, and never in marketing ahead of the product.
- AI responses sit in a normal product card (§10.2) with a small, persistent disclosure line and the
  report action. No special "AI" colour, gradient or glow.
- Design every state: loading (skeleton, short), empty, **"I can't help with that"**, error, and
  "reported, thank you".
- Reported responses go to a human review queue.

## 29.5 Definition of Done additions (append to §35)

### Future AI concepts (where present)

- [ ] Is every AI concept labelled "Future concept" / "Not available yet" in text?
- [ ] Is it visually distinct from live features (dashed border, no primary action)?
- [ ] Is there no input, button or flow that makes it look usable?
- [ ] Are all examples static, labelled "Example", and free of real student data or fabricated progress?
- [ ] Is it kept out of the exam runner, practice questions and results?
- [ ] Is no personal data collected through it?

---

# 30. Content Style

Design consistency includes wording.

UI copy should be:

- plain;
- concise;
- confident;
- student/parent friendly;
- Australian English;
- specific rather than promotional.

Prefer:

- "Start practice"
- "Continue learning"
- "Review answers"
- "View results"

over vague labels such as:

- "Explore now"
- "Unlock"
- "Discover more"
- "Get started" when a more specific action exists.

---

# 31. Reuse Before Creation

Before creating a new UI component, check for an existing equivalent in:

```text
src/components/ui/
src/components/shell/
src/components/branding/
src/features/landing/components/
```

Current reusable primitives include, among others:

- Button;
- Card;
- Badge;
- Input;
- Select;
- Modal;
- ConfirmDialog;
- ProgressBar;
- Skeleton;
- EmptyState;
- ErrorState;
- application header/footer;
- MindMosaic logo;
- marketing button/card/section/pill primitives.

**Do not clone an existing component just to change its spacing or colour.**

Extend variants only where there is a real reusable need.

---

# 32. Implementation Tokens for New Screens

For new/reworked MindMosaic surfaces, use the following conceptual tokens.

```css
:root {
  /* Brand */
  --mm-brand: #5925a8;
  --mm-brand-deep: #4a1e8d;
  --mm-coral: #ff555a;
  --mm-coral-text: #cc2429;

  /* Surfaces */
  --mm-page: #fcfbf8;
  --mm-surface: #ffffff;
  --mm-tint: #f3eefa;
  --mm-tint-soft: #f7f3fc;

  /* Text */
  --mm-ink: #18151f;
  --mm-ink-soft: #3d3846;
  --mm-muted: #625d69;
  --mm-quiet: #5c5664;

  /* Lines */
  --mm-line: #e9e4ed;
  --mm-line-soft: #f1edf5;

  /* Data-series palette (categorical — see §28.2). Coral is intentionally excluded. */
  --mm-data-1: #5925a8;
  --mm-data-2: #0f7a86;
  --mm-data-3: #b4470f;
  --mm-data-4: #1d4ed8;
  --mm-data-5: #0f6b32;
  --mm-data-6: #a21c68;
  --mm-data-7: #475569;
  --mm-data-8: #8a6d0b;

  /* Type */
  --font-ui: var(--font-geist), "Helvetica Neue", system-ui, sans-serif;
  --font-display:
    var(--font-instrument-sans),
    "Helvetica Neue",
    system-ui,
    sans-serif;

  /* Motion */
  --motion-fast: 150ms;
  --motion-base: 200ms;
}
```

Do not create duplicate hard-coded hex values in a new feature when an established token already exists. The full token set (radius, shadow, focus, spacing, semantic, ember, breakpoints) lives in the machine-readable companion referenced at the top of this document.

---

# 33. Typography Migration Rule

This document does **not** require a broad redesign of existing screens.

For future changes:

### New screens

Use:

- Geist for UI/body;
- Instrument Sans for headings;
- current visual tokens and components.

### Existing screen receiving a feature

Keep its existing layout/component language. New elements use the typography standard above while matching the local design.

### Existing screen receiving a typography-only cleanup

Change font family/weight/tracking only. Do not silently alter:

- layout;
- colours;
- radius;
- spacing;
- content;
- navigation;
- card structure;
- imagery;
- behaviour.

### Legacy typography

Do not introduce new uses of:

- DM Serif Display;
- broad serif display headings;
- Plus Jakarta Sans or other geometric display families;
- extra-bold `800–900` UI display type.

Existing legacy use may remain until that screen is intentionally migrated.

---

# 34. Agent Rules — Claude Code / Codex / Stitch

When this file is supplied to an implementation or design agent, the following rules are mandatory.

## Before implementation

1. **Read `design.md` first. This is mandatory.** Do not begin UI design or implementation from framework defaults or an external template.
2. Confirm whether the task contains an explicit owner-approved exception to this contract. If not, assume there is no exception.
3. Inspect the target route and its nearest sibling routes.
4. Inspect existing shared components before creating anything.
5. Identify whether the route belongs to the marketing or product surface.
6. Reuse current MindMosaic tokens and shared components.
7. Apply the typography standard in this document.
8. Preserve current logo usage.
9. Check mobile, tablet and desktop behaviour before coding the final layout.

## During implementation

The agent must not:

- redesign unrelated areas;
- introduce a new palette;
- replace the logo;
- introduce another font (including Plus Jakarta Sans);
- use broad/extra-bold headings;
- add arbitrary gradients;
- add a new icon library;
- copy generic component-library defaults without restyling them to MindMosaic;
- create a second button/card/input system;
- remove accessibility/focus states;
- reduce touch targets;
- use coral as a data-series/mark colour;
- adopt an auto-generated Material token ladder or a demoted primary;
- present any AI feature as available or working. AI features are future concepts only (§29).

## After implementation

Verify at minimum:

- `375px`;
- `768px`;
- `1024px`;
- `1440px`.

Check:

- typography;
- header/navigation;
- alignment;
- gutters;
- card consistency;
- button states;
- wrapping;
- overflow;
- keyboard focus;
- disabled/error/loading states;
- empty states;
- contrast;
- responsive order;
- data-visual palette, labels and alt text where visuals are present.

---

# 35. Definition of Done for Any New MindMosaic Screen

A screen is visually complete only when all answers below are **yes**.

### Governance

- [ ] `design.md` was reviewed before implementation.
- [ ] No unapproved design-system deviation was introduced.
- [ ] Any explicit owner-approved exception is documented and scoped only to the requested surface.
- [ ] Unrelated existing screens were not redesigned.

### Brand

- [ ] Does it unmistakably look like MindMosaic?
- [ ] Is `#5925A8` the primary brand/action colour?
- [ ] Is coral used as a controlled accent rather than a second primary?
- [ ] Is the approved logo reused unchanged?

### Typography

- [ ] Is Geist used for body/UI?
- [ ] Is Instrument Sans used for headings?
- [ ] Are heavy/broad heading weights avoided?
- [ ] Is heading tracking tight and refined?

### Layout

- [ ] Does it use the correct marketing or product width system?
- [ ] Are gutters consistent?
- [ ] Does it work at 375, 768, 1024 and 1440px?
- [ ] Is content hierarchy clear without excessive cards?

### Components

- [ ] Were existing components reused?
- [ ] Are radii consistent?
- [ ] Are shadows restrained?
- [ ] Are buttons and inputs consistent with current MindMosaic?

### Interaction

- [ ] Are hover/focus/pressed/disabled states handled?
- [ ] Are targets at least 44px where appropriate?
- [ ] Does mobile navigation/interaction work?
- [ ] Is reduced motion respected where relevant?

### States

- [ ] Is loading handled?
- [ ] Is empty handled?
- [ ] Is error handled?
- [ ] Is destructive behaviour clearly distinguished?

### Data & question visuals (where present)

- [ ] Are visuals rendered from structured JSON, not raw AI SVG?
- [ ] Is the categorical data palette used (coral excluded), with meaning never carried by colour alone?
- [ ] Does every visual have alt text and a tabular fallback?
- [ ] Does the render match the JSON, with a unique visible answer where implied?

### Future AI concepts (where present)

- [ ] Is every AI concept labelled "Future concept" / "Not available yet" in text?
- [ ] Is it visually distinct from live features (dashed border, no primary action)?
- [ ] Is there no input, button or flow that makes it look usable?
- [ ] Are all examples static, labelled "Example", and free of real student data or fabricated progress?
- [ ] Is it kept out of the exam runner, practice questions and results?
- [ ] Is no personal data collected through it?

### Accessibility

- [ ] Is text contrast sufficient?
- [ ] Is keyboard focus visible?
- [ ] Is colour never the only critical state signal?
- [ ] Are labels and semantic controls used correctly?

---

# 36. Design Change Control and Exceptions

This document is the default decision-maker for all future MindMosaic development.

### An agent may NOT treat any of these as permission to diverge

- “this looks more modern”;
- a library/framework default;
- a copied component;
- a Stitch/Claude/Figma suggestion;
- an auto-generated token export (Material ladder, Plus Jakarta Sans, demoted primary);
- an older `BRAND.md`, design canvas, screenshot, or stale token file;
- the fact that a legacy component uses a different style;
- implementation convenience;
- a desire to “refresh” or “improve” unrelated screens.

### Valid override

A design-system rule may be overridden only when the product owner explicitly states that the specific change is intentional. Record that exception in the implementation notes/PR. Do **not** extrapolate a one-screen exception into a new global rule.

### When an existing screen conflicts with this contract

1. Preserve the existing screen if it is outside the requested scope.
2. Do not use the conflicting legacy pattern as precedent for a new screen.
3. If the touched area can be brought into compliance without expanding scope or causing regression, do so.
4. If compliance would require a broad redesign/refactor, flag it rather than silently expanding scope.

### Required implementation acknowledgement

For substantial UI work, the implementation agent should state in its completion summary:

> `Design contract: checked against design.md; no unapproved deviations.`

If there is an approved deviation, list it explicitly instead.

---

# 37. Source Priority

This document was derived from the current application implementation, especially:

```text
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/components/shell/AppHeader.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/features/landing/components/SiteNav.tsx
src/features/landing/components/primitives.tsx
```

If an older design/brand document conflicts with this contract, do not reintroduce the older styling. The current implementation remains essential evidence for existing patterns, but this document controls the future direction and explicitly resolves known legacy inconsistencies.

For all future development after adoption of this file, use this order:

1. **This `design.md`**
2. Existing component pattern on the target screen
3. Existing shared MindMosaic component/token
4. Closest comparable current route
5. Older historical design documentation

If a proposed design requires breaking these rules, make the deviation explicit before implementation.

---

# 38. One-Line Design Direction

> **Warm, refined educational UI with MindMosaic purple and coral accents, structured white/tinted surfaces, disciplined spacing, subtle motion, Geist UI typography and sleek Instrument Sans headings — premium and modern without becoming generic SaaS. All future development follows this contract unless the product owner explicitly says otherwise.**
