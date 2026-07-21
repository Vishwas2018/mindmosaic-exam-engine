import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How MindMosaic collects, uses and protects family and student data.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="20 July 2026">
      <p>
        MindMosaic is a practice platform for Grade 3 and Grade 5 students,
        used by families and, in time, schools. This page describes what
        data the product actually collects and how it is actually used and
        protected today — not a generic template. Where something isn&apos;t
        built yet, we say so rather than describe a feature that doesn&apos;t
        exist.
      </p>

      <h2>Practising without an account</h2>
      <p>
        You can use the practice exam engine as a guest, with no sign-in and
        no account. Nothing about a guest session — answers, scores, or
        progress — is stored on our servers; it exists only in your
        browser for that session. Signing in is never required to practise.
      </p>

      <h2>What we collect, and why we keep it minimal</h2>
      <p>
        We store the minimum needed to run the product, and nothing more.
        We do not collect a child&apos;s date of birth, school name, home
        address, or any identifier beyond what a feature actually uses.
      </p>
      <h3>Parent accounts</h3>
      <p>
        A parent creates an account with a real email address and password
        (or by signing in through Google, Apple, Microsoft or Facebook — in
        which case that provider handles authentication under its own
        privacy policy). We store the parent&apos;s display name, email, and
        which student accounts they&apos;ve linked as their children.
      </p>
      <h3>Student accounts</h3>
      <p>
        <strong>A student never has a real email address on MindMosaic.</strong>{" "}
        A parent creates a student&apos;s account for them and receives a
        short login code and a PIN; the child signs in with that code and
        PIN, not an email address. Internally, the code is used to construct
        a non-guessable, MindMosaic-only alias address purely so our
        authentication system has something in that shape to work with —
        it is never a real mailbox, nothing is ever sent to it, and it is
        never shown to the child. For a student we store: display name,
        year level, their linked parent, and their own attempt history
        (the exams they&apos;ve taken and their results).
      </p>

      <h2>Who can see a child&apos;s data</h2>
      <p>A student&apos;s raw responses, attempt history and scores are visible to:</p>
      <ul>
        <li>that student, when signed in;</li>
        <li>the parent(s) who provisioned that student&apos;s account (read-only); and</li>
        <li>a teacher whose class that student is enrolled in, for that student only.</li>
      </ul>
      <p>
        A child&apos;s data is never visible to another family, another
        teacher&apos;s class, or another student. Where a question is marked
        by a teacher rather than scored automatically (currently: essay-style
        responses), the marking teacher sees that specific response and the
        feedback they write is stored against it — nothing else in the
        child&apos;s history becomes visible to them as a result.
      </p>
      <p>
        Product-level dashboards used by us as the operator show
        pre-aggregated statistics only (things like overall attempt counts
        and question-level accuracy across all users) — not an individual
        child&apos;s raw answers. Our internal policy is that any exceptional
        access to an individual child&apos;s raw data for support purposes
        must go through a named, deliberate process rather than ad hoc
        database browsing — we hold ourselves to that even while the
        product is operated by a single person who is also a parent, because
        that discipline is what the access model has to look like once
        other families&apos; and other teachers&apos; data is involved.
      </p>

      <h2>Security</h2>
      <p>
        Access to stored data is enforced at the database level (row-level
        security), not only in the application — so even a bug in a page or
        API route can&apos;t show one family&apos;s data to another. For a
        signed-in student, exam question selection and scoring both happen
        on our servers: your browser is never sent an answer key before you
        submit, and nothing your browser sends can change how your own
        attempt is scored.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>
        We do not sell personal data. We do not run advertising or
        behavioural-tracking scripts on MindMosaic today. We do not alter
        question content based on billing status. We do not market directly
        to children.
      </p>

      <h2>Payments</h2>
      <p>
        MindMosaic does not process payments yet. When billing is
        introduced, card details will be handled entirely by a third-party
        payment provider away from our own servers — MindMosaic itself will
        never see, transmit, or store your card number. A guest or a free
        account will never be blocked from practising because of billing
        status; billing will only ever gate optional paid features.
      </p>

      <h2>Data retention and deletion</h2>
      <p>
        We have not yet published a formal data-retention or account-deletion
        policy — this is a known gap, not an oversight we&apos;re hiding.
        MindMosaic is currently in a personal-use development phase; a
        written retention and deletion policy will be published before any
        wider, non-personal deployment goes live. If you&apos;d like a
        family&apos;s data removed in the meantime, contact us at{" "}
        <a href="mailto:hello@mindmosaic.app">hello@mindmosaic.app</a> and
        we will action it directly.
      </p>

      <h2>Australian Children&apos;s Online Privacy Code</h2>
      <p>
        Australia&apos;s Children&apos;s Online Privacy Code will apply to
        online services likely to be accessed by children, with registration
        due by <strong>10 December 2026</strong>. We record this here as a
        commitment, not a compliance claim: we intend to review
        MindMosaic&apos;s obligations under the Code as its details are
        finalised and to register within the required timeframe. This
        paragraph will be updated once that review and registration are
        complete.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        We&apos;ll update this page as the product changes — most notably
        before payments launch and before any move beyond the current
        personal-use phase. Material changes will update the date at the
        top of this page.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or a request about your family&apos;s
        data can be sent to{" "}
        <a href="mailto:hello@mindmosaic.app">hello@mindmosaic.app</a>. See
        also our{" "}
        <Link href="/terms">Terms of Service</Link> and{" "}
        <Link href="/accessibility">Accessibility Statement</Link>.
      </p>
    </LegalPageShell>
  );
}
