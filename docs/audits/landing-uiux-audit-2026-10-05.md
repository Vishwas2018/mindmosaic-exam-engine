# Live UI/UX Audit: MindMosaic Landing Page (`dev` Baseline)

**Audit Date:** 5 October 2026  
**Auditor:** Antigravity Autonomous Audit Agent  
**Environment Baseline:** Git SHA `cc50a9a1ea13339897c081f652b757d50bf222c5`  
**Host URL:** `http://localhost:3000` (Next.js 16.3.3 Turbopack)  
**Inspection Engine:** Playwright Chromium (DPR=2 for HiDPI inspection, mobile/tablet/desktop emulation)  
**Screenshots Generated:** 35 files in `docs/audits/screenshots/` (5 full-page + 30 individual hero slide captures)

---

## 1. Executive Summary & Quality Scores

| Metric | Score | Assessment |
| :--- | :---: | :--- |
| **Overall UI/UX Score** | **7.8 / 10** | Strong educational brand foundation, authentic Australian pedagogical tone, and clean typographic rhythm. Impaired by hero image wash-out, a non-functional pause button, and card collision over photography. |
| **Hero Score** | **7.1 / 10** | Six-slide narrative concept is excellent, but suffers from heavy milky CSS gradient overlays that wash out faces, undersized source bitmaps (1672x941) upscaled on HiDPI displays, lack of continuous cinematic zoom, and card occlusion over key photographic subjects. |
| **Mobile Score (375px)** | **7.4 / 10** | Clean single-column stack, but vertical gradient heavily obscures student portrait faces on Slide 1; hero timer controls (34px) violate WCAG 44px AAA touch target guidelines; dev overlay collides with controls. |
| **Desktop Score (1440px / 1920px)** | **8.2 / 10** | Wide, authoritative presence with generous negative space. Sample Question Card anchors product realism, though it directly occludes student hands/arms on Slides 2, 4, and 5. |
| **Accessibility Score (WCAG 2.2)** | **8.0 / 10** | ARIA tablist patterns, polite live region announcements, and skip-link exist. However, hero pause button fails to halt rotation due to CSS selector specificity collision (P0 defect), and hero timer buttons on mobile fail 44x44px target size. |
| **Visual Consistency Score** | **8.8 / 10** | Strict adherence to MindMosaic palette (`#5925A8` brand purple, `#FF555A` coral accent, `#FCFBF8` warm page cream, `#18151F` ink). Mosaic fragment motifs and diamond bullets are consistent across all 11 sections. |
| **Conversion Clarity Score** | **8.5 / 10** | High clarity: clear distinction between "Start free" (account creation) and "Explore programs" / guest practice. No dark patterns, no fake pricing commitments for roadmap plans. |

---

## 2. Git & Local Environment Verification

Before auditing, the local runtime environment was inspected and locked to the official `dev` baseline:

```bash
$ git branch --show-current
dev

$ git rev-parse HEAD
cc50a9a1ea13339897c081f652b757d50bf222c5

$ git rev-parse origin/dev
cc50a9a1ea13339897c081f652b757d50bf222c5

$ git status --short
 M .gitignore
 M .vscode/settings.json
 D public/photos/product-intro-homework-desk.jpg
?? .github/
?? public/photos/
```

- **Dev Server Process:** Node.js serving from `C:\Users\vishw\Vish\Vish\mindmosaic-exam-engine` on port 3000.
- **Cache Cleanliness:** `.next` cache was wiped and cleanly recompiled with Turbopack.
- **Hero Implementation:** Confirmed live delivery of the six-slide full-bleed campaign hero (`hero-01-learn.webp` through `hero-06-explore.webp`), translucent navigation, and six timer controls. Zero legacy placeholders (`MM-HERO-03`), zero 3/3 carousels, and zero arrow controls.

---

## 3. Zoom / Motion & Carousel State Verification

The owner requested an empirical check of the hero image zoom and state machine behavior.

### 3.1 Measured Computed Transform Across Time

Measurements taken on `.mm-hero-slide[data-active="true"]` and child `img` from `t = 0ms` to `t = 4500ms` during a slide transition:

