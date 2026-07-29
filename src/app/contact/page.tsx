import type { Metadata } from "next";
import Link from "next/link";

import { SUPPORT_EMAIL } from "@/features/landing/content";
import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach MindMosaic — one real email address, no contact form.",
};

export default function ContactPage() {
  return (
    <LegalPageShell title="Contact & Support" lastUpdated="29 July 2026">
      <p>
        There&apos;s no contact form on MindMosaic — just one real email
        address that reaches a person:{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>What to include</h2>
      <p>
        For the fastest reply, include what you were trying to do, what
        happened instead, and (if it applies) which page or practice
        session it happened on. For a data or account question, include the
        parent account&apos;s email address so we can look it up.
      </p>

      <h2>Before you write in</h2>
      <p>A few common questions already have answers on this site:</p>
      <ul>
        <li>
          General questions about how MindMosaic works: the{" "}
          <Link href="/#faq">FAQ</Link>.
        </li>
        <li>
          Setting up a family account or adding a child: the{" "}
          <Link href="/help">Help Centre</Link>.
        </li>
        <li>
          How progress and skill breakdowns work: the{" "}
          <Link href="/parent-guide">Parent Guide</Link>.
        </li>
        <li>
          Data, privacy or accessibility: our{" "}
          <Link href="/privacy">Privacy Policy</Link> and{" "}
          <Link href="/accessibility">Accessibility Statement</Link>.
        </li>
      </ul>

      <h2>Response time</h2>
      <p>
        MindMosaic is currently run by a very small team, so we can&apos;t
        promise a fixed response time — but we do read and answer every
        message.
      </p>
    </LegalPageShell>
  );
}
