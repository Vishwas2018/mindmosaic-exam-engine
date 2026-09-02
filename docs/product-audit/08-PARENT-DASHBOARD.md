# 08. Parent Dashboard Audit

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Classification:** `COMPLETE` (Core Progress) / `PARTIAL` (Prose Insights Gating)

---

## 1. Parent Dashboard Architecture (`src/app/parent/page.tsx`)

The Parent Dashboard is designed to give parents clear visibility into their children's learning cadence, strengths, and areas requiring support.

```text
Parent Dashboard Layout
├── Multi-Child Switcher ([Oliver (Year 3)] [Chloe (Year 5)] [+ Add Child])
├── Child Overview Header
│   ├── Latest Sitting Score Ring (e.g. 84% Strong)
│   ├── Time Spent Practising This Week (e.g. 1 hr 45 min)
│   ├── 7-Day Activity Sparkline (M T W T F S S)
│   └── Performance Band Summary (Strong / Good / Building / Needs Practice)
├── Subject Breakdown Grid (Numeracy, Reading, Language, Science)
├── Learning Insights Card (Subscription-Gated)
│   ├── Learning Observations (Plain-language progress commentary)
│   ├── Recommended Next Actions (Specific topic practice recommendations)
│   └── Readiness Score (%) & Topics Mastered Count
├── Recent Assessment Attempts Table (Date, Exam Style, Marks, Detailed Drill-down)
└── Family Plan & Billing Card (Manage subscription, seats, invoices)
```

---

## 2. Real Database Integration & Multi-Child Queries

* **Data Loader (`src/features/parent-dashboard/queries.ts`)**:
  - Executes as the signed-in parent via cookie-scoped client.
  - Queries `parent_children` to list linked child IDs.
  - Fetches child attempts from `resolved_sittings` view under strict RLS policies.
* **Child Summary Aggregation (`src/features/parent-dashboard/summary.ts`)**:
  - `buildChildSummary()` computes aggregate metrics entirely server-side.
  - Pure deterministic calculations: average score, time this week, consecutive day streaks, and subject mastery bands.

---

## 3. Performance Bands & Categorisation

MindMosaic categorises subject and attempt scores into 4 clear parent-friendly bands:

| Band | Score Range | Badge Variant | Parent Meaning |
| :--- | :--- | :--- | :--- |
| **Strong** | `80% – 100%` | `success` (Green) | Secure conceptual mastery; ready for extension. |
| **Good** | `65% – 79%` | `purple` (Purple) | Solid working understanding with minor slip-ups. |
| **Building** | `50% – 64%` | `warning` (Amber) | Foundational grasp; requires consolidation. |
| **Needs practice** | `< 50%` | `error` (Coral) | Key concept gap; prioritised for immediate review. |

---

## 4. Learning Insights & Subscription Gating (`LearningInsights.tsx`)

* **Free Tier vs Family Plan:**
  - Standard score breakdowns, attempt history, and streak trackers are **100% free**.
  - Deeper narrative commentary (*"Oliver is excelling in 2D Geometry but hesitated on multi-step fraction subtraction"*) is displayed via `LearningInsights.tsx`.
* **Subscription Gating (`src/lib/billing/subscription.ts`)**:
  - If parent subscription is active or in trial (`hasAccess === true`), full narrative observations and recommended action cards are shown.
  - If inactive/expired, renders `UpgradeRequired` component with a direct link to `/billing`.
  - *(Note: `FAMILY_PLAN_AVAILABILITY` is currently `"roadmap"`, with commercial purchasing disabled pending final pricing and legal reviews).*

---

## 5. Parent Evaluation Checklist

| Question | Can Parent Answer? | Evidence |
| :--- | :--- | :--- |
| **What has my child practised?** | **YES** | Recent attempts table lists exact papers and dates. |
| **How often are they practising?** | **YES** | 7-day visual calendar and weekly minutes tally. |
| **How are they performing?** | **YES** | Conic score ring and subject mastery percentage bars. |
| **What are their strengths?** | **YES** | Green "Strong" badges highlight mastered subjects. |
| **Where are they struggling?** | **YES** | Coral "Needs practice" badges highlight weak areas. |
| **Are they improving?** | **PARTIAL** | Shows latest vs average score, but lacks historical multi-month trend charts. |
| **What should they practise next?** | **GOOD** | Recommended actions list suggests specific focus topics. |
