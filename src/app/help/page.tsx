import type { Metadata } from "next";
import Link from "next/link";

import { SUPPORT_EMAIL } from "@/features/landing/content";
import { LegalPageShell } from "@/features/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Help Centre",
  description:
    "Getting started, adding a child, PIN sign-in and account questions for MindMosaic.",
};

export default function HelpPage() {
  return (
    <LegalPageShell title="Help Centre" lastUpdated="29 July 2026">
      <p>
        Short, practical answers to the questions that come up most.
        General product questions are also covered in the{" "}
        <Link href="/#faq">FAQ</Link> on the home page.
      </p>

      <h2>Getting started</h2>
      <p>
        You don&apos;t need an account to practise — go to{" "}
        <Link href="/practice">Practice</Link>, pick a program (or build
        your own set with any year level, style and subject), and start.
        Nothing about a guest session is saved on our servers; it exists
        only in your browser for that session, so your results won&apos;t
        be there if you come back later.
      </p>
      <p>
        A parent account is only needed if you want a child&apos;s progress
        tracked across sessions and visible on a dashboard. Sign up as a
        parent, then add your child from there.
      </p>

      <h2>Adding a child</h2>
      <p>
        From your parent account, add a child by giving them a name and
        year level. MindMosaic then generates a short login code and a PIN
        for that child — write these down, since the child needs both to
        sign in. A child never has a real email address on MindMosaic; the
        login code and PIN are how they sign in instead, from the{" "}
        <Link href="/student-sign-in">student sign-in</Link> page.
      </p>

      <h2>The PIN</h2>
      <p>
        A student&apos;s PIN is exactly 6 digits. It doubles as that
        account&apos;s password internally, which is why it has to be a
        fixed length rather than &quot;at least&quot; 6 digits. If a child
        forgets their PIN, a parent can look up their login details from
        the parent dashboard.
      </p>

      <h2>Resetting a child&apos;s progress</h2>
      <p>
        There isn&apos;t a self-service &quot;reset progress&quot; button
        today — we&apos;d rather say that plainly than imply a feature that
        isn&apos;t built yet. If you&apos;d like a child&apos;s practice
        history cleared, email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> from the
        parent account&apos;s address and we&apos;ll action it directly.
      </p>

      <h2>Still stuck?</h2>
      <p>
        <Link href="/contact">Contact us</Link> — a specific page and what
        happened is the most useful thing to include.
      </p>
    </LegalPageShell>
  );
}