| Timestamp | `transform` Matrix | Computed Animation | Description |
| :--- | :--- | :--- | :--- |
| **0 ms** | `matrix(1.012, 0, 0, 1.012, 0, 0)` | `0.35s ease-out both mm-hero-arrive` | Initial 1.2% scale (`scale(1.012)`) on arrival |
| **350 ms** | `matrix(1, 0, 0, 1, 0, 0)` | `0.35s ease-out both mm-hero-arrive` | Settled to baseline (`scale(1)`) |
| **1000 ms** | `matrix(1, 0, 0, 1, 0, 0)` | `0.35s ease-out both mm-hero-arrive` | Completely static |
| **2500 ms** | `matrix(1, 0, 0, 1, 0, 0)` | `0.35s ease-out both mm-hero-arrive` | Completely static |
| **4500 ms** | `matrix(1, 0, 0, 1, 0, 0)` | `0.35s ease-out both mm-hero-arrive` | Completely static |

> **Audit Finding (Zoom/Motion):**  
> **The requested continuous slow cinematic zoom is NOT currently implemented.**  
> The current code executes a one-off 350ms settle from `scale(1.012)` to `scale(1)`, as documented in `Hero.tsx` lines 67–68 and `globals.css` lines 897–900. For the remaining 4,650ms of each 5,000ms slide cycle, the photograph is completely motionless.

---

### 3.2 Carousel Interactive State Machine & Bug Discovery

Live browser testing revealed two critical behavioral flaws in `Hero.tsx` and `globals.css`:

#### A. The Slideshow Pause Button Does NOT Pause Rotation (P0 Defect)
- **Observed Behavior:** Clicking the pause button flips the aria-label from `"Pause slideshow"` to `"Play slideshow"` and adds `data-paused="true"` to `<section>`. However, after waiting 5–7 seconds, **the carousel continues to advance to the next slide**.
- **Root Cause (CSS Specificity + Incomplete State Binding):**
  1. In `src/app/globals.css`:
     ```css
     .mm-hero-fill[data-active="true"][data-auto="true"] {
       animation: mm-hero-fill var(--mm-hero-ms, 5000ms) linear both;
     }
     [data-paused="true"] .mm-hero-fill {
       animation-play-state: paused;
     }
     ```
     Selector 1 has specificity `(0, 3, 0)` (1 class + 2 attributes) while Selector 2 has specificity `(0, 2, 0)` (1 class + 1 attribute). Because the `animation` shorthand in Selector 1 has higher specificity, it overrides `animation-play-state: paused`.
  2. In `Hero.tsx` line 268:
     ```tsx
     data-auto={reducedMotion ? "false" : "true"}
     ```
     The component binds `data-auto` strictly to `reducedMotion`, completely ignoring the component's `auto` / `userPaused` state (`const auto = !reducedMotion && !userPaused;`). Thus, `data-auto` remains `"true"` when paused.
  3. Consequently, the CSS animation continues running, fires `onAnimationEnd`, dispatches `{ type: "timerEnd" }`, and cycles the slide despite being paused.

#### B. Manual Slide Selection Does Not Hold
- Clicking a slide button explicitly dispatches `{ type: "select", index }`.
- In `heroCarouselState.ts`, as soon as the slide image finishes loading (which takes under 50ms locally), `isPending(state)` evaluates to `false`.
- Because `pending` becomes false and `userPaused` was not toggled, the timer immediately starts ticking again and auto-advances away from the user's selected slide after 5 seconds.

#### C. Hidden-Tab Behavior (`visibilitychange`)
- Emulating `document.hidden = true` sets `data-paused="true"`. However, because of the CSS specificity bug described above, background tabs continue to run animations and cycle slides unthrottled.

#### D. Reduced Motion Support
- Emulating `prefers-reduced-motion: reduce`:
  - Completely disables the fill animation (`animation: 1e-05s`).
  - Hides the Pause/Play button from the DOM.
  - Keeps manual slide selection buttons active and functional.
  - Passes WCAG 2.3.3 and 2.2.2 requirements for users with vestibular sensitivities.

---

## 4. Hero Photography Audit & Source vs Rendered Analysis

### 4.1 Asset Inspection Data

