# UI, UX, Responsive and Accessibility Audit

## Coverage and method

Source semantics, design tokens, component states and 31 Playwright specifications were inspected. Focused renderer, navigation, dialog, drag/drop, pattern-picker, billing and shell component tests passed within the 1,205-test critical subset. Existing E2E specifications target 375×812, 768×1024 and desktop layouts, keyboard walkthroughs, overflow and axe serious/critical violations. A fresh rendered audit at 320/375/768/1024/1440, zoom and screen-reader use was blocked by the unavailable in-app browser and non-completing Playwright runner.

## Verified strengths

- Brand tokens implement the intended purple/coral/warm palette; Roboto is configured through the app layout.
- Native semantic controls are common. The submit dialog has focus entry, trap behaviour, Escape close and opener restoration tests.
- Ordering supplies move buttons; drag/drop supplies a select-based keyboard alternative; hotspot uses focusable checkbox semantics.
- Question changes move focus to the new heading without stealing focus on ordinary answer updates.
- Reduced-motion styling and emulation exist; focus-visible rings are tested across key primitives.
- Charts/tables use structured HTML/SVG and visual schemas require alternative text.
- The earlier suspected `<dt>/<dd>` issue is ruled out: DOM order is valid; CSS changes only visual order.
- Token-level contrast tests complement axe scans rather than relying solely on route samples.

## Findings affecting UX/accessibility

### P1 High

- `MM-AUD-FUNC-002`: the student assignment surface tells users to complete work but offers no Start/Resume control. This is a comprehension and task-completion blocker, not merely missing polish.
- `MM-AUD-FUNC-003`: teacher feedback and awarded marks never reach the learner/parent result experience, leaving “pending” semantics permanently stale.
- `MM-AUD-PROD-001`: the hero and SEO frame a primary/secondary curriculum-and-competitions platform before clearly establishing that only Years 3/5 NAPLAN-/ICAS-style practice is live.

### P2 Medium

- `MM-AUD-NAV-001`: public information architecture has two competing contracts. The implemented later map adds Learn, Exam Preparation and Resources and renames login/signup paths; governance has not been reconciled.
- `MM-AUD-BILL-001`: the plans intro says Family pricing is live and charged while the same page sources a placeholder disclaimer and roadmap CTA.
- `MM-AUD-PERF-002`: `/results` and `/showcase` exceed their configured JS budgets; this disproportionately affects result review and the renderer harness.

## State review

Loading, empty, not-configured and error components are broadly reusable and accessible. Role shells have mobile disclosures and explicit current destinations. Disabled/unavailable programme cards are intentionally non-links. The weakest state models are assignment progress, post-manual-mark completion and post-submit retry recovery.

## Gaps and blocked verification

No fresh claim is made for WCAG 2.2 AA conformance. Colour contrast across every rendered chart/state, 200%/400% reflow, touch targets at 320 px, VoiceOver/NVDA announcements, auth autofill and real layout shift remain unverified. Existing test design is strong evidence, not a substitute for manual assistive-technology testing.

## Priorities

Close assignment/marking workflows first; reconcile public IA and product-truth copy; then run a fresh browser matrix with keyboard, zoom, reduced motion, axe and at least one desktop/mobile screen reader before release.
