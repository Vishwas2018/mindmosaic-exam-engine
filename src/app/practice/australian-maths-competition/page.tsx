import type { Metadata } from "next";
import Link from "next/link";

import { AppHeader } from "@/components/shell/AppHeader";
import { getComingSoonProgramme } from "@/features/student/components/programmes/programme-catalog";
import { ProgrammeComingSoon } from "@/features/student/components/programmes/ProgrammeComingSoon";

const programme = getComingSoonProgramme("australian-maths-competition")!;

export const metadata: Metadata = {
  title: programme.fullTitle,
  description: programme.about,
};

export default function AmcComingSoonPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <AppHeader />
      <main id="main-content" className="site-width py-12 sm:py-16">
        <p className="mb-8 rounded-2xl border border-mm-line bg-white p-5 text-ink">
          AMC-style practice papers for Year 3 and Year 5 are now open as shorter practice modules while more reviewed
          questions are added.{" "}
          <Link className="font-bold text-royal underline" href="/exams">
            See the AMC-style papers
          </Link>
          . Original practice, not official AMC questions.
        </p>
        <ProgrammeComingSoon programmeSlug="australian-maths-competition" />
      </main>
    </div>
  );
}
