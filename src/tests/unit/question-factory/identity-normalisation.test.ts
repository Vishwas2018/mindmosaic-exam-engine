import { describe, expect, it } from "vitest";

import {
  identitiesAreIndependent,
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
