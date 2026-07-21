import type { Metadata } from "next";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "The current state of accessibility support on MindMosaic.",
};

export default function AccessibilityPage() {
  return (
    <LegalPageShell title="Accessibility Statement" lastUpdated="20 July 2026">
      <p>
        This page describes the current, actual state of accessibility work
        on MindMosaic — what has been built and tested, and what hasn&apos;t
        been yet. We&apos;d rather understate this than claim a level of
        conformance we haven&apos;t verified.
      </p>

      <h2>What we test today</h2>
      <p>
        We run automated <code>axe-core</code> accessibility scans, as part
        of our test suite, across the marketing home page, the practice
        setup page, an in-progress exam, the open submission dialog, the
        results page, and the question-review section. These scans are
        checked for &quot;serious&quot; and &quot;critical&quot; impact
        violations on every change; a change that introduces one doesn&apos;t
        ship. &quot;Minor&quot; and &quot;moderate&quot; findings are not
        currently gated the same way, so some may still exist in less
        central parts of the product.
      </p>
      <p>
        We also have automated tests for keyboard-specific behaviour: that
        moving between exam questions moves focus to the new question&apos;s
        heading, and that the exam submission dialog behaves as a proper
        modal (focus stays inside it while open). Practising an exam is
        designed to work with a keyboard alone, without a mouse or
        touchscreen.
      </p>

      <h2>Built-in accessibility features</h2>
      <ul>
        <li>
          A &quot;Skip to main content&quot; link at the very start of every
          page, for keyboard and screen-reader users to bypass repeated
          navigation.
        </li>
        <li>
          Visible focus indicators on every interactive element (links,
          buttons, form controls) — not just a browser default outline
          suppressed elsewhere.
        </li>
        <li>
          Semantic landmarks and labelling: a single <code>main</code>{" "}
          region per page, labelled navigation regions, and headings that
          follow a logical order rather than being chosen for visual size.
        </li>
        <li>
          Text colour choices checked against WCAG&apos;s 4.5:1 contrast
          minimum for normal text — our muted/secondary text colour, and
          the warning and success status colours, were each darkened after
          an automated scan measured them at 4.33–4.39:1 against their
          typical backgrounds, narrowly under the threshold.
        </li>
        <li>
          Correct answers and score-revealing content are never present in
          the page, an API response, or an error message before you submit
          an exam — not an accessibility feature on its own, but relevant
          to anyone using assistive technology to inspect page content
          mid-exam.
        </li>
      </ul>

      <h2>Known gaps</h2>
      <p>
        Being honest about what this doesn&apos;t cover yet:
      </p>
      <ul>
        <li>
          We have not completed dedicated manual testing with a screen
          reader (e.g. NVDA, JAWS, or VoiceOver). Our automated scans check
          for many screen-reader-relevant issues (labelling, roles,
          contrast) but are not a substitute for using the product with one.
        </li>
        <li>
          We do not claim formal WCAG 2.1 or 2.2 AA conformance. Our
          automated scans target serious/critical issues on the pages
          listed above; they don&apos;t cover every page, every state, or
          every success criterion.
        </li>
        <li>
          &quot;Minor&quot; and &quot;moderate&quot; automated findings are
          tracked but not currently required to reach zero before a change
          ships.
        </li>
      </ul>

      <h2>Feedback</h2>
      <p>
        If you or your child run into an accessibility barrier using
        MindMosaic, tell us — a specific page and what happened is the most
        useful report — at{" "}
        <a href="mailto:hello@mindmosaic.app">hello@mindmosaic.app</a>.
      </p>
    </LegalPageShell>
  );
}
