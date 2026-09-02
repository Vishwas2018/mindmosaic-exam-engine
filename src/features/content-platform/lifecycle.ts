import type { z } from "zod";
import { lifecycleStateSchema } from "./contracts";

export type ContentLifecycleState = z.infer<typeof lifecycleStateSchema>;

const transitions: Readonly<Record<ContentLifecycleState, readonly ContentLifecycleState[]>> = {
  draft: ["generated", "validated"],
  generated: ["validated"],
  validated: ["reviewed"],
  reviewed: ["approved", "draft"],
  approved: ["published", "draft"],
  published: ["retired"],
  retired: [],
};

export function canTransitionContent(from: ContentLifecycleState, to: ContentLifecycleState): boolean {
  return transitions[from].includes(to);
}

export function assertContentTransition(from: ContentLifecycleState, to: ContentLifecycleState): void {
  if (!canTransitionContent(from, to)) throw new Error(`Illegal content lifecycle transition: ${from} -> ${to}`);
}

export function actorMayTransition(actor: "agent" | "owner" | "publication_service", to: ContentLifecycleState): boolean {
  if (to === "approved") return actor === "owner";
  if (to === "published" || to === "retired") return actor === "publication_service";
  return true;
}