| Image Asset | Source Resolution | Source Size | Next.js Delivered Format | Delivered Size (1440p) | Natural Dimensions | Rendered Area |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `hero-01-learn.webp` | 1672 x 941 | 105.2 KB | `image/avif` (q=75) | 47.1 KB | 1672 x 941 | 1440 x 900 (2880x1800 physical @ 2x) |
| `hero-02-practise.webp`| 1672 x 941 | 77.7 KB | `image/avif` (q=75) | 36.9 KB | 1672 x 941 | 1440 x 900 |
| `hero-03-prepare.webp` | 1672 x 941 | 71.7 KB | `image/avif` (q=75) | 33.0 KB | 1672 x 941 | 1440 x 900 |
| `hero-04-understand.webp`| 1672 x 941 | 62.0 KB | `image/avif` (q=75) | 31.7 KB | 1672 x 941 | 1440 x 900 |
| `hero-05-progress.webp`| 1672 x 941 | 92.8 KB | `image/avif` (q=75) | 41.2 KB | 1672 x 941 | 1440 x 900 |
| `hero-06-explore.webp` | 1672 x 941 | 108.0 KB | `image/avif` (q=75) | 46.6 KB | 1672 x 941 | 1440 x 900 |

---

### 4.2 Why Does the Source File Look Sharper & Brighter than the Rendered Page?

Direct visual pixel comparison between `public/landing/campaign/hero-01-learn.webp` opened as a static asset versus the rendered hero canvas on `localhost:3000` proves that the source file is substantially sharper, crisper, and more vibrant. Four technical factors cause this degradation:

#### 1. Under-Resolution Upscaling on Modern Displays
- The supplied source WebPs are **1672 x 941** pixels (1.57 megapixels).
- On a standard modern MacBook Pro or 1440p/4K display running at `devicePixelRatio: 2`, a full-bleed viewport requires **2880 x 1800** physical pixels (or 3840 x 2160 on a 4K 1920p viewport).
- The browser must stretch a 1672px asset across 2880px to 3840px of physical pixels, resulting in an immediate 1.7x to 2.3x bilinear interpolation blur. Fine hair strands, textbook text, and desk grain become soft and indistinct.

#### 2. Aggressive Next.js AVIF Compression (`q=75`)
- Next.js optimizes the source WebP into AVIF at default `quality=75`.
- `hero-01-learn.webp` drops from **105 KB to 47 KB** (a 55% loss in file weight).
- While bandwidth-efficient, AVIF at 75 removes high-frequency spatial luminance, smoothing out skin textures and paper edges.

#### 3. Heavy Milky Cream (`#FCFBF8`) Gradient Overlays
In `Hero.tsx` lines 148–152, three gradient layers sit directly between the user's eye and the photograph:
- **Mobile (`< md`):**
  `linear-gradient(180deg, rgba(252,251,248,0.94) 0%, rgba(252,251,248,0.86) 48%, rgba(252,251,248,0.62) 76%, rgba(252,251,248,0.34) 100%)`  
  *Impact:* The upper 48% of the image has 86%–94% opacity cream wash. The faces of the students are ghostly and washed out.
- **Tablet (`md` to `lg`):**
  `linear-gradient(90deg, rgba(252,251,248,0.98) 0%, rgba(252,251,248,0.95) 42%, rgba(252,251,248,0.82) 58%, rgba(252,251,248,0.4) 74%, rgba(252,251,248,0.08) 90%, transparent 100%)`  
  *Impact:* The left 42% is almost completely opaque (95–98%), and even past the midline (58%) the opacity is still 82%. On Slide 1, the left student's face is cut in half by an opaque milky veil.
- **Desktop (`lg+`):**
  `linear-gradient(90deg, rgba(252,251,248,0.98) 0%, rgba(252,251,248,0.94) 25%, rgba(252,251,248,0.78) 39%, rgba(252,251,248,0.45) 52%, rgba(252,251,248,0.12) 67%, transparent 82%)`  
  *Impact:* 78% opacity cream persists up to 39% of viewport width. The warm daylight, sunlight reflections, and vivid purple tones of the sweaters are desaturated and muted.

#### 4. Header Backdrop Blur & Overlap
- The sticky header has `backdrop-blur-[10px]` and `background: rgba(252, 251, 248, 0.74)`.
- The top 72px of every hero photograph is subjected to a 10px Gaussian blur and a 74% cream tint.

---

### 4.3 Subject Framing & Card Collisions by Slide

1. **Slide 1 (Learn):**
   - *Desktop (1440/1920):* Composition is strong. The two students are seated in the right 55% of the frame. The left text column has excellent contrast against the gradient.
   - *Tablet (768):* Severe flaw. The girl on the left is positioned at ~48% width; the 82% cream overlay cuts directly through her face and eyes, making her look like a ghostly apparition.
   - *Mobile (375):* The vertical gradient bleaches out both children's faces behind the headline and body text.
