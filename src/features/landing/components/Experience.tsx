import { Check, Flag, X } from "lucide-react";

import { experience, progressSection } from "../content";
import { LpCard, SectionHeading, TileMeter } from "./primitives";

/** Compact Grade 3 bar-chart question — a second, different question world. */
function ChartQuestionMockup() {
  const bars = [
    { label: "Mon", value: 40 },
    { label: "Tue", value: 70 },
    { label: "Wed", value: 55 },
    { label: "Thu", value: 90 },
  ];
  return (
    <LpCard className="p-5 sm:p-6">
      <div className="flex items-center justify-between border-b border-brand/8 pb-3">
        <span className="inline-flex items-center rounded-full bg-brand/8 px-3 py-1.5 text-xs font-bold text-brand">
          Grade 3 · Numeracy
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-lp-muted">
          <Flag aria-hidden="true" className="h-3.5 w-3.5" />
          Question 4 of 16
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-lp-ink">
        The chart shows books read by Class 3B. On which day were the{" "}
        <strong>most</strong> books read?
      </p>
      <div aria-hidden="true" className="mt-4 flex h-28 items-end gap-4 px-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={`w-full rounded-t-lg ${bar.value === 90 ? "bg-accent" : "bg-brand/70"}`}
              style={{ height: `${bar.value}%` }}
            />
            <span className="text-[0.7rem] font-bold text-lp-muted">{bar.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {["Monday", "Tuesday", "Wednesday", "Thursday"].map((option) => (
          <span
            key={option}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl border px-3 text-sm font-bold ${
              option === "Thursday"
                ? "border-brand bg-brand text-white"
                : "border-brand/15 bg-white text-lp-ink"
            }`}
          >
            {option}
          </span>
        ))}
      </div>
    </LpCard>
  );
}

export function Experience() {
  return (
    <section
      aria-labelledby="experience-heading"
      className="site-width scroll-mt-24 py-16 sm:py-24"
    >
      <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
        <ChartQuestionMockup />
        <div>
          <SectionHeading
            id="experience-heading"
            eyebrow="The practice experience"
            title={experience.heading}
            intro={experience.intro}
          />
          <dl className="mt-8 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {experience.points.map((point) => (
              <div key={point.title}>
                <dt className="font-display text-base font-bold tracking-[-0.01em] text-lp-ink">
                  {point.title}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-lp-muted">
                  {point.body}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

/** Post-session report mockup: score, skills as tile meters, history. */
function ReportMockup() {
  const skills = [
    { name: "Interpreting bar charts", value: 0.9, tone: "success" as const },
    { name: "Multiplication facts", value: 0.8, tone: "brand" as const },
    { name: "Fractions of a quantity", value: 0.4, tone: "accent" as const },
    { name: "Two-step word problems", value: 0.5, tone: "accent" as const },
  ];
  return (
    <LpCard className="p-5 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-lp-muted">
            Session result · Grade 5 Numeracy · Timed
          </p>
          <p className="mt-2 font-display text-4xl font-bold tracking-[-0.03em] text-lp-ink">
            17<span className="text-lp-muted">/24</span>
          </p>
        </div>
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-extrabold text-success">
            <Check aria-hidden="true" className="h-3.5 w-3.5" />
            Strength: charts
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-extrabold text-accent-strong">
            <X aria-hidden="true" className="h-3.5 w-3.5" />
            Revisit: fractions
          </span>
        </div>
      </div>

      <ul className="mt-6 space-y-4">
        {skills.map((skill) => (
          <li key={skill.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold text-lp-ink">{skill.name}</span>
              <span className="text-xs font-bold tabular-nums text-lp-muted">
                {Math.round(skill.value * 10)}/10
              </span>
            </div>
            <TileMeter
              label={skill.name}
              value={skill.value}
              tone={skill.tone}
              className="mt-1.5"
            />
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-2xl bg-paper p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-lp-muted">
          Recent sessions
        </p>
        <ul className="mt-2 space-y-1.5 text-sm">
          {[
            ["Tue 14 Jul", "Reading · untimed", "19/25"],
            ["Sat 11 Jul", "Numeracy · timed", "17/24"],
            ["Wed 8 Jul", "Conventions · untimed", "21/28"],
          ].map(([date, detail, score]) => (
            <li key={date} className="flex items-center justify-between gap-3">
              <span className="font-semibold text-lp-ink">{date}</span>
              <span className="flex-1 truncate text-lp-muted">{detail}</span>
              <span className="font-bold tabular-nums text-brand">{score}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 rounded-2xl border border-brand/15 bg-brand/5 px-4 py-3 text-sm font-semibold text-brand-ink">
        Suggested next session: <span className="text-brand">Fractions of a quantity</span> — untimed, ~15 minutes
      </p>
    </LpCard>
  );
}

export function Progress() {
  return (
    <section
      id="progress"
      aria-labelledby="progress-heading"
      className="scroll-mt-24 border-y border-brand/10 bg-white py-16 sm:py-24"
    >
      <div className="site-width grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <SectionHeading
            id="progress-heading"
            eyebrow="Progress & reporting"
            title={progressSection.heading}
            intro={progressSection.intro}
          />
          <ul className="mt-8 space-y-3">
            {progressSection.parentSees.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm leading-6 text-lp-ink"
              >
                <span
                  aria-hidden="true"
                  className="mt-[7px] h-2 w-2 shrink-0 rounded-[3px] bg-brand"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <ReportMockup />
      </div>
    </section>
  );
}
