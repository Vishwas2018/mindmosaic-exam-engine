import { School, Sparkles } from "lucide-react";

export function ClassroomPracticeNotice() {
  return (
    <section
      aria-labelledby="classroom-practice-heading"
      className="overflow-hidden rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/80 p-6 shadow-xs sm:p-8"
    >
      <div className="flex items-start gap-4.5">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-600 text-white shadow-xs">
          <School className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-indigo-700">
              Classroom-only skill
            </p>
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
          </div>
          <h2 id="classroom-practice-heading" className="mt-1.5 text-xl font-bold tracking-tight text-mm-ink sm:text-2xl">
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