2. **Slide 2 (Practise):**
   - *Desktop (1440):* The student writing in her spiral notebook sits right where the `SampleQuestionCard` is placed. The card covers her hands, pen, and notebook page.
3. **Slide 3 (Prepare):**
   - *Desktop (1440):* Exam desk with timer and laptop. Clean, calm framing; minimal card conflict.
4. **Slide 4 (Understand):**
   - *Desktop (1440):* Hand writing maths calculations. The question card partially obscures the lower notebook margin.
5. **Slide 5 (Progress):**
   - *Desktop (1440):* Mother and son pointing at a laptop. The `SampleQuestionCard` is placed right in front of the mother's shoulder and lower torso. The laptop screen itself in the photo is completely blank/softly blurred, creating a slight disconnect with the card floating beside it.
6. **Slide 6 (Explore):**
   - *Desktop (1440):* Study desk with globe, atlas, and books. Excellent framing, balanced negative space, zero collision.

---

## 5. Comprehensive Section-by-Section Landing Page Audit

Audit conducted in order down the page across viewports `375px`, `768px`, `1024px`, `1440px`, and `1920px`:

### Section 1: Hero
- **Visual Hierarchy:** Headline (`text-[clamp(40px,5vw,68px)]`) has dominant authority. MindMosaic purple (`#5925A8`) is used deliberately for the key verb phrase "Practise with confidence."
- **Brand Consistency:** Diamond credibility bullets with rotation match the brand's mosaic design language.
- **Defects Identified:**
  - Pause button fails to pause rotation (P0).
  - Washed-out milky appearance from heavy CSS gradients (P1).
  - 1672x941 source resolution causes noticeable softening on 2x Retina screens (P1).
  - `SampleQuestionCard` collides with student writing subject on Slide 2 and Slide 5 (P2).
  - Hero timer buttons on 375px mobile are 34px wide, failing WCAG 44x44 AAA touch target standards (P2).

### Section 2: Learning Demo ("See how learning works")
- **Layout & Structure:** Three horizontal interactive progression tabs (01 Learn, 02 Practise, 03 Prepare) followed by a high-fidelity lesson card.
- **Product Realism:** Authentic Year 3 Mathematics lesson (`Unit fraction: A unit fraction has 1 on top...`). Shows clear learning intention, visual fraction bar diagram, worked example, and common misconception warning callout.
- **Interaction:** Tab states are clear; focus states meet WCAG 2.4.7 with `ring-4 ring-mm-brand/40`.
- **Finding (P3):** On 375px mobile, the three tabs stack vertically, which creates a tall block before the interactive card is visible. Consider a compact horizontal pill switcher on narrow viewports.

### Section 3: Product Tour ("See MindMosaic in action")
- **Layout:** Two-column split with a 4-step sequence on the left, and a supplied campaign photograph (`tour-hands-notebook.webp`) paired with 3 mini sample screen cards (Learn, Practise, Progress) on the right.
- **Authenticity:** Shows real product cards rather than decorative illustrations. "Watch the 90-second tour Video coming soon" manages expectations cleanly.
- **Finding (P2):** The 3 mini sample cards below the photograph are non-clickable previews with static text. Users instinctively tap them expecting an interactive preview or modal.

### Section 4: Program Highlights ("Find the right program")
- **Layout:** Reverse split featuring `programs-hands-laptop.webp` on the left and four program cards on the right.
- **Clarity:** Badges clearly delineate real availability:
  - NAPLAN-style: "Available (Years 3 and 5)"
  - ICAS-style: "Available (Years 3 and 5)"
  - Curriculum learning: "Limited"
  - Advanced & competition pathways: "Planned"
- **Finding (P2):** The entire card is wrapped in a link, but lacks a visible hover micro-interaction on the chevron arrow. Adding a subtle translation `group-hover:translate-x-1` improves affordance.

### Section 5: Responds to Student ("Learning that responds to the student")
- **Layout:** Three-step methodology narrative on the left, paired with a live "Skill Breakdown" report card from a Year 3 Numeracy test on the right.
- **Pedagogical Governance:** Prominently displays the deterministic promise: *"These suggestions come from clear, fixed rules applied to your child's answers — the same answers always lead to the same suggestion."* This upholds AGENTS.md rules against unpredictable black-box AI claims.
- **Finding (P3):** The progress bar beside "Getting there" and "Secure" uses low-contrast grey tracks (`oklab(...)`) which barely stand out against the white card background.

