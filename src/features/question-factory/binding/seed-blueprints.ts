import type { Blueprint } from "../blueprints";
import { hashJson } from "../provenance";
import type { FactoryRepository } from "../storage";

export interface SeedBlueprintsResult {
  readonly created: number;
  readonly replayed: number;
  readonly conflicts: readonly { readonly blueprintId: string; readonly message: string }[];
}

/**
 * Idempotently installs a reviewed blueprint set into the workspace's
 * `blueprints` compartment. Per record: absent → create; present and
 * byte-equivalent (same `hashJson`) → no-op replay; present but different →
 * conflict, never overwritten. Crash/retry safe by construction: each
 * record is an independent atomic `create`, so a run interrupted after N
 * records resumes by replaying those N and creating the rest — re-running
 * with the identical set always converges on created+replayed = set size,
 * with zero rewrites of existing bytes.
 */
export async function seedBindingBlueprints(
  blueprints: readonly Blueprint[],
  repository: FactoryRepository,
): Promise<SeedBlueprintsResult> {
  let created = 0;
  let replayed = 0;
  const conflicts: { blueprintId: string; message: string }[] = [];

  for (const blueprint of blueprints) {
    const existing = await repository.read("blueprints", blueprint.id);
    if (existing !== undefined) {
      if (hashJson(existing) === hashJson(blueprint)) {
        replayed += 1;
        continue;
      }
      conflicts.push({
        blueprintId: blueprint.id,
        message: `Blueprint '${blueprint.id}' already exists with different content — refusing to overwrite.`,
      });
      continue;
    }
    const outcome = await repository.create("blueprints", blueprint.id, blueprint);
    if (!outcome.ok) {
      // A concurrent seeder may have won the create race; re-read and treat
      // an identical record as a replay rather than a failure.
      const raced = await repository.read("blueprints", blueprint.id);
      if (raced !== undefined && hashJson(raced) === hashJson(blueprint)) {
        replayed += 1;
        continue;
      }
      conflicts.push({ blueprintId: blueprint.id, message: outcome.message });
      continue;
    }
    created += 1;
  }

  return { created, replayed, conflicts };
}
