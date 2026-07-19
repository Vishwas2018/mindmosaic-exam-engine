import { Badge, type BadgeVariant } from "@/components/ui";

import type { StudentStanding } from "../analytics";

const STANDING_PRESENTATION: Record<
  StudentStanding,
  { label: string; variant: BadgeVariant }
> = {
  on_track: { label: "On track", variant: "success" },
  needs_attention: { label: "Needs attention", variant: "warning" },
  at_risk: { label: "At risk", variant: "error" },
};

export function StandingBadge({ standing }: { standing: StudentStanding }) {
  const { label, variant } = STANDING_PRESENTATION[standing];
  return <Badge variant={variant}>{label}</Badge>;
}
