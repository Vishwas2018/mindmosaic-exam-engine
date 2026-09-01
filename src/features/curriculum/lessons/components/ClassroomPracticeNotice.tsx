import { School } from "lucide-react";

export function ClassroomPracticeNotice() {
  return (
    <section
      aria-labelledby="classroom-practice-heading"
      className="rounded-2xl border-2 border-mm-brand/20 bg-mm-brand/5 p-6"
    >
      <div className="flex items-start gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-mm-brand shadow-sm">
          <School className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wider text-mm-brand">
            Classroom-only skill
          </p>
          <h2 id="classroom-practice-heading" className="mt-1 text-xl font-bold text-mm-ink">
            Practised in class
          </h2>
          <p className="mt-2 text-[15.5px] leading-relaxed text-mm-ink-soft">
            This lesson explains the key concepts, but the curriculum skill is demonstrated through
            live, physical, or sustained work with a teacher and peers. No online quiz is attached.
          </p>
        </div>
      </div>
    </section>
  );
}
