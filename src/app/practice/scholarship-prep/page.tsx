import type { Metadata } from "next";

import { AppHeader } from "@/components/shell/AppHeader";
import { getComingSoonProgramme } from "@/features/student/components/programmes/programme-catalog";
import { ProgrammeComingSoon } from "@/features/student/components/programmes/ProgrammeComingSoon";

const programme = getComingSoonProgramme("scholarship-prep")!;

export const metadata: Metadata = {
  title: programme.fullTitle,
  description: programme.about,
};

export default function ScholarshipPrepComingSoonPage() {
  return (
    <div className="min-h-screen overflow-hidden bg-page">
      <AppHeader />
      <main id="main-content" className="site-width py-12 sm:py-16">
        <ProgrammeComingSoon programmeSlug="scholarship-prep" />
      </main>
    </div>
  );
}
