import { Reveal } from "./Reveal";
import { respondsToStudent } from "../content";
import { Eyebrow } from "./primitives";

type SkillState = (typeof respondsToStudent.sample.skills)[number]["state"];

/** Each state is named in words; the bar colour only reinforces it. */
const STATE_STYLES: Record<SkillState, { bar: string; chip: string }> = {
  Secure: { bar: "bg-[#0B6B63]", chip: "bg-[#D9EFEC] text-[#0B6B63]" },
  "Getting there": { bar: "bg-mm-brand-mid", chip: "bg-mm-tint text-mm-brand" },
  "Practise next": { bar: "bg-mm-coral", chip: "bg-mm-alert text-mm-coral-deep" },
};

/**
 * "Learning that responds to the student": three outcomes drawn as one
 * connected path (node → line → node), beside a small labelled sample of
 * the skill breakdown a student sees after a test. The copy stays inside
 * what ships — rule-based skill grouping and next-set suggestions — and
 * says so in plain words rather than reaching for "AI".
 */
export function RespondsToStudent() {
  const { sample } = respondsToStudent;

  return (
    <section
      aria-labelledby="responds-heading"
      className="border-y border-mm-line bg-white py-[clamp(64px,8vw,120px)]"
    >
      <div className="mm-width grid gap-[clamp(40px,5vw,80px)] lg:grid-cols-12">
        <div className="flex flex-col gap-8 lg:col-span-6">
          <div>
            <Eyebrow rule className="mb-4">
              {respondsToStudent.eyebrow}
            </Eyebrow>
            <h2
              id="responds-heading"
              className="m-0 text-pretty text-[clamp(28px,3.2vw,44px)] leading-[1.1] tracking-[-0.034em] text-mm-ink"
            >
              {respondsToStudent.heading}
            </h2>
            <p className="m-0 mt-5 max-w-[50ch] text-pretty text-[17px] leading-[1.6] text-mm-ink-soft">
              {respondsToStudent.intro}
            </p>
          </div>

          <ol className="m-0 grid list-none p-0">
            {respondsToStudent.steps.map((step, index) => {
              const last = index === respondsToStudent.steps.length - 1;
              return (
                <li key={step.title} className="relative grid grid-cols-[36px_1fr] gap-x-5 pb-7 last:pb-0">
                  {!last && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-[17.5px] top-[40px] w-px bg-mm-tint-line-strong"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className={`grid h-9 w-9 place-items-center rounded-[10px] text-[13px] font-semibold tabular-nums ${
                      last ? "bg-mm-brand text-white" : "border border-mm-tint-line-strong bg-mm-tint-soft text-mm-brand"
                    }`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="m-0 text-[19px] font-semibold leading-[1.3] tracking-[-0.015em] text-mm-ink">
                      {step.title}
                    </h3>
                    <p className="m-0 mt-1.5 max-w-[48ch] text-[15.5px] leading-[1.6] text-mm-ink-soft">{step.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-col justify-center gap-5 lg:col-span-6">
          <article
            aria-label="Sample skill breakdown after a test"
            className="rounded-[24px] border border-mm-line bg-mm-page p-[clamp(20px,2.6vw,32px)] shadow-[0_24px_48px_-36px_rgba(89,37,168,.35)]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-mm-line-soft pb-4">
              <div>
                <p className="m-0 text-xs font-bold uppercase tracking-[0.12em] text-mm-brand">Skill breakdown</p>
                <p className="m-0 mt-1.5 text-[17px] font-semibold text-mm-ink">{sample.label}</p>
              </div>
              <span className="rounded-md border border-mm-line bg-white px-2 py-[3px] text-xs text-mm-muted">
                {sample.badge}
              </span>
            </div>
            <ul className="m-0 grid list-none gap-5 p-0 pt-5">
              {sample.skills.map((skill, index) => (
                <li key={skill.name} className="grid gap-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[15.5px] font-medium text-mm-ink">{skill.name}</span>
                    <span className={`rounded-md px-2 py-0.5 text-[12.5px] font-semibold ${STATE_STYLES[skill.state].chip}`}>
                      {skill.state}
                    </span>
                  </div>
                  <div aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-[#E2DFD8]">
                    <Reveal kind="fill" delayMs={index * 90} className="h-full">
                      <span
                        className={`block h-full rounded-full ${STATE_STYLES[skill.state].bar}`}
                        style={{ width: `${skill.value}%` }}
                      />
                    </Reveal>
                  </div>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-6 rounded-2xl bg-mm-tint p-4 text-[15px] leading-[1.5] text-mm-ink-soft">
              <strong className="font-semibold text-mm-ink">Next set:</strong> {sample.nextSet}
            </p>
          </article>
          <p className="m-0 max-w-[56ch] text-[14.5px] leading-[1.55] text-mm-muted">{respondsToStudent.note}</p>
        </div>
      </div>
    </section>
  );
}
