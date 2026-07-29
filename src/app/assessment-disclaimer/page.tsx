import type { Metadata } from "next";
import Link from "next/link";

import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Assessment Disclaimer",
  description:
    "MindMosaic is not affiliated with, endorsed by, or administered by NAPLAN, ICAS or AMC.",
};

export default function AssessmentDisclaimerPage() {
  return (
    <LegalPageShell title="Assessment Disclaimer" lastUpdated="29 July 2026">
      <p>
        MindMosaic is an independent practice platform. It is not
        affiliated with, endorsed by, sponsored by, or administered by
        NAPLAN, ICAS or the Australian Mathematics Competition (AMC), or
        any of the organisations that own or administer those assessments.
      </p>

      <h2>What &quot;NAPLAN-style&quot; and &quot;ICAS-style&quot; mean here</h2>
      <p>
        NAPLAN is administered by ACARA (the Australian Curriculum,
        Assessment and Reporting Authority). ICAS is a trademark of its own
        owner. When MindMosaic describes a question or program as
        &quot;NAPLAN-style&quot; or &quot;ICAS-style&quot;, that describes
        the format and difficulty the content is modelled on — not its
        source. Every question on MindMosaic is written from scratch for
        MindMosaic; none are copied or adapted from an official NAPLAN,
        ICAS or AMC paper, and MindMosaic does not reproduce, license or
        redistribute any official assessment content.
      </p>

      <h2>What this means for results</h2>
      <p>
        Practising on MindMosaic does not guarantee, predict, or correlate
        with any particular result on an official NAPLAN, ICAS or AMC
        assessment. MindMosaic is a practice tool, not a diagnostic or
        predictive one, and no MindMosaic score, badge or dashboard metric
        should be read as a forecast of how a child will perform on an
        official assessment.
      </p>

      <h2>Trademarks</h2>
      <p>
        NAPLAN, ICAS and the Australian Mathematics Competition are the
        trademarks and/or registered assessments of their respective
        owners. Their use on this site is descriptive only (to explain the
        style of practice content offered) and does not imply any
        association, partnership or endorsement.
      </p>

      <p>
        See also our <Link href="/terms">Terms of Use</Link> and{" "}
        <Link href="/about">About MindMosaic</Link>.
      </p>
    </LegalPageShell>
  );
}
