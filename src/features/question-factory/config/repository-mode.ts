import { z } from "zod";

/**
 * `production` publishes into the real question bank; `isolated_test`
 * publishes only into an explicit isolated fixture bank path (Mission 4).
 * Production publication must refuse `deterministic_fixture` provenance
 * regardless of mode, and must refuse to run at all outside these two
 * modes.
 */
export const REPOSITORY_MODES = ["production", "isolated_test"] as const;
export const repositoryModeSchema = z.enum(REPOSITORY_MODES);
export type RepositoryMode = z.infer<typeof repositoryModeSchema>;

export const DEFAULT_REPOSITORY_MODE: RepositoryMode = "production";
