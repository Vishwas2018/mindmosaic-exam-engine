import type { SubjectMastery } from "@/features/student/attempt-summary";

const MATHS_SUBJECTS = new Set(["numeracy"]);
const ENGLISH_SUBJECTS = new Set(["reading", "writing", "language_conventions", "spelling"]);

function MasteryBar({ subject }: { subject: SubjectMastery }) {
  return (
    <div className="grid gap-1.5">
      <div className="flex justify-between text-sm">
        <span className="font-semibold text-mm-ink">{subject.label}</span>
        <span className="text-mm-muted">{subject.percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-mm-line-soft">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${subject.percent}%` }}
        />
      </div>
    </div>
  );
}

function MasteryColumn({ title, subjects }: { title: string; subjects: readonly SubjectMastery[] }) {
  if (subjects.length === 0) return null;
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-mm-line bg-white p-6 shadow-warm-sm">
      <h3 className="font-[family-name:var(--font-display)] text-base font-bold text-mm-ink">{title}</h3>
      <div className="grid gap-4">
        {subjects.map((subject) => (
          <MasteryBar key={subject.subject} subject={subject} />
        ))}
      </div>
    </div>
  );
}

/**
 * "Mathematics/English Strands Progression" from the Stitch mock, real:
 * the mock's fine-grained strand names (Number & Place Value, Fractions &
 * Decimals, Geometry & Measurement...) don't exist as a tracked dimension
 * in this codebase — only per-subject mastery does (the same
 * `overview.mastery` the dashboard and Exam Centre already show). This
 * groups those real subjects into Mathematics/English columns instead of
 * inventing strand-level numbers.
 */
export function MyProgressMasteryBoard({ mastery }: { mastery: readonly SubjectMastery[] }) {
  const maths = mastery.filter((m) => MATHS_SUBJECTS.has(m.subject));
  const english = mastery.filter((m) => ENGLISH_SUBJECTS.has(m.subject));
  const other = mastery.filter((m) => !MATHS_SUBJECTS.has(m.subject) && !ENGLISH_SUBJECTS.has(m.subject));

  if (mastery.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-mm-line bg-white px-6 py-10 text-center">
        <p className="text-sm text-mm-muted">
          Nothing measured yet. Mastery fills in from objective marks across every finished
          session.
        </p>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <MasteryColumn title="Mathematics" subjects={maths} />
      <MasteryColumn title="English" subjects={english} />
      <MasteryColumn title="Other subjects" subjects={other} />
    </section>
  );
}
