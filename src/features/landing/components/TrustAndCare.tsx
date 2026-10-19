import Link from "next/link";
import { ArrowRight, Compass, Eye, ShieldCheck, type LucideIcon } from "lucide-react";

import { trustAndCare } from "../content";
import { Eyebrow } from "./primitives";

type CareId = (typeof trustAndCare.care.points)[number]["id"];

const CARE_ICONS: Record<CareId, LucideIcon> = {
  privacy: ShieldCheck,
  accessibility: Eye,
  responsible: Compass,
};

/**
 * The quiet trust section after the dark quality band: qualitative
 * evidence (no invented numbers), an optional testimonial row that renders
 * only once real testimonials exist in content, and the privacy /
 * accessibility / responsible-technology commitments with links to the
 * real policy pages.
 */
export function TrustAndCare() {
  const { evidence, care, testimonials } = trustAndCare;

  return (
    <section aria-labelledby="evidence-heading" className="bg-mm-page py-[clamp(64px,8vw,120px)]">
      <div className="mm-width">
        <div className="grid gap-[clamp(28px,4vw,64px)] xl:grid-cols-12">
          <div className="xl:col-span-5">
            <Eyebrow rule className="mb-4">
              {evidence.eyebrow}
            </Eyebrow>
            <h2
              id="evidence-heading"
              className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.034em] text-mm-ink"
            >
              {evidence.heading}
            </h2>
            <p className="m-0 mt-5 max-w-[44ch] text-[17px] leading-[1.6] text-mm-ink-soft">{evidence.intro}</p>
          </div>

          <dl className="m-0 grid gap-x-8 gap-y-6 sm:grid-cols-3 xl:col-span-7 xl:self-end">
            {evidence.points.map((point) => (
              <div key={point.title} className="grid content-start gap-2 border-t-2 border-mm-brand pt-5">
                <dt className="text-[18px] font-semibold tracking-[-0.015em] text-mm-ink">{point.title}</dt>
                <dd className="m-0 text-[15.5px] leading-[1.6] text-mm-ink-soft">{point.body}</dd>
              </div>
            ))}
          </dl>
        </div>

        {testimonials.length > 0 && (
          <ul className="m-0 mt-[clamp(40px,5vw,72px)] grid list-none gap-6 p-0 md:grid-cols-2">
            {testimonials.map((t) => (
              <li key={t.name}>
                <figure className="m-0 rounded-[24px] border border-mm-line bg-white p-7">
                  <blockquote className="m-0 text-[17px] leading-[1.6] text-mm-ink">{t.quote}</blockquote>
                  <figcaption className="mt-4 text-[14.5px] text-mm-muted">
                    {t.name} · {t.role}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-[clamp(56px,7vw,104px)] rounded-[clamp(20px,2vw,28px)] border border-mm-line bg-white p-[clamp(24px,3.4vw,48px)]">
          <h2
            id="care-heading"
            className="m-0 max-w-[24ch] text-balance text-[clamp(26px,2.6vw,36px)] leading-[1.12] tracking-[-0.03em] text-mm-ink"
          >
            {care.heading}
          </h2>
          <ul className="m-0 mt-[clamp(24px,3vw,40px)] grid list-none gap-8 p-0 md:grid-cols-3 md:gap-[clamp(24px,3vw,48px)]">
            {care.points.map((point) => {
              const Icon = CARE_ICONS[point.id];
              return (
                <li key={point.id} className="flex flex-col gap-3">
                  <span
                    aria-hidden="true"
                    className="grid h-11 w-11 place-items-center rounded-xl bg-mm-tint text-mm-brand"
                  >
                    <Icon className="h-[21px] w-[21px]" strokeWidth={1.75} />
                  </span>
                  <h3 className="m-0 text-[18px] font-semibold tracking-[-0.015em] text-mm-ink">{point.title}</h3>
                  <p className="m-0 text-[15.5px] leading-[1.6] text-mm-ink-soft">{point.body}</p>
                  <Link
                    href={point.link.href}
                    className="group mt-auto inline-flex min-h-11 w-fit items-center gap-1.5 text-[15px] font-semibold text-mm-brand transition-colors hover:text-mm-brand-deep focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mm-brand/30 rounded-md"
                  >
                    {point.link.label}
                    <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="m-0 mt-8 border-t border-mm-line-soft pt-5 text-[14px] leading-[1.6] text-mm-muted">
            MindMosaic is independent and its assessment-style materials are not official papers.{" "}
            <Link href={evidence.disclaimer.href} className="font-semibold text-mm-brand underline underline-offset-[3px] hover:text-mm-brand-deep">
              {evidence.disclaimer.label}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
