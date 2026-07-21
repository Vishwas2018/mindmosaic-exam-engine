import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms that govern using MindMosaic.",
};

export default function TermsPage() {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="20 July 2026">
      <p>
        These terms describe how MindMosaic may be used. By practising as a
        guest, or by creating or using an account, you agree to them. See
        our <Link href="/privacy">Privacy Policy</Link> for how we handle
        data, and our <Link href="/accessibility">Accessibility Statement</Link>{" "}
        for the current state of accessibility support.
      </p>

      <h2>What MindMosaic is</h2>
      <p>
        MindMosaic is a practice platform for Grade 3 and Grade 5 students,
        offering NAPLAN-style and ICAS-style practice exams. These labels
        describe the style and format of original practice content only.
        MindMosaic does not reproduce official NAPLAN or ICAS assessment
        items, and is not affiliated with, endorsed by, or administered by
        ACARA (which administers NAPLAN) or the owner of the ICAS trademark.
        Every question, passage, answer, and explanation on MindMosaic is
        created originally for MindMosaic.
      </p>
      <p>
        MindMosaic is a practice tool. It is not an official assessment, and
        performance in a practice exam is not a prediction or guarantee of
        performance in any real NAPLAN, ICAS, or other assessment.
      </p>

      <h2>Accounts and eligibility</h2>
      <p>
        You can practise without creating an account at all — nothing is
        stored, and no sign-in is required.
      </p>
      <ul>
        <li>
          <strong>Parent accounts</strong> are self-service: a parent (an
          adult) creates their own account with an email address and
          password, or via a supported third-party sign-in provider.
        </li>
        <li>
          <strong>Student accounts</strong> are not self-service. A child
          does not register their own account or supply their own email — a
          parent creates the student account on their behalf and gives the
          child a login code and PIN to sign in with. You are responsible
          for keeping a child&apos;s login code and PIN within your family;
          they exist so a child can sign in on a shared device, not so the
          account can be shared outside your household.
        </li>
        <li>
          <strong>Teacher and admin accounts</strong> are assigned manually
          and are not available through public sign-up.
        </li>
      </ul>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>
          attempt to bypass, probe, or defeat the server-side scoring and
          access controls that keep one account&apos;s or family&apos;s data
          separate from another&apos;s;
        </li>
        <li>
          scrape, copy, redistribute, or resell the question bank or any
          other MindMosaic content outside of normal use of the product;
        </li>
        <li>share a student&apos;s login code and PIN outside your household; or</li>
        <li>
          use the platform to upload or submit content that is unlawful,
          abusive, or that isn&apos;t your own original response to a
          question.
        </li>
      </ul>

      <h2>Content you submit</h2>
      <p>
        Some question types (currently: essay-style responses) ask you to
        write your own answer, which a teacher may later mark and give
        feedback on. We store that response and any resulting mark and
        feedback as part of your attempt history, visible to the roles
        described in our <Link href="/privacy">Privacy Policy</Link>. We
        don&apos;t claim any ownership over what you write beyond what&apos;s
        needed to operate the marking workflow itself.
      </p>

      <h2>Payments</h2>
      <p>
        MindMosaic does not process payments yet. When a paid plan is
        introduced, these terms will be updated to describe it before it
        launches. Guest and free access to practise will never be removed
        or gated as a result of billing status.
      </p>

      <h2>No warranty, and this is a draft</h2>
      <p>
        MindMosaic is provided on an &quot;as is&quot; basis, without
        warranty of any kind, express or implied. As the banner on this page
        says, this document is an honest, structured draft describing how
        the product actually works — it has not yet been reviewed by a
        qualified legal professional and is not final legal text.
      </p>

      <h2>Suspension and termination</h2>
      <p>
        We may suspend or terminate access for use that violates the
        acceptable-use section above, including attempts to bypass access
        controls or sharing a student&apos;s credentials outside your
        household.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We&apos;ll update this page as the product changes — most notably
        before payments launch. Material changes will update the date at
        the top of this page.
      </p>

      <h2>Governing law</h2>
      <p>
        MindMosaic operates from Australia and these terms are intended to
        be read under Australian law, consistent with the rest of this
        site. As noted above, this is a draft pending professional legal
        review, including of this section.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href="mailto:hello@mindmosaic.app">hello@mindmosaic.app</a>.
      </p>
    </LegalPageShell>
  );
}
