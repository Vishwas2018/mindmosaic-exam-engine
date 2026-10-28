import type {Metadata} from "next";
import Link from "next/link";

import {getComingSoonProgramme} from "@/features/student/components/programmes/programme-catalog";
import {ProgrammeComingSoon} from "@/features/student/components/programmes/ProgrammeComingSoon";
import {isSingaporeMathsSampleAllowed} from "@/features/flags/singapore-maths-sample";
import {samplePracticeFixtures} from "@/content/visual-fixtures/bar-model/sample-practice.server";
import {SampleSession} from "./SampleSession";

const programme = getComingSoonProgramme("singapore-maths")!;

export const metadata: Metadata = {
  title: programme.fullTitle,
  description: programme.about,
};

export default async function SingaporeMathsSamplePage({
  searchParams,
}: {
  searchParams: Promise<{year?: string}>;
}) {
  const params = await searchParams;
  const year: 3 | 5 | undefined =
    params.year === "3" ? 3 : params.year === "5" ? 5 : undefined;

  if (!isSingaporeMathsSampleAllowed()) {
    return (
      <div className="min-h-screen overflow-hidden bg-page">
        <ProgrammeComingSoon programme={programme} />
      </div>
    );
  }

  if (!year) {
    return (
      <main className="mm-root mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-sm font-medium text-royal">
          Singapore Maths · sample practice
        </p>
        <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
          Try a sample session
        </h1>
        <p className="mt-2 text-muted">
          Choose a year level to try 15 sample bar-model questions. Answers
          are checked server-side — nothing is revealed until you submit.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/practice/singapore-maths/sample?year=3"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-royal bg-white text-royal px-6 py-3 font-semibold shadow-sm hover:bg-royal/5 transition-colors"
          >
            Year 3
          </Link>
          <Link
            href="/practice/singapore-maths/sample?year=5"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-royal bg-white text-royal px-6 py-3 font-semibold shadow-sm hover:bg-royal/5 transition-colors"
          >
            Year 5
          </Link>
        </div>
      </main>
    );
  }

  const fixtures = samplePracticeFixtures(year);

  return (
    <main className="mm-root mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium text-royal">
        Singapore Maths · sample practice · Year {year}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
        Year {year} sample session
      </h1>
      <p className="mt-2 text-muted">
        {fixtures.length} sample questions. Submit each answer to check it
        server-side; worked explanations are released only after a correct
        submission.
      </p>
      <SampleSession year={year} fixtures={fixtures} />
    </main>
  );
}
