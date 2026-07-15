import { z } from "zod";

import { FACTORY_LIMITS } from "./limits";

/**
 * Normalised generator/reviewer identity, per the Shared Governance
 * reviewer-independence policy. Independence between a generator and a
 * reviewer is always decided on this normalised triple, never on the raw
 * declared name string.
 */
export const IDENTITY_PROVIDERS = ["anthropic", "openai", "qwen", "other", "human"] as const;
export type IdentityProvider = (typeof IDENTITY_PROVIDERS)[number];

export const INTERACTION_MODES = ["external_manual", "api"] as const;
export type InteractionMode = (typeof INTERACTION_MODES)[number];

export const normalisedIdentitySchema = z.object({
  provider: z.enum(IDENTITY_PROVIDERS),
  modelId: z.string().trim().min(1).max(FACTORY_LIMITS.IDENTITY_MODEL_ID_MAX_LENGTH),
  modelFamily: z.string().trim().min(1).max(FACTORY_LIMITS.IDENTITY_MODEL_FAMILY_MAX_LENGTH),
  interactionMode: z.enum(INTERACTION_MODES),
});

export type NormalisedIdentity = z.infer<typeof normalisedIdentitySchema>;

interface IdentityAliasEntry {
  /** Lower-cased declared names/aliases that resolve to this identity. */
  readonly aliases: readonly string[];
  readonly identity: NormalisedIdentity;
}

/**
 * The identity-normalisation table: every declared model name a
 * generator or reviewer might report (including common aliases) maps to
 * exactly one normalised identity. Extend this table, never compare raw
 * strings, when a new provider/model needs to be recognised.
 */
const IDENTITY_ALIAS_TABLE: readonly IdentityAliasEntry[] = [
  {
    aliases: [
      "claude",
      "claude-sonnet-5",
      "claude sonnet 5",
      "sonnet-5",
      "claude-3-5-sonnet",
      "claude-3.5-sonnet",
    ],
    identity: {
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      modelFamily: "claude",
      interactionMode: "api",
    },
  },
  {
    aliases: ["claude-fable-5", "fable-5", "claude fable 5"],
    identity: {
      provider: "anthropic",
      modelId: "claude-fable-5",
      modelFamily: "claude",
      interactionMode: "api",
    },
  },
  {
    aliases: ["claude-opus-4-8", "claude opus 4.8", "opus-4.8", "opus"],
    identity: {
      provider: "anthropic",
      modelId: "claude-opus-4-8",
      modelFamily: "claude",
      interactionMode: "api",
    },
  },
  {
    aliases: ["claude-haiku-4-5", "claude haiku 4.5", "haiku-4.5", "haiku"],
    identity: {
      provider: "anthropic",
      modelId: "claude-haiku-4-5",
      modelFamily: "claude",
      interactionMode: "api",
    },
  },
  {
    aliases: ["chatgpt", "gpt-4", "gpt-4o", "gpt-4-turbo", "openai-gpt-4", "openai"],
    identity: {
      provider: "openai",
      modelId: "gpt-4",
      modelFamily: "gpt",
      interactionMode: "external_manual",
    },
  },
  {
    aliases: ["qwen", "qwen2", "qwen2.5", "qwen-max", "tongyi-qianwen"],
    identity: {
      provider: "qwen",
      modelId: "qwen-max",
      modelFamily: "qwen",
      interactionMode: "external_manual",
    },
  },
  {
    aliases: ["human", "maintainer", "hand-written", "hand-authored"],
    identity: {
      provider: "human",
      modelId: "human",
      modelFamily: "human",
      interactionMode: "external_manual",
    },
  },
  {
    aliases: ["deterministic-fixture-generator", "fixture-generator", "deterministic_fixture"],
    identity: {
      provider: "other",
      modelId: "deterministic-fixture-generator",
      modelFamily: "fixture",
      interactionMode: "api",
    },
  },
];

const aliasLookup = new Map<string, NormalisedIdentity>();
for (const entry of IDENTITY_ALIAS_TABLE) {
  for (const alias of entry.aliases) {
    aliasLookup.set(alias.toLowerCase(), entry.identity);
  }
}

export function normaliseIdentity(declaredName: string): NormalisedIdentity | undefined {
  return aliasLookup.get(declaredName.trim().toLowerCase());
}

export function normaliseIdentityOrThrow(declaredName: string): NormalisedIdentity {
  const identity = normaliseIdentity(declaredName);
  if (!identity) {
    throw new Error(`Unknown model identity '${declaredName}': no identity-alias entry matches.`);
  }
  return identity;
}

/**
 * Independence per Shared Governance: decided on the normalised identity
 * triple (provider + modelId + modelFamily), never on interactionMode or
 * on the raw declared display name.
 */
export function identitiesAreIndependent(a: NormalisedIdentity, b: NormalisedIdentity): boolean {
  return !(a.provider === b.provider && a.modelId === b.modelId && a.modelFamily === b.modelFamily);
}
