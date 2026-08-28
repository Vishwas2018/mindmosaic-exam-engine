# 17. Recommended Product Roadmap

**Audit Date:** 26 August 2026  
**Auditor:** Antigravity  
**Execution Horizon:** Pragmatic waves designed for a single developer using Claude Code and Codex

---

## Wave 0: Blockers & Architectural Hardening (Week 1)

### Objective
Resolve all boundary test checks, seal server-only security boundaries, and enforce verifiable content provenance.

* **Specific Features & Fixes:**
  1. Add `import "server-only";` to `src/features/content-platform/operator-service.ts` to satisfy defense-in-depth static bundle checks.
  2. Maintain strict separation between publication writes and runtime scoring: update `scoring-module-boundary.test.ts` to classify SQL statements, allowing authorized publication `INSERT` statements while strictly forbidding runtime `SELECT`/`JOIN` reads outside `src/server/scoring/answer-access.ts`.
  3. Update Content Factory publication schema to require a recorded `approvedBy` human reviewer signature before publishing.
  4. Move 120 orphaned questions in `content/manual-questions/_conflicts/` through the automated validation checker.
* **Dependencies:** None.
* **Why It Matters:** Restores a 100% green static/unit test build and preserves the least-privilege architecture of the scoring engine.
* **What NOT to Include:** Do not route publication writes through the runtime scoring module.
* **Acceptance Criteria:** `src/tests/unit/stripe-server-only.test.ts` and `src/tests/unit/scoring-module-boundary.test.ts` pass 100%.

---

## Wave 1: Complete the Core Learning Loop (Weeks 2–3)

### Objective
Turn MindMosaic from a "question runner" into a complete self-reinforcing learning loop.

* **Specific Features:**
  1. **Results Page "Practise Missed Skills" Action & 5-Question Drill Launcher:** `[COMPLETE]` Live vertical slice connects `recommendSkills` $\rightarrow$ `buildDrill` with opaque sessionStorage handoff (`/practice/session?mode=drill&launchId=<id>`) and prior question exclusion.
  2. **Deterministic Multi-Sitting Historical Sub-Strand Recommendation Engine:** `[NEXT]` Aggregate historical student answers across multiple sittings by `strand` and `skill` tag for the Student and Parent dashboards.
  3. **Learning Hub Practicable Skill Browser:** `[COMPLETE]` Gated skill catalogue exposing only skills backed by $\ge 5$ published questions, with search and pagination.
  4. **Student First-Run Onboarding Modal:** `[PLANNED]` A 3-step friendly welcome modal upon child login offering a 5-question diagnostic warmup.
* **Dependencies:** Wave 0 completion.
* **Why It Matters:** Connects assessment completion directly to actionable learning, dramatically boosting student progress and parent retention.
* **What NOT to Include:** Do not build complex adaptive IRT models; simple deterministic rule-based targeting delivers 90% of the value with zero latency.
* **Acceptance Criteria:** A student sitting a test can click "Practise Missed Skills" on the Results screen and immediately sit a 5-question drill focused on their specific errors.

---

## Wave 2: Premium Parent & Student Experience (Weeks 4–5)

### Objective
Deliver high-perceived-value premium features that drive Family Plan subscription conversions and retention.

* **Specific Features:**
  1. **Downloadable Diagnostic Summary (PDF):** One-click printable PDF report of child strengths, gap analysis, and NAPLAN band projection for parent-teacher meetings.
  2. **Weekly Parent Progress Email Digest:** Sunday evening automated email summarising child practice time, accuracy gains, and recommendations for the week.
  3. **Multi-Month Mastery Trend Chart:** Visual graph showing score progression over time in the Parent Dashboard.
  4. **Spaced Repetition "Mistake Revision Deck":** Personal deck where incorrectly answered questions reappear after 3 days and 7 days.
* **Dependencies:** Wave 1 completion + Resend/Postmark email integration.
* **Why It Matters:** Gives parents tangible, shareable evidence of learning ROI, justifying the $19/mo subscription.
* **What NOT to Include:** Do not build public social leaderboards or multiplayer game modes.
* **Acceptance Criteria:** A parent can download a clean PDF report and receives automated weekly progress digests.

---

## 3. Wave 3: Content Depth Expansion (Weeks 6–8)

### Objective
Fill all Grade 3 & Grade 5 NAPLAN and ICAS capacity cells to achieve 3,000+ total published questions.

* **Specific Features:**
  1. Ingest ~1,700 questions across Grade 3 & 5 Numeracy, Reading, Language Conventions, Science, and Digital Tech.
  2. Achieve 50+ items per cell across Easy, Medium, and Challenging bands.
  3. Implement Audio Spelling pronunciation player (`<audio>` component with synthetic en-AU voice) for genuine spelling tests.
* **Dependencies:** Wave 0 Content Factory validation.
* **Why It Matters:** Unlocks multiple non-repeating full-length mock exams per subject.
* **Acceptance Criteria:** `npm run capacity:report` reports 0 capacity deficits across all Year 3 and Year 5 NAPLAN and ICAS cells.

---

## 4. Wave 4: Programme Expansion (Post-Launch)

### Objective
Expand into high-demand Australian academic extension markets.

* **Specific Features:**
  1. **Selective School & Scholarship Entry (NSW / VIC):** Grade 6 / Year 7 Thinking Skills, Mathematical Reasoning, and Advanced Reading comprehension.
  2. **Australian Mathematics Competition (AMC):** Middle Primary (Years 3–4) and Upper Primary (Years 5–6) non-routine problem sets.
  3. **Singapore Maths Heuristics:** Bar-modelling visual geometry and multi-step word problem modules.
* **Dependencies:** Core V1 launch stability.
