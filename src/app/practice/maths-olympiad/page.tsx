import type { Metadata } from "next";

import { AppHeader } from "@/components/shell/AppHeader";
import { getComingSoonProgramme } from "@/features/student/components/programmes/programme-catalog";
import { ProgrammeComingSoon } from "@/features/student/components/programmes/ProgrammeComingSoon";

const programme = getComingSoonProgramme("maths-olympiad")!;

export const metadata: Metadata = {
  title: programme.fullTitle,
  description: programme.about,
};

export default function OlympiadComingSoonPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <AppHeader />
      <main id="main-content" className="site-width py-12 sm:py-16">
        <ProgrammeComingSoon programmeSlug="maths-olympiad" />
      </main>
    </div>
  );
}