### Section 6: For Parents ("Clearer support for parents")
- **Layout:** Reverse split with Aisha's weekly 7-day study tracker on the left and `parent-laptop-clean.webp` on the right, followed by 3 parental benefit columns.
- **Lazy Loading Verification:** Image is lazy-loaded by Next.js. Loads smoothly as user scrolls into view.
- **Visuals:** Warm, realistic family learning setting. 7-day tracker card uses emerald green (`#0B6B63`) checkmarks for completed sessions.
- **Finding (P2):** On 1024px tablet landscape, the image and the card have mismatched aspect ratios, causing uneven vertical margins.

### Section 7: Quality Band ("Every question is written for MindMosaic...")
- **Atmosphere:** Full-width deep purple container (`#2A1257`) with crisp white typography. Creates a dramatic, high-contrast visual break in the page scroll.
- **Copy:** Emphasizes original content, worked explanations, automated publication checks, and Australian learning design.
- **Button:** "How we write and check questions ->" secondary CTA is clearly legible and well-padded.

### Section 8: Trust & Care ("Built carefully. Not generated carelessly.")
- **Layout:** Three-column trust architecture: Privacy, Accessible learning, Responsible technology.
- **Integrity:** Links directly to `/privacy`, `/accessibility`, `/terms`, and `/assessment-disclaimer`.
- **Finding (P3):** The assessment disclaimer text link at the bottom has a line-height of 18px, making the touch target relatively narrow on mobile devices.

### Section 9: FAQ ("Questions families ask")
- **Interaction:** Seven accordion disclosures implemented with smooth CSS grid expansion (`grid-template-rows: 0fr -> 1fr`).
- **Content:** Directly addresses year levels, NAPLAN/ICAS alignment, AI policy, parental access, and pricing.
- **Accessibility:** Full keyboard navigation support (Enter / Space opens/closes; aria-expanded updates dynamically).
- **Finding (P3):** The chevron icon rotates smoothly, but accordion headers could benefit from a slightly stronger focus ring when navigating via keyboard.

### Section 10: Closing CTA ("Start with one practice set")
- **Design:** Soft lilac-tinted banner (`bg-[#F6F4FB]`) with floating mosaic fragments.
- **CTA Pair:** "Start free" (primary brand button) and "Explore programs" (secondary outline button).
- **Conversion Alignment:** Directly eliminates onboarding friction: *"No complicated setup. Choose a program, answer a few questions and see how MindMosaic works."*

### Section 11: Footer
- **Architecture:** 4-column layout: Brand info & contact email (`hello@mindmosaic.app`), Product, Programs, Support, and legal sub-footer.
- **Australian Standards:** Explicitly states: *"Learning, practice and exam preparation for Australian students, written in Australian English."*
- **Legal Compliance:** Clear disclaimer that MindMosaic is independent and not affiliated with ACARA or UNSW Global.

---

## 6. Ranked Findings & Recommendations

### P0 — Critical / Broken / Blocking

#### Finding P0.1: Hero Slideshow Pause Button Does NOT Halt Carousel Rotation
- **Viewport:** All viewports (`375`, `768`, `1024`, `1440`, `1920`).
- **Component:** `src/features/landing/components/Hero.tsx` & `src/app/globals.css`.
- **Screenshot Evidence:** `hero-1440-slide-1.png`, `task-143.log`.
- **What is Wrong:**
  When a user clicks the Pause button, the icon flips to "Play", but the slide **still auto-advances after 5 seconds**.
- **Why it Matters:**
  Violates **WCAG 2.2.2 (Pause, Stop, Hide - Level A)**. Users with cognitive, attention, or visual tracking disabilities who explicitly request pausing motion are ignored.
- **Exact Recommended Fix:**
  1. In `Hero.tsx` line 268, pass the real pause state to the fill element:
     ```tsx
     data-auto={auto ? "true" : "false"}
     ```
  2. In `globals.css` line 936, increase specificity or use `!important` to ensure pause state overrides the animation shorthand:
     ```css
     [data-paused="true"] .mm-hero-fill,
     .mm-hero-fill[data-auto="false"] {
       animation-play-state: paused !important;
     }
     ```

