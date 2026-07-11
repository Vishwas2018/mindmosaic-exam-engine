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
] as const;
export type GeneratorClass = (typeof GENERATOR_CLASSES)[number];

export const generatorAdapterSchema = z.object({
  class: z.enum(GENERATOR_CLASSES),
  identity: normalisedIdentitySchema,
});

export type GeneratorAdapter = z.infer<typeof generatorAdapterSchema>;
