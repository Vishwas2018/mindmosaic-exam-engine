import { describe, expect, it } from "vitest";

import {
  identitiesAreIndependent,
  identitiesAreIndependentForJudgementReview,
  normaliseIdentity,
  normaliseIdentityOrThrow,
} from "@/features/question-factory/config";

describe("normaliseIdentity", () => {
  it("resolves known aliases to a normalised identity", () => {
    expect(normaliseIdentity("claude")).toEqual({
      provider: "anthropic",
      modelId: "claude-sonnet-5",
      modelFamily: "claude",
      interactionMode: "api",
    });
  });

  it("is case-insensitive and trims whitespace", () => {
    const a = normaliseIdentity("Claude");
    const b = normaliseIdentity("  claude  ");
    const c = normaliseIdentity("CLAUDE");
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it("resolves distinct aliases for the same declared model to the same identity", () => {
    const a = normaliseIdentity("chatgpt");
    const b = normaliseIdentity("gpt-4o");
    expect(a).toEqual(b);
  });

  it("resolves qwen aliases independently of anthropic/openai", () => {
    const qwen = normaliseIdentity("qwen2.5");
    expect(qwen?.provider).toBe("qwen");
  });

  it("resolves human-authored declarations to the human provider", () => {
    expect(normaliseIdentity("hand-written")?.provider).toBe("human");
  });

  it("returns undefined for an unrecognised declared name", () => {
    expect(normaliseIdentity("some-made-up-model-xyz")).toBeUndefined();
  });

  it("is deterministic across repeated lookups", () => {
    const first = normaliseIdentity("claude-opus-4-8");
    const second = normaliseIdentity("claude-opus-4-8");
    expect(first).toEqual(second);
  });
});

describe("normaliseIdentity — PB1 provenance remediation (claude-fable-5)", () => {
  const EXPECTED_FABLE_IDENTITY = {
    provider: "anthropic",
    modelId: "claude-fable-5",
    modelFamily: "claude",
    interactionMode: "api",
  };

  it.each(["claude-fable-5", "fable-5", "claude fable 5"])(
    "resolves alias '%s' to the canonical claude-fable-5 identity",
    (alias) => {
      expect(normaliseIdentity(alias)).toEqual(EXPECTED_FABLE_IDENTITY);
    },
  );

  it("is case-insensitive and trims whitespace for the new aliases too", () => {
    expect(normaliseIdentity("Claude-Fable-5")).toEqual(EXPECTED_FABLE_IDENTITY);
    expect(normaliseIdentity("  fable-5  ")).toEqual(EXPECTED_FABLE_IDENTITY);
  });

  it("leaves every unrelated Claude alias resolving exactly as before", () => {
    expect(normaliseIdentity("claude")?.modelId).toBe("claude-sonnet-5");
    expect(normaliseIdentity("sonnet-5")?.modelId).toBe("claude-sonnet-5");
    expect(normaliseIdentity("opus")?.modelId).toBe("claude-opus-4-8");
    expect(normaliseIdentity("claude-opus-4-8")?.modelId).toBe("claude-opus-4-8");
    expect(normaliseIdentity("haiku")?.modelId).toBe("claude-haiku-4-5");
    expect(normaliseIdentity("claude-haiku-4-5")?.modelId).toBe("claude-haiku-4-5");
  });

  it("leaves non-Claude providers resolving exactly as before", () => {
    expect(normaliseIdentity("chatgpt")?.provider).toBe("openai");
    expect(normaliseIdentity("qwen")?.provider).toBe("qwen");
    expect(normaliseIdentity("human")?.provider).toBe("human");
  });

  it("fable-5 is independent from every other Claude model (different modelId)", () => {
    const fable = normaliseIdentityOrThrow("claude-fable-5");
    const sonnet = normaliseIdentityOrThrow("claude");
    const opus = normaliseIdentityOrThrow("opus");
    expect(identitiesAreIndependent(fable, sonnet)).toBe(true);
    expect(identitiesAreIndependent(fable, opus)).toBe(true);
  });

  it("does not accept a made-up Fable-adjacent string that was never declared as an alias", () => {
    expect(normaliseIdentity("claude-fable-6")).toBeUndefined();
    expect(normaliseIdentity("fable")).toBeUndefined();
  });
});

describe("normaliseIdentity — Gemini provider", () => {
  const EXPECTED_GEMINI_IDENTITY = {
    provider: "gemini",
    modelId: "gemini",
    modelFamily: "gemini",
    interactionMode: "api",
  };

  it.each([
    "gemini",
    "google-gemini",
    "gemini-pro",
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-2.0-flash",
    "gemini-2.5-pro",
    "gemini-2.5-flash",
  ])("resolves alias '%s' to the canonical gemini identity", (alias) => {
    expect(normaliseIdentity(alias)).toEqual(EXPECTED_GEMINI_IDENTITY);
  });

  it("is case-insensitive and trims whitespace for Gemini aliases too", () => {
    expect(normaliseIdentity("Gemini-2.5-Pro")).toEqual(EXPECTED_GEMINI_IDENTITY);
    expect(normaliseIdentity("  gemini  ")).toEqual(EXPECTED_GEMINI_IDENTITY);
  });

  it("leaves every other provider resolving exactly as before", () => {
    expect(normaliseIdentity("claude")?.provider).toBe("anthropic");
    expect(normaliseIdentity("chatgpt")?.provider).toBe("openai");
    expect(normaliseIdentity("qwen")?.provider).toBe("qwen");
    expect(normaliseIdentity("human")?.provider).toBe("human");
  });

  it("gemini is independent from every other provider (different provider)", () => {
    const gemini = normaliseIdentityOrThrow("gemini");
    expect(identitiesAreIndependent(gemini, normaliseIdentityOrThrow("claude"))).toBe(true);
    expect(identitiesAreIndependent(gemini, normaliseIdentityOrThrow("chatgpt"))).toBe(true);
    expect(identitiesAreIndependent(gemini, normaliseIdentityOrThrow("qwen"))).toBe(true);
  });

  it("two Gemini aliases (different declared model names) are NOT independent of each other", () => {
    const generatorGemini = normaliseIdentityOrThrow("gemini-2.5-pro");
    const reviewerGemini = normaliseIdentityOrThrow("gemini-2.5-flash");
    // Same normalised (provider, modelId, modelFamily) triple — one Gemini
    // snapshot reviewing another Gemini snapshot's output is not independent.
    expect(identitiesAreIndependent(generatorGemini, reviewerGemini)).toBe(false);
  });
});

describe("identitiesAreIndependentForJudgementReview — P0-C generator≠auditor rule", () => {
  it("is true for a Gemini generator reviewed by a non-Gemini (Anthropic) reviewer", () => {
    const generator = normaliseIdentityOrThrow("gemini");
    const reviewer = normaliseIdentityOrThrow("claude");
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(true);
  });

  it("is true for a Gemini generator reviewed by a non-Gemini (OpenAI) reviewer", () => {
    const generator = normaliseIdentityOrThrow("gemini");
    const reviewer = normaliseIdentityOrThrow("chatgpt");
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(true);
  });

  it("is true for a non-Gemini generator reviewed by a Gemini reviewer", () => {
    const generator = normaliseIdentityOrThrow("qwen");
    const reviewer = normaliseIdentityOrThrow("gemini");
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(true);
  });

  it("is FALSE for a Gemini generator reviewed by a Gemini reviewer, even under different declared aliases — a Gemini reviewer is not independent of a Gemini generator", () => {
    const generator = normaliseIdentityOrThrow("gemini-2.5-pro");
    const reviewer = normaliseIdentityOrThrow("gemini-2.5-flash");
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(false);
  });

  it("is true for human-authored content reviewed by a Gemini reviewer", () => {
    const generator = normaliseIdentityOrThrow("human");
    const reviewer = normaliseIdentityOrThrow("gemini");
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(true);
  });

  it("still enforces the pre-existing same-provider-different-model rule (Claude generator, Claude reviewer)", () => {
    // Not Gemini-specific — asserted here so this describe block documents
    // the whole rule, not just the Gemini slice of it: a same-provider
    // pairing fails even when the identity triple itself would look
    // "different" (different modelId), because judgement-review
    // independence requires a different *provider*, not just a different
    // model (see the docblock on identitiesAreIndependentForJudgementReview).
    const generator = normaliseIdentityOrThrow("claude-sonnet-5");
    const reviewer = normaliseIdentityOrThrow("claude-opus-4-8");
    expect(identitiesAreIndependent(generator, reviewer)).toBe(true); // different modelId
    expect(identitiesAreIndependentForJudgementReview(generator, reviewer)).toBe(false); // same provider
  });
});

describe("normaliseIdentityOrThrow", () => {
  it("returns the normalised identity for a known alias", () => {
    expect(normaliseIdentityOrThrow("qwen-max").provider).toBe("qwen");
  });

  it("throws for an unrecognised declared name", () => {
    expect(() => normaliseIdentityOrThrow("totally-unknown-model")).toThrow(
      /unknown model identity/i,
    );
  });
});

describe("identitiesAreIndependent", () => {
  it("is false for the exact same identity", () => {
    const identity = normaliseIdentityOrThrow("claude");
    expect(identitiesAreIndependent(identity, identity)).toBe(false);
  });

  it("is false for two different aliases that resolve to the same identity", () => {
    const a = normaliseIdentityOrThrow("claude-sonnet-5");
    const b = normaliseIdentityOrThrow("sonnet-5");
    expect(identitiesAreIndependent(a, b)).toBe(false);
  });

  it("is true across different providers (qwen generator, claude reviewer)", () => {
    const generator = normaliseIdentityOrThrow("qwen");
    const reviewer = normaliseIdentityOrThrow("claude");
    expect(identitiesAreIndependent(generator, reviewer)).toBe(true);
  });

  it("is true across different providers (claude generator, chatgpt reviewer)", () => {
    const generator = normaliseIdentityOrThrow("claude");
    const reviewer = normaliseIdentityOrThrow("chatgpt");
    expect(identitiesAreIndependent(generator, reviewer)).toBe(true);
  });

  it("is true across different providers (chatgpt generator, qwen reviewer)", () => {
    const generator = normaliseIdentityOrThrow("chatgpt");
    const reviewer = normaliseIdentityOrThrow("qwen");
    expect(identitiesAreIndependent(generator, reviewer)).toBe(true);
  });

  it("is true for human-authored content reviewed by any approved AI reviewer", () => {
    const generator = normaliseIdentityOrThrow("human");
    const reviewer = normaliseIdentityOrThrow("claude");
    expect(identitiesAreIndependent(generator, reviewer)).toBe(true);
  });

  it("is false within the same model family even under different display aliases", () => {
    const a = normaliseIdentityOrThrow("claude-opus-4-8");
    const b = normaliseIdentityOrThrow("opus");
    expect(identitiesAreIndependent(a, b)).toBe(false);
  });

  it("is true across different model ids within the same provider and family", () => {
    const sonnet = normaliseIdentityOrThrow("claude-sonnet-5");
    const opus = normaliseIdentityOrThrow("claude-opus-4-8");
    // Different modelId -> not the same identity, even though both are anthropic/claude family.
    expect(identitiesAreIndependent(sonnet, opus)).toBe(true);
  });
});
