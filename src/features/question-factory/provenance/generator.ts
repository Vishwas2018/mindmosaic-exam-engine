import { z } from "zod";

import { normalisedIdentitySchema } from "../config/identity-normalisation";

/**
 * `deterministic_fixture` is never publishable to the real production
 * bank; `manual_external` is untrusted external-LLM/hand-written content
 * ingested via the inbox workflow; `live_provider` is a wired API
 * adapter (future). See Shared Governance "Generator classes and the
 * manual/external path".
 */
export const GENERATOR_CLASSES = [
  "deterministic_fixture",
  "manual_external",
  "live_provider",
  "legacy_import",
] as const;
export type GeneratorClass = (typeof GENERATOR_CLASSES)[number];

export const knownGeneratorAdapterSchema = z.object({
  class: z.enum(["deterministic_fixture", "manual_external", "live_provider"]),
  identity: normalisedIdentitySchema,
});

export const generatorAdapterSchema = z.union([
  knownGeneratorAdapterSchema,
  z.object({ class: z.literal("legacy_import"), identity: z.null() }).strict(),
]);

export type GeneratorAdapter = z.infer<typeof generatorAdapterSchema>;
export type KnownGeneratorAdapter = z.infer<typeof knownGeneratorAdapterSchema>;
