import Link from "next/link";
import { clsx } from "clsx";

import { SUPPORT_EMAIL, about } from "../content";
import { EmptySlot, Eyebrow, MmCard, Section, mmButton } from "./primitives";

/**
 * About — design handoff screen 5.
 *
 * Server component throughout: the design has no interactive state on this
 * screen once its contact form is replaced by a link to the real /contact
 * page (see the note in ../content.ts's `about.contact`).
 */
export function AboutScreen() {
  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="bg-mm-page pb-[clamp(28px,3vw,40px)] pt-[clamp(36px,3.5vw,56px)]">
        <div className="mm-width grid items-center gap-[clamp(24px,3vw,48px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          <div className="max-w-[620px]">
            <Eyebrow rule className="mb-[18px]">
              {about.eyebrow}
            </Eyebrow>
            <h1 className="text-[clamp(34px,4.2vw,56px)] font-bold leading-[1.06] tracking-[-0.04em] text-mm-ink">
              {about.heading}
            </h1>
            <p className="mt-[18px] text-pretty text-lg leading-[1.6] text-mm-muted">
              {about.intro}
            </p>
          </div>
          <div className="relative h-[clamp(280px,28vw,380px)] w-full overflow-hidden rounded-[18px] border border-mm-line bg-mm-tint">
            <EmptySlot label={about.heroSlot} />
          </div>
        </div>
      </section>

      {/* ---------- Why we built it + principles ---------- */}
      <Section tone="white" labelledBy="about-why-heading">
        <div className="grid items-start gap-[clamp(24px,3vw,56px)] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div>
            <h2
              id="about-why-heading"
              className="text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
            >
              {about.why.heading}
            </h2>
            {about.why.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph.slice(0, 32)}
                className={clsx(
                  "text-[16.5px] leading-[1.65]",
                  index === 0 ? "mt-4 text-mm-ink-soft" : "mt-3.5 text-mm-muted",
                )}
              >
                {paragraph}
              </p>
            ))}
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {about.principles.map((principle, index) => {
              /* The design inverts every third tile (index 1, 4) to solid
                 brand purple. */
              const inverted = index % 3 === 1;
              return (
                <li
                  key={principle.title}
                  className={clsx(
                    "rounded-[14px] border p-5",
                    inverted
                      ? "border-mm-brand bg-mm-brand text-white"
                      : "border-mm-line bg-mm-page text-mm-ink",
                  )}
                >
                  <p
                    className={clsx(
                      "font-mono text-[11px] uppercase tracking-[0.06em]",
                      inverted ? "text-white/70" : "text-mm-muted",
                    )}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2.5 text-[17.5px] font-bold">{principle.title}</h3>
                  <p
                    className={clsx(
                      "mt-2 text-[14.5px] leading-[1.55]",
                      inverted ? "text-white/88" : "text-mm-muted",
                    )}
                  >
                    {principle.body}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      {/* ---------- Content pipeline ---------- */}
      <Section tone="tint" labelledBy="about-pipeline-heading">
        <h2
          id="about-pipeline-heading"
          className="max-w-[620px] text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
        >
          {about.pipeline.heading}
        </h2>
        <p className="mt-3 max-w-[680px] text-[16.5px] leading-[1.6] text-mm-muted">
          {about.pipeline.intro}
        </p>
        <ol className="mt-[clamp(22px,2.2vw,30px)] grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {about.pipeline.steps.map((step, index) => (
            <li
              key={step.title}
              className="grid content-start gap-2 rounded-[14px] border border-mm-tint-line-strong bg-white p-5"
            >
              <p className="font-[family-name:var(--font-display)] text-[15px] font-extrabold text-mm-brand">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-[16.5px] font-bold text-mm-ink">{step.title}</h3>
              <p className="text-sm leading-[1.55] text-mm-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* ---------- Privacy + contact ---------- */}
      <Section labelledBy="about-privacy-heading">
        <div className="grid items-start gap-[clamp(24px,3vw,56px)] lg:grid-cols-2">
          <div>
            <h2
              id="about-privacy-heading"
              className="text-[clamp(26px,3vw,40px)] font-bold leading-[1.12] text-mm-ink"
            >
              {about.privacy.heading}
            </h2>
            <p className="mt-3.5 text-[16.5px] leading-[1.6] text-mm-muted">
              {about.privacy.lead}
            </p>
            <p className="mt-3.5 text-[15.5px] leading-[1.6] text-mm-muted">
              Storage, retention and deletion are set out in full in the{" "}
              <Link href="/privacy" className="font-bold text-mm-brand hover:underline">
                Privacy Policy
              </Link>
              . Platform terms are in the{" "}
              <Link href="/terms" className="font-bold text-mm-brand hover:underline">
                Terms and Conditions
              </Link>
              , and the scope of assessment-style material is described in the{" "}
              <Link
                href="/assessment-disclaimer"
                className="font-bold text-mm-brand hover:underline"
              >
                Assessment Disclaimer
              </Link>
              .
            </p>
            <ul className="mt-5 grid gap-2.5">
              {about.privacy.points.map((point) => (
                <li
                  key={point}
                  className="grid grid-cols-[18px_1fr] gap-2.5 text-[15px] leading-[1.55] text-mm-ink-soft"
                >
                  <span aria-hidden="true" className="mt-1.5 h-2 w-2 bg-mm-brand" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <MmCard id="contact" className="rounded-[20px] p-[clamp(24px,2.4vw,32px)]">
            <h2 className="text-2xl font-bold text-mm-ink">{about.contact.heading}</h2>
            <p className="mt-2.5 text-[15px] leading-[1.6] text-mm-muted">
              {about.contact.intro}
            </p>
            <Link href={about.contact.cta.href} className={mmButton({ className: "mt-5 w-fit" })}>
              {about.contact.cta.label}
            </Link>
            <p className="mt-4 text-[14px] leading-[1.6] text-mm-muted">
              {about.contact.emailLead}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-bold text-mm-brand hover:underline"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          </MmCard>
        </div>
      </Section>

      {/* ---------- Closing ---------- */}
      <Section tone="white" labelledBy="about-closing-heading">
        <div className="flex flex-wrap items-center justify-between gap-[clamp(24px,3vw,48px)]">
          <div className="max-w-[620px]">
            <h2
              id="about-closing-heading"
              className="text-[clamp(26px,3.2vw,42px)] font-bold leading-[1.1] text-mm-ink"
            >
              {about.closing.heading}
            </h2>
            <p className="mt-3.5 text-[16.5px] leading-[1.6] text-mm-muted">
              {about.closing.body}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={about.closing.primaryCta.href} className={mmButton({ size: "lg" })}>
              {about.closing.primaryCta.label}
            </Link>
            <Link
              href={about.closing.secondaryCta.href}
              className={mmButton({ variant: "outline", size: "lg" })}
            >
              {about.closing.secondaryCta.label}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
