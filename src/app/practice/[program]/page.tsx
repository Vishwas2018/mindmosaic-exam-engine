import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { MindMosaicLogo } from "@/components/branding";
import { AuthNav } from "@/features/auth";
import { Badge, Card } from "@/components/ui";
import {
  getProgramBySlug,
  isLiveProgram,
  type Program,
} from "@/features/catalogue/catalogue";
import { ExamConfigurator } from "@/features/exam-engine/components/ExamConfigurator";
import { getBankEligibility } from "@/server/exam-bank";

/**
 * Returns the program only when there is actually something to render for
 * it. A coming_soon program is a real catalogue entry but has no route —
 * from this route's perspective it doesn't exist, same as an unknown slug.
 */
function resolveLiveProgram(slug: string): Program | undefined {
  const program = getProgramBySlug(slug);
  return program && isLiveProgram(program) ? program : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ program: string }>;
}): Promise<Metadata> {
  const { program: slug } = await params;
  const program = resolveLiveProgram(slug);
  if (!program) {
    return { title: "Practice" };
  }
  return {
    title: program.name,
    description: `${program.blurb} No sign-in required.`,
  };
}

export default async function ProgramPracticePage({
  params,
}: {
  params: Promise<{ program: string }>;
}) {
  const { program: slug } = await params;
  const program = resolveLiveProgram(slug);
  if (!program) notFound();

  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <header className="relative z-20 border-b border-royal/8 bg-white/80 backdrop-blur-xl">
        <div className="site-width flex min-h-20 items-center justify-between gap-4 py-3">
          <Link
            href="/"
            aria-label="MindMosaic home"
            className="rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
          >
            <MindMosaicLogo />
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-2 sm:gap-4">
            <AuthNav />
          </nav>
        </div>
      </header>

      <main id="main-content" className="site-width py-12 sm:py-16">
        <Link
          href="/practice"
          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl text-sm font-bold text-royal transition hover:gap-2.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-royal/20"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
          All practice programs
        </Link>

        <div className="mt-5 max-w-2xl">
          {program.scope && (
            <Badge variant="purple" className="mb-4">
              {program.scope.examStyle === "naplan_style" ? "NAPLAN-style" : "ICAS-style"}
            </Badge>
          )}
          <h1 className="text-[clamp(2.25rem,4.5vw,3.25rem)] font-black leading-[1.02] tracking-[-0.045em] text-ink">
            {program.name}
          </h1>
          <p className="mt-4 text-lg leading-8 text-muted">{program.blurb}</p>
        </div>

        <div className="mt-9">
          <Suspense
            fallback={
              <Card className="p-8" variant="default">
                <p className="text-sm font-semibold text-muted">Loading exam setup…</p>
              </Card>
            }
          >
            <ExamConfigurator
              bankEligibility={getBankEligibility()}
              initialScope={program.scope}
              lockScope={program.scope !== undefined}
              initialBankId={program.scope?.initialBankId}
            />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