---

### P1 — Major Visual / UX Issues

#### Finding P1.1: Heavy Cream CSS Overlays Wash Out Hero Photography
- **Viewport:** `375px` (vertical gradient) and `768px` (horizontal gradient).
- **Component:** `src/features/landing/components/Hero.tsx` (lines 149–151).
- **Screenshot Evidence:** `hero-375-slide-1.png`, `hero-768-slide-1.png`.
- **What is Wrong:**
  The CSS readability gradients apply up to 98% opacity `#FCFBF8` over the image. On mobile, student faces are bleached out behind text; on tablet portrait (768px), the girl on Slide 1 has a milky veil cutting straight across her eyes and nose.
- **Why it Matters:**
  The premium photography loses contrast, saturation, and emotional warmth. It looks like an accidental CSS opacity error or washed-out rendering rather than an intentional art direction.
- **Exact Recommended Fix:**
  - Replace the heavy linear cream block with an exponential ease-out gradient (`rgba(252,251,248,0.92)` to `transparent` over the first 35% on desktop).
  - On mobile, adjust the vertical gradient to terminate at 40% height so the children's faces remain untouched in natural sunlight.

#### Finding P1.2: Hero Source Assets (1672x941) are Under-Resolved on HiDPI Displays
- **Viewport:** `1440px` and `1920px` at 2x Retina.
- **Component:** `public/landing/campaign/hero-01` through `hero-06`.
- **Screenshot Evidence:** `hero-1440-slide-1.png`, `hero-1920-slide-1.png`.
- **What is Wrong:**
  The source bitmaps are only 1672x941. To fill a 1440x900 viewport at 2x DPR (2880 physical px) or 1920x1080 at 2x DPR (3840 physical px), the browser must stretch the image by up to 2.3x, introducing bilinear softness.
- **Why it Matters:**
  Perception of quality and sharpness is noticeably lower on desktop monitors and Retina laptops.
- **Exact Recommended Fix:**
  As noted in `content.ts` line 171, replace interim 1672x941 renders with 2560x1440 (or 2880x1620) source assets of the exact same compositions.

#### Finding P1.3: Continuous Cinematic Slow Zoom is Completely Absent
- **Viewport:** All viewports.
- **Component:** `src/features/landing/components/Hero.tsx` & `src/app/globals.css`.
- **What is Wrong:**
  The image scales from `scale(1.012)` to `scale(1)` in the first 350ms, then remains completely static for the remaining 4.65 seconds.
- **Why it Matters:**
  The owner explicitly expects a subtle, elegant, continuous camera motion (Ken Burns effect) across the full slide duration.
- **Exact Recommended Fix:**
  Add a smooth, linear slow zoom animation that runs for the full `--mm-hero-ms` (5000ms):
  ```css
  @keyframes mm-hero-pan {
    from { transform: scale(1.04); }
    to { transform: scale(1.0); }
  }
  .mm-hero-slide[data-active="true"] img {
    animation: mm-hero-pan var(--mm-hero-ms, 5000ms) linear forwards;
  }
  ```

---

### P2 — Meaningful Refinements

#### Finding P2.1: `SampleQuestionCard` Occludes Photographic Subjects on Slides 2 and 5
- **Viewport:** `1440px` and `1920px` (`xl:` breakpoint).
- **Component:** `src/features/landing/components/Hero.tsx` (line 241).
- **Screenshot Evidence:** `hero-1440-slide-2.png`, `hero-1440-slide-5.png`.
- **What is Wrong:**
  On Slide 2, the card covers the student's writing hands and notebook. On Slide 5, the card covers the mother's arm and sits awkwardly beside a blurred laptop screen.
- **Why it Matters:**
  Visual clumsiness where real UI collides with the photographic story rather than feeling harmoniously integrated.
- **Exact Recommended Fix:**
  Give the card per-slide placement or gentle responsive offsets, or adjust slide object-position (`object-position: 80% 50%`) so the subject stays clear of the bottom-right card anchor.

#### Finding P2.2: Hero Timer Buttons Violate WCAG AAA 44x44px Touch Target Size on Mobile
- **Viewport:** `375px`.
- **Component:** `src/features/landing/components/Hero.tsx` (line 259).
- **Screenshot Evidence:** `hero-375-slide-1.png`.
- **What is Wrong:**
  On mobile (375px), `w-[clamp(34px,5vw,60px)]` renders the timer touch targets at only 34px wide by 44px high.
