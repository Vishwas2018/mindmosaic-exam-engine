import { Gauge, ShieldQuestion, Users } from "lucide-react";

import { Badge, Card } from "@/components/ui";

const STUBS = [
  {
    icon: ShieldQuestion,
    title: "Content quality",
    description:
      "Flagged questions, review queues and moderation actions for the question bank.",
  },
  {
    icon: Users,
    title: "Users",
    description:
      "Account search, role changes and support actions across every profile.",
  },
  {
    icon: Gauge,
    title: "Platform monitoring",
    description: "Uptime, error rates and latency for the exam engine's core services.",
  },
] as const;

/** Placeholder cards for sections not built yet — keeps the nav's future shape visible without a route. */
export function RoadmapStubs() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {STUBS.map((stub) => {
        const Icon = stub.icon;
        return (
          <Card key={stub.title} variant="outlined" className="p-6">
            <div className="flex items-center justify-between">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-royal/8 text-royal">
                <Icon aria-hidden="true" className="h-5 w-5" />
              </span>
              <Badge variant="neutral">Coming soon</Badge>
            </div>
            <h3 className="mt-4 text-[15px] font-extrabold text-ink">{stub.title}</h3>
            <p className="mt-2 text-sm leading-6 text-muted">{stub.description}</p>
          </Card>
        );
      })}
    </div>
  );
}
