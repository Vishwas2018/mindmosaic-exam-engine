import { howItWorks } from "../content";
import { SectionHeading } from "./primitives";

/**
 * Three connected stages, each with a small illustrative panel showing
 * what that stage actually looks like in the product. The panels are
 * static HTML, not screenshots, so they stay legible at any width and can
 * be read by a screen reader.
 */
export function HowItWorks() {
  return (
    <section
      id="how"
      aria-labelledby="how-heading"
      className="border-y border-mm-line bg-white py-[clamp(40px,4vw,64px)]"
    >
      <div className="mm-width">
        <SectionHeading
          id="how-heading"
          eyebrow={howItWorks.eyebrow}
          title={howItWorks.heading}
          intro={howItWorks.intro}
          className="mb-[clamp(22px,2.2vw,30px)]"
        />

        <ol className="grid gap-[clamp(18px,2vw,28px)] lg:grid-cols-3">
          {howItWorks.steps.map((step) => (
            <li
              key={step.number}
              className={`grid content-start gap-[18px] rounded-[18px] border p-[clamp(22px,2.2vw,30px)] ${
                step.demo.kind === "exam"
                  ? "border-mm-tint-line bg-mm-tint-soft"
                  : "border-mm-line bg-mm-page"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-lg bg-mm-brand font-display text-[15px] font-extrabold text-white">
                  {step.number}
                </span>
                <span
                  aria-hidden="true"
                  className="h-px flex-1 bg-[repeating-linear-gradient(90deg,var(--mm-lilac)_0_7px,transparent_7px_13px)]"
                />
              </div>

              <h3 className="text-[22px] font-bold leading-[1.2] tracking-[-0.025em] text-mm-ink">
                {step.title}
              </h3>
              <p className="text-[15.5px] leading-[1.6] text-mm-muted">{step.body}</p>

              {step.demo.kind === "lesson" && (
                <div className="grid gap-2 rounded-xl border border-mm-line bg-white p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-mm-muted">
                    {step.demo.eyebrow}
                  </p>
                  <p className="text-sm font-bold text-mm-ink">{step.demo.title}</p>
                  <p className="text-[13.5px] leading-[1.5] text-mm-muted">{step.demo.body}</p>
                </div>
              )}

              {step.demo.kind === "feedback" && (
                <div className="grid gap-2.5 rounded-xl border border-mm-line bg-white p-3.5">
                  <div className="flex items-center gap-2.5">
                    <span aria-hidden="true" className="h-[18px] w-[18px] rounded bg-mm-coral" />
                    <span className="text-[13.5px] font-bold text-mm-ink">{step.demo.title}</span>
                  </div>
                  <p className="text-[13.5px] leading-[1.55] text-mm-ink-soft">
                    The line is divided into eighths, so each step is 1/8. Five steps from zero gives{" "}
                    <strong>5/8</strong>.
                  </p>
                </div>
              )}

              {step.demo.kind === "exam" && (
                <div className="grid gap-2.5 rounded-xl border border-mm-tint-line bg-white p-3.5">
                  <div className="flex justify-between text-[13px] font-bold text-mm-ink">
                    <span>{step.demo.section}</span>
                    <span className="text-mm-brand">{step.demo.remaining}</span>
                  </div>
                  <div
                    role="img"
                    aria-label={`Progress: ${step.demo.answered} of ${step.demo.total} questions answered, ${step.demo.flagged} flagged for review`}
                    className="h-2 overflow-hidden rounded bg-mm-track"
                  >
                    <span
                      className="block h-full bg-mm-brand"
                      style={{ width: `${Math.round((step.demo.answered / step.demo.total) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[13px] text-mm-muted">
                    {step.demo.answered} of {step.demo.total} answered · {step.demo.flagged} flagged for review ·
                    progress saved automatically
                  </p>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
