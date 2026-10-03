import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/features/landing/components/Closing";
import { mmButton } from "@/features/landing/components/primitives";
import { SiteNav } from "@/features/landing/components/SiteNav";
import { routes } from "@/features/landing/content";
import { getProgrammeAvailability } from "@/features/landing/programme-status";

import { ProgramYearToggle } from "./components/ProgramYearToggle";

const FAMILIES = {
  "naplan-style": {
    short: "NAPLAN-style",
    name: "NAPLAN-style",
    intro:
      "Original practice in the NAPLAN test areas, as practice sets with worked explanations and as timed papers.",
    disclaimer:
      "NAPLAN is a registered trade mark of ACARA. MindMosaic is not affiliated with or endorsed by ACARA. Questions are original and are not official tests or past papers.",
    subjectsOf: (year: 3 | 5) => getProgrammeAvailability().find((y) => y.year === year)!.naplan,
  },
  "icas-style": {
    short: "ICAS-style",
    name: "ICAS-style",
    intro:
      "Challenge-oriented reasoning questions in the ICAS formats, for students who enjoy a stretch.",
    disclaimer:
      "ICAS is a registered trade mark of Janison Solutions. MindMosaic is not affiliated with or endorsed by Janison. Questions are original and are not official tests or past papers.",
    subjectsOf: (year: 3 | 5) => getProgrammeAvailability().find((y) => y.year === year)!.icas,
  },
} as const;

type FamilySlug = keyof typeof FAMILIES;

function familyFor(slug: string) {
  return Object.prototype.hasOwnProperty.call(FAMILIES, slug) ? FAMILIES[slug as FamilySlug] : undefined;
}

export function generateStaticParams() {
  return Object.keys(FAMILIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const family = familyFor(slug);
  if (!family) return {};
  return { title: family.name, description: family.intro };
}

/** Public/Program Detail.dc.html. Subject status is computed, not copied from the mockup's placeholder data. */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const family = familyFor(slug);
  if (!family) notFound();

  const years = ([3, 5] as const).map((year) => ({ year, subjects: family.subjectsOf(year) }));

  return (
    <div className="lp-root min-h-screen">
      <SiteNav />
      <main id="main-content" className="mm-width grid gap-12 py-[clamp(32px,5vw,64px)]">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
          <div className="flex min-w-0 flex-col gap-[18px]">
            <nav aria-label="Breadcrumb" className="flex flex-wrap gap-2 text-sm text-mm-ink-soft">
              <Link href="/" className="text-mm-ink-soft hover:text-mm-brand">
                Home
              </Link>
              <span aria-hidden="true">/</span>
              <Link href={routes.programs} className="text-mm-ink-soft hover:text-mm-brand">
                Programs
              </Link>
              <span aria-hidden="true">/</span>
              <span aria-current="page">{family.short}</span>
            </nav>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-[#D9EFEC] px-2.5 py-1 text-[13px] font-semibold text-[#0B6B63]">
              Available for Years 3 and 5
            </span>
            <h1 className="text-[clamp(38px,4.6vw,68px)] font-bold leading-[1.02] tracking-[-0.04em] text-mm-ink">
              {family.name}
            </h1>
            <p className="max-w-[600px] text-pretty text-lg leading-[1.6] text-mm-muted">{family.intro}</p>
          </div>
          <aside
            aria-label="Get started"
            className="flex flex-col gap-3.5 rounded-[24px] border border-mm-line bg-white p-[clamp(20px,2.6vw,32px)]"
          >
            <h2 className="text-[19px] font-semibold text-mm-ink">Start practising</h2>
            <p className="text-[15.5px] leading-[1.55] text-mm-ink-soft">
              Create a parent account and add your child to save their results. You can also try a
              set as a guest.
            </p>
            <Link href={routes.startFree} className={mmButton({ size: "lg" })}>
              Start free
            </Link>
            <Link href={routes.guestPractice} className={mmButton({ variant: "outline", size: "lg" })}>
              Try a set as a guest
            </Link>
            <p className="text-[13.5px] leading-[1.5] text-mm-quiet">
              Guest practice isn&apos;t saved once you close the tab.
            </p>
          </aside>
        </div>

        <section aria-labelledby="sub-h" className="grid gap-4">
          <h2 id="sub-h" className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
            Subjects
          </h2>
          <ProgramYearToggle years={years} />
        </section>

        <section aria-labelledby="modes-h" className="grid gap-4">
          <h2 id="modes-h" className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
            Two ways to use it
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] gap-4">
            <article className="grid gap-2.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
              <h3 className="text-[19px] font-semibold text-mm-ink">Practice sets</h3>
              <p className="text-[15.5px] leading-[1.55] text-mm-ink-soft">
                One question at a time. After each answer the student sees whether it was right
                and a worked explanation. A summary at the end lists what to revisit.
              </p>
            </article>
            <article className="grid gap-2.5 rounded-[20px] border border-mm-line bg-white p-[clamp(20px,2.4vw,28px)]">
              <h3 className="text-[19px] font-semibold text-mm-ink">Timed papers</h3>
              <p className="text-[15.5px] leading-[1.55] text-mm-ink-soft">
                Sat like a paper in a quiet layout. Flag questions, move around with the question
                map and review before submitting. Answers and explanations come after.
              </p>
            </article>
          </div>
        </section>

        <section
          aria-labelledby="acc-h"
          className="grid gap-6 rounded-[24px] bg-mm-tint p-[clamp(24px,3vw,40px)] lg:grid-cols-2 lg:gap-16"
        >
          <h2 id="acc-h" className="text-[clamp(26px,2.6vw,36px)] font-bold tracking-[-0.03em] text-mm-ink">
            What you need
          </h2>
          <dl className="m-0 grid gap-[18px]">
            <div className="grid gap-1">
              <dt className="text-base font-semibold text-mm-ink">As a guest</dt>
              <dd className="m-0 text-[15.5px] leading-[1.55] text-mm-ink-soft">
                Nothing. Practice sets and papers open straight away, but results aren&apos;t kept.
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-base font-semibold text-mm-ink">To save progress</dt>
              <dd className="m-0 text-[15.5px] leading-[1.55] text-mm-ink-soft">
                A parent account. You add each child with their first name and year level, and
                they sign in with a login code and a 6-digit PIN.
              </dd>
            </div>
            <div className="grid gap-1">
              <dt className="text-base font-semibold text-mm-ink">Devices</dt>
              <dd className="m-0 text-[15.5px] leading-[1.55] text-mm-ink-soft">
                A tablet or computer with a current browser and an internet connection.
              </dd>
            </div>
          </dl>
        </section>

        <p className="max-w-[880px] text-[13.5px] leading-[1.6] text-mm-muted">{family.disclaimer}</p>
      </main>
      <SiteFooter />
    </div>
  );
}
