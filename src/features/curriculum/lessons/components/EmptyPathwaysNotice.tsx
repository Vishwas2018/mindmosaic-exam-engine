import { BookOpen } from "lucide-react";

/**
 * Shared honest-empty-state notice for the pathway surfaces
 * (`/student/learn` and `/student/learn/[area]`): no year level on file, or
 * a year level with nothing published yet. Never falls back to another
 * year's content.
 */
export function EmptyPathwaysNotice({ message }: { message: string }) {
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border-2 border-dashed border-mm-line bg-white/80 p-8 text-center shadow-sm backdrop-blur-sm sm:p-12">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-mm-tint to-mm-tint-soft text-mm-brand shadow-inner ring-1 ring-mm-brand/15">
        <BookOpen className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="max-w-md text-[15px] leading-relaxed text-mm-muted">{message}</p>
    </div>
  );
}
