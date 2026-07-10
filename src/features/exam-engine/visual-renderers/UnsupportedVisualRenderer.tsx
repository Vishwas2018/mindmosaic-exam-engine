import type { VisualRendererProps } from "@/features/exam-engine/types";
import { cn } from "@/lib/cn";
import { humaniseIdentifier } from "@/lib/utils";

export function UnsupportedVisualRenderer({
  visual,
  className,
}: VisualRendererProps) {
  return (
    <section
      role="status"
      aria-label={visual.altText}
      className={cn(
        "rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-700",
        className,
      )}
    >
      <p className="font-semibold">Visual renderer coming soon</p>
      <p className="mt-1 text-sm">
        {humaniseIdentifier(visual.type)} visuals will be rendered in the next
        phase. Description: {visual.altText}
      </p>
    </section>
  );
}
