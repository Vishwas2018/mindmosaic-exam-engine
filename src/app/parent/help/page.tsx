import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, HelpCircle, Mail } from "lucide-react";

import { ParentShell } from "@/features/parent-dashboard";

export const metadata: Metadata = {
  title: "Parent Help Centre | MindMosaic",
  description: "Help guides, scoring explanations, and support for MindMosaic parents.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function ParentHelpPage() {
  return (
    <ParentShell active="/parent/account">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-[-0.025em] text-ink sm:text-3xl">
            Help Centre
          </h1>
          <p className="mt-1 text-sm text-muted">
            Guidance on reading your child&apos;s progress, practice structures, and account support.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Parent Guide Card */}
          <section className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <BookOpen className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-ink">Comprehensive Parent Guide</h2>
              <p className="mt-1 text-xs text-muted">
                Learn how practice sessions are assembled, how instant objective scoring works,
                and how to interpret your child&apos;s marks without misleading percentage averages.
              </p>
            </div>
            <div className="mt-6">
              <Link
                href="/parent-guide"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-royal px-4 text-xs font-extrabold text-white shadow-sm transition hover:bg-royal/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/30"
              >
                Read Parent Guide &rarr;
              </Link>
            </div>
          </section>

          {/* Contact Support */}
          <section className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div
                aria-hidden="true"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/8 text-royal"
              >
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="mt-4 text-base font-extrabold text-ink">Direct Support</h2>
              <p className="mt-1 text-xs text-muted">
                Have a question about your account, a practice item, or need help with child access?
                Our education support team is available via email.
              </p>
            </div>
            <div className="mt-6">
              <a
                href="mailto:hello@mindmosaic.app"
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-royal/15 bg-white px-4 text-xs font-extrabold text-ink transition hover:bg-royal/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
              >
                Contact hello@mindmosaic.app
              </a>
            </div>
          </section>
        </div>

        {/* Common Topics Notice */}
        <div className="rounded-2xl border border-royal/10 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-royal" aria-hidden="true" />
            <h2 className="text-base font-extrabold text-ink">Frequently Consulted Topics</h2>
          </div>
          <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl border border-royal/8 bg-royal/5 p-4">
              <h3 className="font-extrabold text-ink">How are questions scored?</h3>
              <p className="mt-1 text-xs text-muted">
                Objective questions are marked automatically upon submission with worked explanations.
                No percentage bands are applied from single attempts.
              </p>
            </div>
            <div className="rounded-xl border border-royal/8 bg-royal/5 p-4">
              <h3 className="font-extrabold text-ink">How does a child sign in?</h3>
              <p className="mt-1 text-xs text-muted">
                Children sign in using their unique 8-character student code (XXXX-XXXX) and 6-digit PIN
                shown in the Children tab.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ParentShell>
  );
}
