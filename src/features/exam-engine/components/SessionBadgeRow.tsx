import { Award } from "lucide-react";

import { cn } from "@/lib/cn";

import type { SessionBadge, SessionBadgeTone } from "../scoring/session-badges";

const TONE_CLASSES: Record<SessionBadgeTone, string> = {
  gold: "border-royal-orange/20 bg-royal-orange/10 text-warning",
  purple: "border-royal/15 bg-royal/8 text-royal",
  green: "border-success/15 bg-success/10 text-success",
};

/** Display-only badge chips for the results page (screen 14, v1). */
export function SessionBadgeRow({ badges }: { badges: readonly SessionBadge[] }) {
  if (badges.length === 0) return null;

  return (
    <ul
      aria-label="Badges earned this session"
      className="mt-4 flex flex-wrap justify-center gap-2"
    >
      {badges.map((badge) => (
        <li
          key={badge.id}
          data-testid={`session-badge-${badge.id}`}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold",
            TONE_CLASSES[badge.tone],
          )}
        >
          <Award aria-hidden="true" className="h-3.5 w-3.5" />
          {badge.label}
        </li>
      ))}
    </ul>
  );
}