- **Why it Matters:**
  While passing WCAG 2.5.8 (24x24 AA minimum), it fails WCAG 2.5.5 (44x44 Enhanced). Fingers easily mis-tap adjacent slides on mobile screens.
- **Exact Recommended Fix:**
  Add padding or pseudo-elements (`after:absolute after:inset-y-0 after:-inset-x-1.5`) to extend the tap hit-box to a minimum 44px width while keeping the visual pill line compact.

#### Finding P2.3: Manual Slide Selection Fails to Freeze Slideshow
- **Viewport:** All viewports.
- **Component:** `src/features/landing/components/heroCarouselState.ts`.
- **What is Wrong:**
  When a parent or student clicks Slide 3 to inspect it, the carousel resumes auto-advance after 5 seconds and moves to Slide 4.
- **Why it Matters:**
  Manual user action signals active interest in a specific slide; abruptly rotating away disrupts user reading and inspection.
- **Exact Recommended Fix:**
  Have manual selection set `userPaused = true` (or reset the timer with a 15-second grace period) so the user controls when to leave that slide.

---

### P3 — Polish & Micro-Interactions

#### Finding P3.1: Product Tour Sample Cards Appear Clickable but are Inert
- **Viewport:** Desktop & Tablet.
- **Component:** `src/features/landing/components/ProductTour.tsx`.
- **What is Wrong:**
  The three mini sample cards (Learn, Practise, Progress) under the laptop photo feature chevron indicators and card borders, but clicking them does nothing.
- **Exact Recommended Fix:**
  Either remove the chevrons so they read unambiguously as static labels, or wire them to toggle the active preview image.

#### Finding P3.2: Skill Breakdown Track Contrast in "Responds to Student"
- **Viewport:** All viewports.
- **Component:** `src/features/landing/components/RespondsToStudent.tsx`.
- **What is Wrong:**
  The grey unfilled portion of the progress bars has a contrast ratio under 2.0:1 against the white card surface.
- **Exact Recommended Fix:**
  Darken the track background from `var(--mm-track)` to `#E2DFD8` for crisp definition.

#### Finding P3.3: Assessment Disclaimer Footer Link Target
- **Viewport:** Mobile (`375px`).
- **Component:** `src/features/landing/components/TrustAndCare.tsx`.
- **What is Wrong:**
  The inline link `Assessment disclaimer` is 18px tall without vertical padding, making it difficult to tap on mobile.
- **Exact Recommended Fix:**
  Add `py-2 inline-block` to expand the hit target.

---

## 7. Top 10 Changes Ranked by Impact

| Rank | Priority | Issue Description | Impact Area | Effort |
| :---: | :---: | :--- | :--- | :---: |
| **1** | **P0** | Fix Hero pause button specificity so `data-paused="true"` halts the timer | A11y & User Control | Low (2 lines) |
| **2** | **P1** | Reduce heavy `#FCFBF8` cream gradient overlays to restore photo brightness & contrast | Visual Appeal & Brand | Low (CSS tweaks) |
| **3** | **P1** | Implement continuous slow cinematic zoom (`scale(1.04) -> scale(1.0)`) across 5000ms | Motion Polish | Low (CSS keyframes) |
| **4** | **P1** | Replace 1672x941 interim WebPs with native 2560x1440 source photography | Asset Sharpness | Medium (Asset swap) |
| **5** | **P2** | Offset `SampleQuestionCard` or tweak object-position on Slides 2 & 5 to prevent occlusion | Visual Hierarchy | Low |
| **6** | **P2** | Freeze slideshow upon manual slide selection instead of auto-advancing away in 5s | UX & Reading Flow | Low (State tweak) |
| **7** | **P2** | Expand mobile hero timer button touch targets to 44px min using invisible padding | Mobile Usability (WCAG) | Low |
| **8** | **P2** | Tune mobile 375px vertical gradient so children's faces remain clear in natural light | Mobile Polish | Low |
| **9** | **P3** | Make Product Tour sample cards interactive or soften chevron affordance | Interaction Clarity | Low |
| **10** | **P3** | Darken skill breakdown bar tracks in "Responds to Student" for better contrast | Accessibility Polish | Low |

---

*End of Audit Report.*  
*Artifacts and raw screenshots preserved in `docs/audits/screenshots/`.*
