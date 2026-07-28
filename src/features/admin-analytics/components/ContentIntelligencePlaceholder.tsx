import Link from "next/link";
import { ArrowRight, FileSearch } from "lucide-react";

import { Card } from "@/components/ui";

/**
 * Teaser for the full Content Intelligence dashboard (/admin/intelligence,
 * see QuestionIntelligenceExplorer) — operations only needs a pointer, not
 * a second copy of that screen.
 */
export function ContentIntelligencePlaceholder() {
  return (
    <Card variant="outlined" className="p-6">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-royal/8 text-royal">
        <FileSearch aria-hidden="true" className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-[15px] font-extrabold text-ink">
        Content intelligence
      </h3>
      <p className="mt-2 text-sm leading-6 text-muted">
        Per-question accuracy, discrimination and coverage gaps live on the
        full Content Intelligence dashboard.
      </p>
      <Link
        href="/admin/intelligence"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-royal hover:underline"
      >
        Open Content Intelligence
        <ArrowRight aria-hidden="true" className="h-3.5 w-3.5" />
      </Link>
    </Card>
  );
}
