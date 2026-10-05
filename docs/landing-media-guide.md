# MindMosaic Landing Campaign Media Guide

An owner-friendly operational reference for managing, replacing, and maintaining photography assets across the MindMosaic landing experience.

---

## 1. Overview & Golden Rules

1. **Central Dynamic Registry:** All landing imagery is governed by [`src/features/landing/media.ts`](file:///src/features/landing/media.ts). Components consume media slots (`landingMedia.hero.learn`, etc.) rather than hardcoding file paths.
2. **Never Edit Component Code to Swap Photos:** To replace or adjust a hero photo, update the media slot configuration in `src/features/landing/media.ts` and add the new file. Never edit `Hero.tsx`.
3. **Cache-Safe Versioning:** Every media slot resolves to a versioned physical file (`*-v1.webp`, `*-v2.webp`). When an asset is replaced in production, incrementing the revision (e.g., `v1` $\to$ `v2`) produces a fresh URL that immediately busts browser, CDN, and Next.js image optimizer caches.
4. **Hero Image Specifications:**
   * **Preferred Resolution:** `2560 × 1440` px
   * **Minimum Resolution:** `2400 × 1350` px
   * **Aspect Ratio:** `16:9`
   * **Current State:** `1672 × 941` px interim assets (clean, sharp, do not upscale).
   * **Format:** Modern WebP / AVIF.
5. **Face-Budget Integrity Rule:**
   * MindMosaic enforces an intentional, calm, student-focused aesthetic.
   * **Maximum page-wide visible faces:** **$\le 2$**.
   * Intended face-visible slots: `hero.learn` (Slide 1) and `parents.main` (Parent section).
   * Slides 2–6 and all other sections must remain **hands-only** or **abstract**.

---

## 2. Media Slot Directory & Specifications

| Slot ID | Section | Current Physical File | Purpose | Treatment | Preferred Res | Min Res | Aspect | Mobile Focal | Tablet Focal | Desktop Focal | Zoom Direction | Proof-Card Pos | Status | Replacement Instructions |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hero.learn` | Hero 01 — Learn | `/landing/media/hero/hero-01-learn-v1.webp` | Primary entry point establishing calm, collaborative student learning | `face-visible` | 2560×1440 | 2400×1350 | 16:9 | 68% 50% | 70% 50% | 70% 50% | Zoom Out (1.035 $\to$ 1.000) | `right-low` | Interim (1672×941) | Place `hero-01-learn-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. |
| `hero.practise` | Hero 02 — Practise | `/landing/media/hero/hero-02-practise-v1.webp` | Focus on active practice, notebook working, and digital exam tools | `hands-only` | 2560×1440 | 2400×1350 | 16:9 | 78% 50% | 75% 50% | 75% 50% | Zoom In (1.000 $\to$ 1.025) | `right-mid` (avoids notebook) | Interim (1672×941) | Place `hero-02-practise-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. Keep hands-only. |
| `hero.prepare` | Hero 03 — Prepare | `/landing/media/hero/hero-03-prepare-v1.webp` | Calm test-day exam desk setup with timer, notebook, and laptop | `hands-only` | 2560×1440 | 2400×1350 | 16:9 | 62% 50% | 70% 50% | 70% 50% | Zoom Out (1.030 $\to$ 1.000) | `right-low` | Interim (1672×941) | Place `hero-03-prepare-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. |
| `hero.understand` | Hero 04 — Understand | `/landing/media/hero/hero-04-understand-v1.webp` | Insightful feedback and reviewing worked solution steps | `hands-only` | 2560×1440 | 2400×1350 | 16:9 | 78% 50% | 75% 50% | 75% 50% | Zoom In (1.000 $\to$ 1.025) | `right-low` | Interim (1672×941) | Place `hero-04-understand-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. |
| `hero.progress` | Hero 05 — Progress | `/landing/media/hero/hero-05-progress-v1.webp` | Parent and child reviewing milestone growth from behind | `hands-only` | 2560×1440 | 2400×1350 | 16:9 | 74% 50% | 68% 50% | 68% 50% | Zoom Out (1.030 $\to$ 1.000) | `right-mid` (avoids laptop screen) | Interim (1672×941) | Place `hero-05-progress-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. Face-free. |
| `hero.explore` | Hero 06 — Explore | `/landing/media/hero/hero-06-explore-v1.webp` | Curiosity and deep mastery across subjects (globe, atlas, tablet) | `hands-only` | 2560×1440 | 2400×1350 | 16:9 | 76% 50% | 72% 50% | 72% 50% | Zoom In (1.000 $\to$ 1.025) | `right-low` | Interim (1672×941) | Place `hero-06-explore-v2.webp` in `public/landing/media/hero/`, update `revision: "v2"` in `media.ts`. |
| `productTour.main` | Product Tour | `/landing/media/product-tour/product-tour-study-v1.webp` | Demonstrates guided exam walkthrough in realistic study context | `hands-only` | 1600×1000 | 1200×800 | 16:10 | Center | Center | Center | None | N/A | Approved | Place `product-tour-study-v2.webp` in `public/landing/media/product-tour/`, update `revision: "v2"`. |
| `programs.main` | Programs | `/landing/media/programs/programs-study-v1.webp` | Contextual visual supporting NAPLAN and ICAS curriculum alignment | `hands-only` | 1600×1000 | 1200×800 | 16:10 | Center | Center | Center | None | N/A | Approved | Place `programs-study-v2.webp` in `public/landing/media/programs/`, update `revision: "v2"`. |
| `parents.main` | Trust & Care / Parents | `/landing/media/parents/parents-progress-review-v1.webp` | Parent at laptop while child writes in notebook nearby | `face-visible` | 1600×1000 | 1200×800 | 16:10 | Center | Center | Center | None | N/A | Approved | Place `parents-progress-review-v2.webp` in `public/landing/media/parents/`, update `revision: "v2"`. |

---

## 3. How to Replace a Photo (Step-by-Step for Owners)

### Example: Replacing Hero 03 "Prepare"
1. **Prepare the image:**
   * Export the new photograph at `2560 × 1440` (or minimum `2400 × 1350`) WebP format.
   * Verify the image contains **no visible faces** (hands, notebooks, desks, or abstract study tools only).
2. **Save the file with a new version number:**
   * Copy the file to `public/landing/media/hero/hero-03-prepare-v2.webp`.
3. **Update the media registry:**
   * Open `src/features/landing/media.ts`.
   * Find `hero.prepare`.
   * Update `revision: "v2"`.
   * If the subject moved, tune `focalMobile`, `focalTablet`, or `focalDesktop` percentages.
   * If the sample question card covers an important element, set `proofPosition: "right-mid"` or `"right-low"`.
4. **Do not touch `Hero.tsx`:**
   * The hero carousel automatically reads the new URL, applies the focal alignment, attaches the cinematic zoom, and serves the updated image at `quality={90}`.
